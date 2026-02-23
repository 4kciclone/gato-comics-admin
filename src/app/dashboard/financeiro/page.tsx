import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, CreditCard, DollarSign, Crown, ArrowDownRight, ArrowUpRight, BarChart3, PieChart } from "lucide-react";
import { FinancialCharts } from "@/components/admin/finance/financial-charts";
import { ExportButtons } from "./export-buttons";
import { subDays, format, startOfMonth, endOfMonth, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { COIN_PACKS, SUBSCRIPTION_PLANS } from "@/lib/shop-config";
import { DateRangeFilter } from "@/components/admin/finance/date-range-filter"; // Vamos criar esse componente
import { TransactionsTable } from "@/components/admin/finance/transactions-table"; // E esse também
import { WorksRevenueTable } from "@/components/admin/finance/works-revenue-table"; // E esse

const formatBRL = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Função auxiliar para calcular variação percentual
const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function FinanceiroPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session || !["OWNER", "ACCOUNTANT"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  
  // 1. Definição do Período (Atual vs Anterior para comparação)
  const today = new Date();
  const defaultFrom = subDays(today, 30);
  
  const fromDate = params.from && isValid(parseISO(params.from)) ? parseISO(params.from) : defaultFrom;
  const toDate = params.to && isValid(parseISO(params.to)) ? parseISO(params.to) : today;

  // Período anterior (para cálculo de variação)
  const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  const prevFromDate = subDays(fromDate, daysDiff);
  const prevToDate = subDays(toDate, daysDiff);

  // 2. BUSCAR DADOS (ATUAL E ANTERIOR)
  const [
    currentDeposits, prevDeposits, 
    subscribers, canceledSubs,
    works, 
    liteBatches,
    totalUsers
  ] = await Promise.all([
    // Depósitos Atuais
    prisma.transaction.findMany({
      where: { type: "DEPOSIT", currency: "PREMIUM", createdAt: { gte: fromDate, lte: toDate } },
      select: { amount: true, createdAt: true, description: true }
    }),
    // Depósitos Anteriores (para KPI)
    prisma.transaction.findMany({
      where: { type: "DEPOSIT", currency: "PREMIUM", createdAt: { gte: prevFromDate, lte: prevFromDate } },
      select: { amount: true }
    }),
    // Assinantes Ativos
    prisma.user.findMany({
      where: { subscriptionTier: { not: null } },
      select: { subscriptionTier: true }
    }),
    // Churn (Cancelamentos no período - assumindo que logamos isso em activity_logs ou similar)
    // Se não tiver log de cancelamento, usamos users com validade passada
    prisma.user.count({
      where: { 
        subscriptionTier: null, 
        subscriptionValidUntil: { gte: fromDate, lte: toDate } // Expirou nesse período
      }
    }),
    // Obras com Vendas
    prisma.work.findMany({
      select: {
        id: true,
        title: true,
        owner: { select: { name: true, email: true } }, // Para repasse
        chapters: {
          select: {
            pricePremium: true,
            unlocks: { 
              where: { type: "PERMANENT", createdAt: { gte: fromDate, lte: toDate } }, 
              select: { id: true } 
            }
          }
        }
      }
    }),
    // Lite Coins (Origem)
    prisma.liteCoinBatch.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate } },
      select: { amount: true, source: true, sourceDetails: true }
    }),
    prisma.user.count()
  ]);

  // =================================================================
  // 3. CÁLCULO FINANCEIRO AVANÇADO
  // =================================================================
  
  // Função para converter moedas em BRL
  const calculateRevenue = (transactions: { amount: number, description?: string | null }[]) => {
    let revenue = 0;
    let coins = 0;
    transactions.forEach(tx => {
        // Tenta achar pacote pelo valor exato ou pela descrição
        const pack = Object.values(COIN_PACKS).find(p => p.premium === tx.amount);
        if (pack) {
            revenue += pack.price / 100;
        } else {
            revenue += tx.amount * 0.05; // Fallback
        }
        coins += tx.amount;
    });
    return { revenue, coins };
  };

  const currentSales = calculateRevenue(currentDeposits);
  const prevSales = calculateRevenue(prevDeposits);

  const averageCoinValue = currentSales.coins > 0 ? (currentSales.revenue / currentSales.coins) : 0.05;

  // MRR (Receita Recorrente Mensal)
  // Agrupado por Plano
  const mrrByPlan = { BRONZE: 0, SILVER: 0, GOLD: 0, DIAMOND: 0 };
  let totalMRR = 0;

  subscribers.forEach(sub => {
    if(!sub.subscriptionTier) return;
    const planKey = `sub_${sub.subscriptionTier.toLowerCase()}`;
    // @ts-ignore
    const plan = SUBSCRIPTION_PLANS[planKey];
    if (plan) {
        const val = plan.price / 100;
        mrrByPlan[sub.subscriptionTier] += val;
        totalMRR += val;
    }
  });

  // KPIs Finais
  const totalRevenue = currentSales.revenue + totalMRR;
  const revenueGrowth = calculateGrowth(currentSales.revenue, prevSales.revenue); // Apenas vendas avulsas, MRR é snapshot
  
  const arpu = totalUsers > 0 ? totalRevenue / totalUsers : 0;
  const churnRate = (subscribers.length + canceledSubs) > 0 
    ? (canceledSubs / (subscribers.length + canceledSubs)) * 100 
    : 0;

  // =================================================================
  // 4. DADOS PARA TABELAS E GRÁFICOS
  // =================================================================

  // Gráfico de Área (Evolução Diária)
  const revenueMap = new Map<string, number>();
  currentDeposits.forEach(t => {
    const dateKey = format(t.createdAt, 'dd/MM', { locale: ptBR });
    const valueBRL = t.amount * averageCoinValue; 
    revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + valueBRL);
  });
  
  // Preenche dias vazios
  const chartData = [];
  let loopDate = new Date(fromDate);
  while (loopDate <= toDate) {
      const key = format(loopDate, 'dd/MM', { locale: ptBR });
      chartData.push({ date: key, value: revenueMap.get(key) || 0 });
      loopDate.setDate(loopDate.getDate() + 1);
  }

  // Tabela de Obras (Receita e Repasse)
  const worksData = works.map(w => {
    let coinsEarned = 0;
    w.chapters.forEach(c => {
        coinsEarned += c.unlocks.length * c.pricePremium;
    });
    const grossRevenue = coinsEarned * averageCoinValue;
    // Exemplo: Repasse de 50% para o autor (ajuste conforme seu contrato)
    const partnerShare = grossRevenue * 0.5; 
    
    return { 
        id: w.id,
        title: w.title, 
        owner: w.owner?.name || "Gato Comics",
        sales: coinsEarned,
        revenue: grossRevenue,
        partnerShare
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Lite Coins Report
  const liteSourceData = liteBatches.reduce((acc, batch) => {
    const source = batch.source || 'OTHER';
    acc[source] = (acc[source] || 0) + batch.amount;
    return acc;
  }, {} as Record<string, number>);

  const liteChartData = Object.entries(liteSourceData).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 pb-20">
      
      {/* HEADER E FILTROS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Painel Financeiro</h1>
          <p className="text-zinc-400 mt-1 flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
            Cotação média: <span className="text-white font-mono font-bold">{formatBRL(averageCoinValue)}</span> / patinha
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <DateRangeFilter from={fromDate} to={toDate} />
            <ExportButtons />
        </div>
      </div>

      {/* KPIS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
            title="Receita Total" 
            value={formatBRL(totalRevenue)} 
            icon={DollarSign} 
            growth={revenueGrowth}
            color="text-green-400"
        />
        <KpiCard 
            title="MRR (Assinaturas)" 
            value={formatBRL(totalMRR)} 
            icon={Crown} 
            desc={`${subscribers.length} ativos`}
            color="text-[#FFD700]"
        />
        <KpiCard 
            title="ARPU" 
            value={formatBRL(arpu)} 
            icon={Users} 
            desc="Ticket médio"
            color="text-blue-400"
        />
        <KpiCard 
            title="Churn Rate" 
            value={`${churnRate.toFixed(1)}%`} 
            icon={TrendingUp} 
            desc={`${canceledSubs} cancelamentos`}
            isNegative={true} // Churn alto é ruim
            color="text-red-400"
        />
      </div>

      {/* CONTEÚDO EM ABAS */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-6 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800">Visão Geral</TabsTrigger>
            <TabsTrigger value="works" className="data-[state=active]:bg-zinc-800">Obras & Repasse</TabsTrigger>
            <TabsTrigger value="lite" className="data-[state=active]:bg-zinc-800">Economia Lite</TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-zinc-800">Transações</TabsTrigger>
        </TabsList>

        {/* 1. VISÃO GERAL */}
        <TabsContent value="overview" className="space-y-6 animate-in fade-in-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <FinancialCharts 
                        revenueOverTime={chartData} 
                        revenueBySource={[
                            { name: 'Assinaturas', value: totalMRR },
                            { name: 'Avulso', value: currentSales.revenue }
                        ]}
                        topWorks={worksData.slice(0, 5).map(w => ({ name: w.title, revenue: w.revenue }))}
                    />
                </div>
                
                {/* CARD DE DETALHES DE ASSINATURA */}
                <div className="space-y-4">
                    <Card className="bg-[#111] border-zinc-800 h-full">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Crown className="w-4 h-4 text-[#FFD700]" /> Receita por Plano
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(mrrByPlan).map(([tier, value]) => (
                                <div key={tier} className="flex justify-between items-center p-3 rounded bg-zinc-900/50 border border-zinc-800">
                                    <span className="font-bold text-xs text-zinc-400">{tier}</span>
                                    <span className="font-mono text-white">{formatBRL(value)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>

        {/* 2. OBRAS & REPASSE */}
        <TabsContent value="works">
            <WorksRevenueTable data={worksData} />
        </TabsContent>

        {/* 3. ECONOMIA LITE */}
        <TabsContent value="lite">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[#111] border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Distribuição de Moedas Grátis</CardTitle>
                        <CardDescription>Origem das Patinhas Lite circulando no sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Aqui você pode usar um gráfico de Pizza (PieChart) */}
                        <div className="space-y-2">
                            {liteChartData.map((item) => (
                                <div key={item.name} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
                                    <span className="text-zinc-400 text-sm">{item.name.replace('_', ' ')}</span>
                                    <span className="text-white font-bold">{item.value.toLocaleString()} 🐾</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        {/* 4. TRANSAÇÕES BRUTAS */}
        <TabsContent value="transactions">
            <TransactionsTable transactions={currentDeposits} />
        </TabsContent>

      </Tabs>
    </div>
  );
}

// Componente KPI Melhorado
function KpiCard({ title, value, icon: Icon, desc, growth, color, isNegative }: any) {
    const isGrowthPositive = growth >= 0;
    // Se for KPI negativo (ex: churn), crescer é ruim
    const growthColor = isNegative 
        ? (isGrowthPositive ? 'text-red-500' : 'text-green-500')
        : (isGrowthPositive ? 'text-green-500' : 'text-red-500');

    return (
        <Card className="bg-[#111] border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg bg-zinc-900/80 ${color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    {growth !== undefined && (
                        <div className={`flex items-center text-xs font-bold ${growthColor} bg-zinc-950 px-2 py-1 rounded-full border border-zinc-800`}>
                            {isGrowthPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {Math.abs(growth).toFixed(1)}%
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-zinc-400 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-2xl font-black text-white tracking-tight">{value}</h3>
                    {desc && <p className="text-xs text-zinc-500 mt-2">{desc}</p>}
                </div>
            </CardContent>
        </Card>
    )
}