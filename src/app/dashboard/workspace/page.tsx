import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TaskCard } from "@/components/admin/task-card"; // Vamos criar este componente

export default async function WorkspacePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;
  const userRole = session.user.role;

  // 1. Buscar quais obras o usuário faz parte da equipe
  const staffRoles = await prisma.workStaff.findMany({
    where: { userId },
    select: { workId: true, role: true }
  });

  // Mapa de qual cargo ele tem em qual obra
  const myRoles = new Map(staffRoles.map(s => [s.workId, s.role]));

  // Se for Admin/Owner/Uploader, vê tudo
  const isAdmin = ["ADMIN", "OWNER", "UPLOADER"].includes(userRole);

  // 2. Buscar capítulos que precisam de ação
  const chapters = await prisma.chapter.findMany({
    where: {
      workStatus: { in: ["TRANSLATING", "EDITING", "QC_PENDING", "QC_REJECTED"] }
    },
    include: { work: true },
    orderBy: { updatedAt: "asc" }
  });

  // 3. Filtrar apenas o que é tarefa DESTE usuário
  const myTasks = chapters.filter(chap => {
    if (isAdmin) return true; // Admin vê tudo
    
    const roleInWork = myRoles.get(chap.workId);
    if (!roleInWork) return false;

    if (roleInWork === "TRANSLATOR" && chap.workStatus === "TRANSLATING") return true;
    if (roleInWork === "EDITOR" && (chap.workStatus === "EDITING" || chap.workStatus === "QC_REJECTED")) return true;
    if (roleInWork === "QC" && chap.workStatus === "QC_PENDING") return true;

    return false;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Minhas Tarefas ({myTasks.length})</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myTasks.map(chap => (
          <TaskCard 
            key={chap.id} 
            chapter={chap} 
            userRole={isAdmin ? "ADMIN" : myRoles.get(chap.workId)!} 
          />
        ))}
        {myTasks.length === 0 && <p className="text-zinc-500">Nenhuma tarefa pendente.</p>}
      </div>
    </div>
  );
}