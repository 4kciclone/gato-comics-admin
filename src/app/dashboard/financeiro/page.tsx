import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Coins 
} from "lucide-react";
// Importa o componente cliente que lida com os downloads
import { ExportButtons } from "./export-buttons";

// Função para formatar números como Patinhas (Milhar)
const formatCoins = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

export default async function FinanceiroPage() {
  const session = await auth();
  
  // Segurança: Apenas Dono e Contador podem ver esta página
  if (!session || (session.user.role !== "OWNER" && session.user.role !== "ACCOUNTANT")) {
    redirect("/dashboard");
  }

  // ----------------------------------------------------------------------
  // 1. DADOS GERAIS (KPIs)
  // ----------------------------------------------------------------------
  
  // Total de Entradas (Vendas de Pacotes Premium)
  const deposits = await prisma.transaction.aggregate({
    where: { type: "DEPOSIT", currency: "PREMIUM" },
    _sum: { amount: true },
    _count: true
  });

  // Total de Consumo (Patinhas gastas lendo obras)
  const spent = await prisma.transaction.aggregate({
    where: { type: "SPEND" },
    _sum: { amount: true }
  });

  // Contagem de Assinantes por Nível
  const subscribers = await prisma.user.groupBy({
    by: ['subscriptionTier'],
    _count: { _all: true },
    where: { subscriptionTier: { not: null } }
  });

  // ----------------------------------------------------------------------
  // 2. RELATÓRIO DE PERFORMANCE POR OBRA
  // ----------------------------------------------------------------------
  const worksPerformance = await prisma.work.findMany({
    select: {
      id: true,
      title: true,
      _count: { select: { libraryEntries: true } }, // Leitores (biblioteca)
      chapters: {
        select: {
          pricePremium: true,
          priceLite: true,
          unlocks: {
            select: { type: true }
          }
        }
      }
    }
  });

  // Processamento dos dados (Cálculo de Receita)
  const worksReport = worksPerformance.map(work => {
    let revenuePremium = 0;
    let revenueLite = 0;
    let totalUnlocks = 0;

    work.chapters.forEach(chapter => {
      chapter.unlocks.forEach(unlock => {
        totalUnlocks++;
        // Se desbloqueou permanente = Gasto Premium
        if (unlock.type === "PERMANENT") {
          revenuePremium += chapter.pricePremium;
        } 
        // Se desbloqueou aluguel = Gasto Lite (Bônus)
        else if (unlock.type === "RENTAL") {
          revenueLite += chapter.priceLite;
        }
      });
    });

    return {
      id: work.id,
      title: work.title,
      readers: work._count.libraryEntries,
      revenuePremium,
      revenueLite,
      totalUnlocks
    };
  }).sort((a, b) => b.revenuePremium - a.revenuePremium); // Ordena pelos mais lucrativos

  // ----------------------------------------------------------------------
  // 3. ÚLTIMAS TRANSAÇÕES
  // ----------------------------------------------------------------------
  const recentTransactions = await prisma.transaction.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } }
    }
  });

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER E BOTÕES DE EXPORTAÇÃO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Painel Financeiro</h1>
          <p className="text-zinc-400">Visão contábil e performance de vendas.</p>
        </div>
        
        {/* Componente Client-Side para Downloads */}
        <ExportButtons />
      </div>

      {/* CARDS DE KPI (INDICADORES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vendas Totais */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Vendas Totais (Patinhas)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCoins(deposits._sum.amount || 0)}</div>
            <p className="text-xs text-zinc-500">Total de {deposits._count} transações de depósito</p>
          </CardContent>
        </Card>

        {/* Consumo */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Consumo (Gasto em Obras)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCoins(spent._sum.amount || 0)}</div>
            <p className="text-xs text-zinc-500">Patinhas usadas pelos leitores</p>
          </CardContent>
        </Card>

        {/* Assinantes */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Assinantes Ativos</CardTitle>
            <Coins className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {subscribers.reduce((acc, curr) => acc + curr._count._all, 0)}
            </div>
            <div className="flex gap-2 mt-1 flex-wrap">
              {subscribers.map(sub => (
                <span key={sub.subscriptionTier} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 capitalize">
                  {sub.subscriptionTier?.toLowerCase()}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Receita Lite (Estimativa) */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Receita Estimada (Lite)</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
               {formatCoins(worksReport.reduce((acc, w) => acc + w.revenueLite, 0))}
            </div>
            <p className="text-xs text-zinc-500">Moeda bônus queimada (Passivo)</p>
          </CardContent>
        </Card>
      </div>

      {/* RELATÓRIO DETALHADO POR OBRA */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Performance por Obra</CardTitle>
          <CardDescription className="text-zinc-400">
            Detalhamento de receita gerada por título (Premium vs Lite).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-950">
                <TableRow className="border-zinc-800 hover:bg-zinc-900">
                  <TableHead className="text-zinc-400">Obra</TableHead>
                  <TableHead className="text-zinc-400 text-right">Leitores</TableHead>
                  <TableHead className="text-zinc-400 text-right">Capítulos Lidos</TableHead>
                  <TableHead className="text-[#FFD700] text-right">Renda Premium</TableHead>
                  <TableHead className="text-blue-400 text-right">Renda Lite</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {worksReport.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                      Nenhuma obra com dados de leitura ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  worksReport.map((work) => (
                    <TableRow key={work.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="font-medium text-white">{work.title}</TableCell>
                      <TableCell className="text-right text-zinc-300">{work.readers}</TableCell>
                      <TableCell className="text-right text-zinc-300">{work.totalUnlocks}</TableCell>
                      <TableCell className="text-right font-mono text-[#FFD700] font-bold">
                        {formatCoins(work.revenuePremium)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-blue-400">
                        {formatCoins(work.revenueLite)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* HISTÓRICO DE TRANSAÇÕES */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Últimas Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-950">
                <TableRow className="border-zinc-800 hover:bg-zinc-900">
                  <TableHead className="text-zinc-400">Data</TableHead>
                  <TableHead className="text-zinc-400">Usuário</TableHead>
                  <TableHead className="text-zinc-400">Tipo</TableHead>
                  <TableHead className="text-zinc-400">Descrição</TableHead>
                  <TableHead className="text-right text-zinc-400">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                      Nenhuma transação registrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTransactions.map((tx) => (
                    <TableRow key={tx.id} className="border-zinc-800 hover:bg-zinc-800/50">
                      <TableCell className="text-zinc-400 whitespace-nowrap">
                        {tx.createdAt.toLocaleDateString('pt-BR')} <span className="text-xs text-zinc-600">{tx.createdAt.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                      </TableCell>
                      <TableCell className="text-white">
                        <div className="flex flex-col">
                          <span className="font-medium">{tx.user.name}</span>
                          <span className="text-xs text-zinc-500">{tx.user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2 py-1 rounded border uppercase font-bold ${
                          tx.type === 'DEPOSIT' ? 'bg-green-900/20 text-green-400 border-green-900/30' : 
                          tx.type === 'SPEND' ? 'bg-red-900/20 text-red-400 border-red-900/30' :
                          'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}>
                          {tx.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-300 text-sm max-w-50 truncate" title={tx.description || ""}>
                        {tx.description}
                      </TableCell>
                      <TableCell className={`text-right font-mono font-bold whitespace-nowrap ${
                          tx.type === 'DEPOSIT' || tx.type === 'EARN' || tx.type === 'BONUS' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {tx.type === 'SPEND' ? '-' : '+'}{tx.amount} <span className="text-xs text-zinc-500">{tx.currency}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}