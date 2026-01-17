"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";

export async function addStaffToWork(workId: string, email: string, role: UserRole) {
  const session = await auth();
  if (!session || !["OWNER", "ADMIN"].includes(session.user.role)) return { error: "Sem permissão." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Usuário não encontrado." };

  try {
    // Atualiza o cargo do usuário se ele for apenas USER, para que ele possa acessar o painel
    if (user.role === "USER") {
        await prisma.user.update({ where: { id: user.id }, data: { role: role } });
    }

    await prisma.workStaff.create({
      data: { workId, userId: user.id, role }
    });
    
    revalidatePath(`/dashboard/obras/${workId}`);
    return { success: true };
  } catch (error) {
    return { error: "Erro ao adicionar. Verifique se o usuário já tem essa função nesta obra." };
  }
}

export async function removeStaffFromWork(staffId: string) {
  const session = await auth();
  if (!session || !["OWNER", "ADMIN"].includes(session.user.role)) return { error: "Sem permissão." };

  await prisma.workStaff.delete({ where: { id: staffId } });
  revalidatePath("/dashboard/obras/[id]"); // Revalida a página
}