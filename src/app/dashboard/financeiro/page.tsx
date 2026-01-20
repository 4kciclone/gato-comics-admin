import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, CreditCard, DollarSign, Crown } from "lucide-react";
import { FinancialCharts } from "@/components/admin/finance/financial-charts";
import { ExportButtons } from "./export-buttons"; // Componente que já criamos antes
import { subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- CONSTANTES DE NEGÓCIO ---
// Como a tabela Transaction salva em "Patinhas" e não em "Reais",
// definimos aqui a taxa média de conversão para relatórios.
// Ex: Se 100 patinhas custam R$ 4,99, então 1 patinha = R$ 0,0499
const CONVERSION_RATE = 0.0499; 

// Valores fixos das assinaturas (usado para calcular MRR)
const SUBSCRIPTION_PRICES: Record<string, number> = {
  BRONZE: 6.99,
  SILVER: 14.99,
  GOLD: 25.99,
  DIAMOND: 35.99
};

const formatBRL = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default async function FinanceiroPage() {
  const session = await auth();
  if (!session || !["OWNER", "ACCOUNTANT"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // =================================================================
  // 1. EXTRAÇÃO DE DADOS (Queries Paralelas)
  // =================================================================
  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);

  const [deposits, subscribers, works, totalUsers] = await Promise.all([
    // A. Transações de Venda (Últimos 30 dias)
    prisma.transaction.findMany({
      where: { 
        type: "DEPOSIT", 
        currency: "PREMIUM",
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { amount: true, createdAt: true }
    }),

    // B. Assinantes Ativos
    prisma.user.findMany({
      where: { subscriptionTier: { not: null } },
      select: { subscriptionTier: true }
    }),

    // C. Dados das Obras (Para ranking)
    prisma.work.findMany({
      select: {
        title: true,
        chapters: {
          select: {
            pricePremium: true,
            unlocks: { 
              where: { type: "PERMANENT" }, // Apenas vendas reais contam para receita
              select: { id: true } 
            }
          }
        }
      }
    }),

    // D. Total de Usuários (Para ARPU)
    prisma.user.count()
  ]);

  // =================================================================
  // 2. PROCESSAMENTO E CÁLCULOS (Business Logic)
  // =================================================================

  // --- Receita de Vendas Avulsas (Patinhas) ---
  const revenuePaws = deposits.reduce((acc, t) => acc + t.amount, 0);
  const revenueSalesBRL = revenuePaws * CONVERSION_RATE;

  // --- MRR (Monthly Recurring Revenue) ---
  // Soma do valor das assinaturas ativas
  const mrr = subscribers.reduce((acc, user) => {
    const tier = user.subscriptionTier as string;
    return acc + (SUBSCRIPTION_PRICES[tier] || 0);
  }, 0);

  // --- Receita Total Estimada (Mês) ---
  const totalRevenueMonth = revenueSalesBRL + mrr;

  // --- ARPU (Average Revenue Per User) ---
  const arpu = totalUsers > 0 ? totalRevenueMonth / totalUsers : 0;

  // --- Dados para Gráfico de Área (Evolução Diária) ---
  const revenueMap = new Map<string, number>();
  
  // Agrupa transações por dia
  deposits.forEach(t => {
    const dateKey = format(t.createdAt, 'dd/MM', { locale: ptBR });
    const valueBRL = t.amount * CONVERSION_RATE;
    revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + valueBRL);
  });
  
  // Preenche dias vazios com 0 para o gráfico não quebrar
  const chartData = Array.from({ length: 30 }).map((_, i) => {
    const d = subDays(today, 29 - i); // Do passado para hoje
    const key = format(d, 'dd/MM', { locale: ptBR });
    // Adiciona MRR diário pro-rata (opcional, aqui mostramos apenas vendas diretas no gráfico diário)
    return { date: key, value: revenueMap.get(key) || 0 };
  });

  // --- Dados para Gráfico de Barras (Top Obras) ---
  const worksRanking = works.map(w => {
    let revenue = 0;
    w.chapters.forEach(c => {
        // Receita = (Preço em Patinhas * Unlocks) * Taxa de Conversão
        revenue += (c.unlocks.length * c.pricePremium) * CONVERSION_RATE;
    });
    return { name: w.title, revenue };
  })
  .sort((a, b) => b.revenue - a.revenue) // Ordena maior para menor
  .slice(0, 5); // Pega top 5

  // --- Dados para Gráfico de Pizza (Fontes) ---
  const revenueBySource = [
    { name: 'Assinaturas (MRR)', value: Number(mrr.toFixed(2)) },
    { name: 'Vendas Avulsas', value: Number(revenueSalesBRL.toFixed(2)) }
  ];

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Painel Financeiro</h1>
          <p className="text-zinc-400">Inteligência de mercado e fluxo de caixa.</p>
        </div>
        <ExportButtons />
      </div>

      {/* KPI CARDS - O Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
            title="Receita Mensal (MRR)" 
            value={formatBRL(mrr)} 
            icon={Crown} 
            desc="Recorrente de assinaturas ativas"
            color="text-[#FFD700]"
        />
        <KpiCard 
            title="Vendas Avulsas (30d)" 
            value={formatBRL(revenueSalesBRL)} 
            icon={CreditCard} 
            desc={`~ ${revenuePaws.toLocaleString()} patinhas vendidas`}
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
            desc="Soma de MRR + Vendas"
            color="text-green-400"
        />
      </div>

      {/* ÁREA DE ANÁLISE VISUAL */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">
                Visão Geral
            </TabsTrigger>
            <TabsTrigger value="details">
                Relatórios Detalhados
            </TabsTrigger>
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
                    <p>Use os botões de exportação acima para baixar os dados brutos para contabilidade.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente de Card Simples (Pequeno e Reutilizável)
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