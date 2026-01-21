import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, CreditCard, DollarSign, Crown } from "lucide-react";
import { FinancialCharts } from "@/components/admin/finance/financial-charts";
import { ExportButtons } from "./export-buttons";
import { subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { COIN_PACKS, SUBSCRIPTION_PLANS } from "@/lib/shop-config"; // Importamos os preços reais

const formatBRL = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default async function FinanceiroPage() {
  const session = await auth();
  if (!session || !["OWNER", "ACCOUNTANT"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);

  // 1. BUSCAR DADOS BRUTOS
  const [deposits, subscribers, works, totalUsers] = await Promise.all([
    // Todas as compras de pacotes (DEPOSIT)
    prisma.transaction.findMany({
      where: { type: "DEPOSIT", currency: "PREMIUM", createdAt: { gte: thirtyDaysAgo } },
      select: { amount: true, createdAt: true, description: true }
    }),
    // Assinantes
    prisma.user.findMany({
      where: { subscriptionTier: { not: null } },
      select: { subscriptionTier: true }
    }),
    // Obras
    prisma.work.findMany({
      select: {
        title: true,
        chapters: {
          select: {
            pricePremium: true,
            unlocks: { 
              where: { type: "PERMANENT" }, 
              select: { id: true } 
            }
          }
        }
      }
    }),
    prisma.user.count()
  ]);

  // =================================================================
  // 2. CÁLCULO DO VALOR REAL DA PATINHA (Weighted Average)
  // =================================================================
  
  let totalRevenueSalesBRL = 0;
  let totalCoinsSold = 0;

  // Analisa cada transação para descobrir quanto dinheiro real entrou
  deposits.forEach(tx => {
    // Tenta achar qual pacote foi comprado comparando a quantidade de moedas
    // (Isso é uma estimativa segura baseada na sua configuração)
    const pack = Object.values(COIN_PACKS).find(p => p.premium === tx.amount);
    
    if (pack) {
        totalRevenueSalesBRL += pack.price / 100; // Preço vem em centavos, dividimos por 100
    } else {
        // Se for um valor manual ou bonus, usamos uma média base de R$ 0,50 por 10 un (0.05)
        totalRevenueSalesBRL += tx.amount * 0.05; 
    }
    totalCoinsSold += tx.amount;
  });

  // VALOR MÉDIO DA MOEDA NO SISTEMA
  // Se vendeu 0, evita divisão por zero
  const averageCoinValue = totalCoinsSold > 0 ? (totalRevenueSalesBRL / totalCoinsSold) : 0.05;

  // =================================================================
  // 3. CÁLCULO DE ASSINATURAS (MRR)
  // =================================================================
  const mrr = subscribers.reduce((acc, user) => {
    const planKey = `sub_${user.subscriptionTier?.toLowerCase()}`;
    // @ts-ignore
    const plan = SUBSCRIPTION_PLANS[planKey];
    return acc + (plan ? plan.price / 100 : 0);
  }, 0);

  // =================================================================
  // 4. PREPARAÇÃO DOS DADOS PARA OS GRÁFICOS
  // =================================================================

  const totalRevenueMonth = totalRevenueSalesBRL + mrr;
  const arpu = totalUsers > 0 ? totalRevenueMonth / totalUsers : 0;

  // Gráfico de Área (Evolução)
  const revenueMap = new Map<string, number>();
  deposits.forEach(t => {
    const dateKey = format(t.createdAt, 'dd/MM', { locale: ptBR });
    // Usamos o valor médio calculado para plotar o gráfico
    const valueBRL = t.amount * averageCoinValue; 
    revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + valueBRL);
  });
  
  const chartData = Array.from({ length: 30 }).map((_, i) => {
    const d = subDays(today, 29 - i);
    const key = format(d, 'dd/MM', { locale: ptBR });
    return { date: key, value: revenueMap.get(key) || 0 };
  });

  // Ranking de Obras (Usando o valor médio calculado)
  const worksRanking = works.map(w => {
    let revenue = 0;
    w.chapters.forEach(c => {
        // Quantidade de Vendas * Preço do Cap * Valor Médio da Moeda
        revenue += (c.unlocks.length * c.pricePremium) * averageCoinValue;
    });
    return { name: w.title, revenue };
  })
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 5);

  const revenueBySource = [
    { name: 'Assinaturas (MRR)', value: Number(mrr.toFixed(2)) },
    { name: 'Vendas Avulsas', value: Number(totalRevenueSalesBRL.toFixed(2)) }
  ];

  return (
    <div className="space-y-8 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Painel Financeiro</h1>
          <p className="text-zinc-400">
            Cotação média atual: <span className="text-green-400 font-mono font-bold">{formatBRL(averageCoinValue)}</span> / patinha
          </p>
        </div>
        <ExportButtons />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
            title="Receita Mensal (MRR)" 
            value={formatBRL(mrr)} 
            icon={Crown} 
            desc="Assinaturas ativas"
            color="text-[#FFD700]"
        />
        <KpiCard 
            title="Vendas Avulsas (30d)" 
            value={formatBRL(totalRevenueSalesBRL)} 
            icon={CreditCard} 
            desc={`~ ${totalCoinsSold} patinhas vendidas`}
            color="text-blue-400"
        />
        <KpiCard 
            title="ARPU" 
            value={formatBRL(arpu)} 
            icon={Users} 
            desc="Receita média por usuário"
            color="text-purple-400"
        />
        <KpiCard 
            title="Receita Total (Est.)" 
            value={formatBRL(totalRevenueMonth)} 
            icon={TrendingUp} 
            desc="Faturamento bruto estimado"
            color="text-green-400"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="details">Relatórios Detalhados</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="animate-in fade-in-50">
            <FinancialCharts 
                revenueOverTime={chartData} 
                revenueBySource={revenueBySource}
                topWorks={worksRanking}
            />
        </TabsContent>

        <TabsContent value="details">
            <Card className="bg-[#111] border-zinc-800">
                <CardContent className="py-10 text-center text-zinc-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Use os botões de exportação acima para baixar os dados brutos.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, desc, color }: any) {
    return (
        <Card className="bg-[#111] border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-zinc-400 text-sm font-medium">{title}</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
                    </div>
                    <div className={`p-2 rounded-lg bg-zinc-900 ${color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
                <div className="text-xs text-zinc-500">{desc}</div>
            </CardContent>
        </Card>
    )
}