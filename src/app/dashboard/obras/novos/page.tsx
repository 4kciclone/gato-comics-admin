import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateWorkForm } from "@/components/admin/create-work-form";

export default async function NewWorkPage() {
  const session = await auth();
  
  // Segurança básica
  if (!session || !["OWNER", "ADMIN", "UPLOADER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  // Buscar usuários que podem ser donos de obras (Parceiros)
  // Se quiser incluir ADMINS na lista também, use OR no where
  const partners = await prisma.user.findMany({
    where: {
      role: { in: ["WORK_OWNER", "OWNER", "ADMIN"] }
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Nova Obra</h1>
        <p className="text-zinc-400">Cadastre um novo título, defina classificação e atribua os direitos.</p>
      </div>

      <CreateWorkForm partners={partners} />
    </div>
  );
}