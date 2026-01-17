import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, DollarSign, Activity } from "lucide-react";

export default async function DashboardOverviewPage() {
  const session = await auth();
  const role = session?.user?.role;

  // Busca dados básicos para o resumo (Counts rápidos)
  const [userCount, workCount, totalSales] = await Promise.all([
    prisma.user.count(),
    prisma.work.count(),
    prisma.transaction.aggregate({
      where: { type: "DEPOSIT" },
      _sum: { amount: true }
    })
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Visão Geral</h1>
        <p className="text-zinc-400">
          Bem-vindo de volta, <span className="text-[#FFD700] font-bold">{session?.user?.name}</span>.
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card Usuários (Visível para Admin/Owner) */}
        {["ADMIN", "OWNER", "MODERATOR"].includes(role || "") && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{userCount}</div>
            </CardContent>
          </Card>
        )}

        {/* Card Obras */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Obras no Catálogo</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{workCount}</div>
          </CardContent>
        </Card>

        {/* Card Financeiro (Só Owner/Accountant) */}
        {["OWNER", "ACCOUNTANT"].includes(role || "") && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Vendas Totais</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {totalSales._sum.amount?.toLocaleString('pt-BR') || 0}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Área de Atividade Recente (Placeholder) */}
      <Card className="bg-zinc-900 border-zinc-800 h-64 flex items-center justify-center border-dashed">
        <div className="text-center text-zinc-500">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Atividade recente do sistema aparecerá aqui.</p>
        </div>
      </Card>
    </div>
  );
}