"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ChapterWorkStatus } from "@prisma/client";

export type ChapterState = {
  message?: string | null;
  error?: string | null;
  success?: string | null;
} | null;

/**
 * Atualizar Status do Capítulo (mantém para workflows)
 */
export async function updateChapterStatus(prevState: ChapterState, formData: FormData): Promise<ChapterState> {
  const session = await auth();
  if (!session || !["OWNER", "ADMIN", "UPLOADER"].includes(session.user.role)) {
    return { error: "Sem permissão." };
  }

  const chapterId = formData.get("chapterId") as string;
  const newStatus = formData.get("workStatus") as ChapterWorkStatus;

  try {
    await prisma.chapter.update({
      where: { id: chapterId },
      data: { workStatus: newStatus }
    });
    
    revalidatePath(`/dashboard/workspace`);
    return { success: "Status atualizado!" };
  } catch (e) {
    return { error: "Erro ao atualizar." };
  }
}