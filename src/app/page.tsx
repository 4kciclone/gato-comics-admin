import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Users, BookOpen, Activity, Coins } from "lucide-react";

export default async function DashboardPage() {
  const [totalUsers, totalWorks, totalChapters, recentActivity] = await Promise.all([
    prisma.user.count(),
    prisma.work.count(),
    prisma.chapter.count(),
    prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-glow">Dashboard Principal</h1>
        <p className="text-muted-foreground mt-1 text-lg">Visão geral do ecossistema Gato Comics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <div className="p-2 bg-primary/20 rounded-lg"><Users className="h-5 w-5 text-primary" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUsers.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">+ novos registros esta semana</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obras Cadastradas</CardTitle>
            <div className="p-2 bg-blue-500/20 rounded-lg"><BookOpen className="h-5 w-5 text-blue-400" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalWorks.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">Títulos únicos no catálogo</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capítulos Totais</CardTitle>
            <div className="p-2 bg-purple-500/20 rounded-lg"><BookOpen className="h-5 w-5 text-purple-400" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalChapters.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground mt-1">Lançados e rascunhos</p>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia Ativa</CardTitle>
            <div className="p-2 bg-yellow-500/20 rounded-lg"><Coins className="h-5 w-5 text-yellow-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">Premium</div>
            <p className="text-xs text-muted-foreground mt-1">Logs do sistema ativados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 card-premium">
          <CardHeader>
            <CardTitle>Visão Geral Financeira</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[250px] flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 m-4 relative overflow-hidden">
              <span className="text-muted-foreground font-medium z-10 glass px-4 py-2 rounded-full">Gráfico de Arrecadação (Em breve)</span>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 card-premium">
          <CardHeader>
            <CardTitle>Radar de Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground glass rounded-lg">
                  O sistema está silencioso...
                </div>
              ) : (
                recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                    <div className="mt-1 bg-primary/20 p-2 rounded-full">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-bold leading-tight">{log.message}</p>
                      <p className="text-[11px] text-muted-foreground/80 font-mono">
                        {log.createdAt.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}