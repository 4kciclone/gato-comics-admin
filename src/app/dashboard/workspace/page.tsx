import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TaskCard } from "@/components/admin/task-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, CheckCircle2 } from "lucide-react";

export default async function WorkspacePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const userGlobalRole = session.user.role; // Cargo global (Owner/Admin)

  // 1. Descobrir em quais obras o usuário trabalha e qual o cargo dele nelas
  // Se for OWNER/ADMIN, ele é considerado "Super Staff" de tudo
  let staffAssignments;

  if (["OWNER", "ADMIN", "UPLOADER"].includes(userGlobalRole)) {
    // Admins veem tudo, vamos simular que eles são staff de tudo
    // Mas para simplificar a UI, vamos focar nos usuários comuns de staff primeiro
    // Se for admin, buscamos todas as obras
    staffAssignments = await prisma.workStaff.findMany({
        select: { workId: true, role: true } // Mock, na verdade o admin vê tudo
    });
  } else {
    staffAssignments = await prisma.workStaff.findMany({
        where: { userId },
        select: { workId: true, role: true }
    });
  }

  // Mapa rápido: WorkID -> Meu Cargo Nela
  // Ex: { "id_obra_1": "TRANSLATOR", "id_obra_2": "EDITOR" }
  const myRolesMap: Record<string, string> = {};
  const workIds: string[] = [];

  staffAssignments.forEach(s => {
    myRolesMap[s.workId] = s.role;
    workIds.push(s.workId);
  });

  // Se for Admin, pega IDs de todas as obras ativas
  let whereClause = {};
  if (["OWNER", "ADMIN", "UPLOADER"].includes(userGlobalRole)) {
     whereClause = { workStatus: { not: "PUBLISHED" } }; // Admin vê tudo que não tá publicado
  } else {
     // Staff vê apenas obras que participa e capítulos não publicados
     whereClause = { 
        workId: { in: workIds },
        workStatus: { not: "PUBLISHED" }
     };
  }

  // 2. Buscar Capítulos em Andamento (O Pipeline)
  const chapters = await prisma.chapter.findMany({
    where: whereClause,
    include: {
      work: { select: { title: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });

  // 3. Filtrar tarefas
  const myPendingTasks = chapters.filter(ch => {
    // Se sou admin, vejo tudo como pendente se estiver travado
    if (["OWNER", "ADMIN", "UPLOADER"].includes(userGlobalRole)) return true;

    const myRole = myRolesMap[ch.workId];
    if (myRole === "TRANSLATOR" && ch.workStatus === "TRANSLATING") return true;
    if (myRole === "EDITOR" && ch.workStatus === "EDITING") return true;
    if (myRole === "QC" && ch.workStatus === "QC_PENDING") return true;
    return false;
  });

  const others = chapters.filter(ch => !myPendingTasks.includes(ch));

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="text-[#FFD700]" /> Minhas Tarefas
        </h1>
        <p className="text-zinc-400">Gerencie o fluxo de produção dos capítulos designados a você.</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="pending" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">
            Pendentes ({myPendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
            Em Andamento ({others.length + myPendingTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
            {myPendingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                    <CheckCircle2 className="w-16 h-16 text-green-600 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white">Tudo em dia!</h3>
                    <p className="text-zinc-500">Você não tem tarefas pendentes agora.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myPendingTasks.map(ch => (
                        <TaskCard 
                            key={ch.id} 
                            chapter={ch} 
                            // Se for admin, passamos um role 'fake' baseado no status pra liberar os botões
                            userRole={
                                ["OWNER", "ADMIN"].includes(userGlobalRole) 
                                ? (ch.workStatus === 'TRANSLATING' ? 'TRANSLATOR' : ch.workStatus === 'EDITING' ? 'EDITOR' : 'QC')
                                : myRolesMap[ch.workId]
                            } 
                        />
                    ))}
                </div>
            )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...myPendingTasks, ...others].map(ch => (
                    <TaskCard 
                        key={ch.id} 
                        chapter={ch} 
                        userRole={["OWNER", "ADMIN"].includes(userGlobalRole) ? 'ADMIN' : myRolesMap[ch.workId]} 
                    />
                ))}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}