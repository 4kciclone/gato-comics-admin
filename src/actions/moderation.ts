"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type PunishmentType = "DELETE_ONLY" | "MUTE_24H" | "MUTE_7D" | "BAN";

/**
 * Ação 1: Ignorar/Absolver (Marca como resolvido sem punir)
 */
export async function dismissReports(reportIds: string[]) {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "OWNER" && role !== "MODERATOR") return { error: "Sem permissão." };

  try {
    await prisma.report.updateMany({
      where: { id: { in: reportIds } },
      data: { status: "RESOLVED", resolvedAt: new Date() }
    });
    revalidatePath("/dashboard/moderacao");
    return { success: "Denúncias ignoradas." };
  } catch (error) {
    return { error: "Erro ao ignorar denúncias." };
  }
}

/**
 * Ação 2: Punir (Deleta conteúdo + Aplica sanção ao usuário)
 */
export async function punishUser(
  contentId: string,
  contentType: "COMMENT" | "POST",
  targetUserId: string,
  punishment: PunishmentType,
  reportIds: string[]
) {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "OWNER" && role !== "MODERATOR") return { error: "Sem permissão." };

  try {
    // 1. Aplicar Punição ao Usuário (Mute/Ban)
    let muteUntil: Date | null = null;
    const now = new Date();

    if (punishment === "MUTE_24H") muteUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (punishment === "MUTE_7D") muteUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (punishment === "BAN") muteUntil = new Date("9999-12-31"); // Banimento "eterno"

    if (muteUntil) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { mutedUntil: muteUntil }
      });
    }

    // 2. Deletar o Conteúdo
    if (contentType === "COMMENT") {
      await prisma.comment.delete({ where: { id: contentId } });
    } else {
      await prisma.post.delete({ where: { id: contentId } });
    }

    // 3. Resolver as denúncias associadas
    await prisma.report.updateMany({
      where: { id: { in: reportIds } },
      data: { status: "RESOLVED", resolvedAt: new Date() }
    });

    revalidatePath("/dashboard/moderacao");
    return { success: "Punição aplicada com sucesso." };

  } catch (error) {
    console.error(error);
    return { error: "Erro ao aplicar punição." };
  }
}