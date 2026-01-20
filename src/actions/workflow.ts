"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ChapterWorkStatus } from "@prisma/client";

// Configuração R2
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

type WorkflowState = {
  error?: string;
  success?: string;
} | null;

/**
 * Enviar Tarefa (Tradução ou Edição)
 * Usado tanto pelo Modal principal quanto pelo formulário rápido
 */
export async function submitTask(formData: FormData): Promise<WorkflowState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Login necessário." };

  const chapterId = formData.get("chapterId") as string;
  const role = formData.get("role") as "TRANSLATOR" | "EDITOR";
  const file = formData.get("file") as File;

  if (!file || file.size === 0) return { error: "Arquivo vazio." };

  try {
    // 1. Verificar permissão na obra
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { work: { include: { staff: true } } }
    });

    if (!chapter) return { error: "Capítulo não encontrado." };

    // Verifica se o usuário faz parte da staff ou é admin
    const isStaff = chapter.work.staff.some(
      s => s.userId === session.user.id && s.role === role
    );
    const isAdmin = ["ADMIN", "OWNER", "UPLOADER"].includes(session.user.role);

    if (!isStaff && !isAdmin) return { error: "Sem permissão." };

    // 2. Upload para o R2
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `workflow/${chapter.work.slug}/${chapter.slug}/${role.toLowerCase()}-${Date.now()}.${file.name.split('.').pop()}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    }));

    const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    // 3. Atualizar Status e URL
    if (role === "TRANSLATOR") {
      await prisma.chapter.update({
        where: { id: chapterId },
        data: {
          translationUrl: fileUrl,
          workStatus: "EDITING" // Passa a bola para o Editor
        }
      });
    } else if (role === "EDITOR") {
      await prisma.chapter.update({
        where: { id: chapterId },
        data: {
          editedZipUrl: fileUrl, 
          workStatus: "QC_PENDING" // Passa a bola para o QC
        }
      });
    }

    revalidatePath("/dashboard/workspace");
    return { success: "Arquivo enviado com sucesso!" };

  } catch (error) {
    console.error(error);
    return { error: "Erro no upload." };
  }
}

/**
 * Alias para manter compatibilidade caso algum componente use este nome
 */
export const uploadTaskFile = submitTask;

/**
 * Revisão do QC (Aprovar ou Rejeitar)
 */
export async function reviewTask(chapterId: string, decision: "APPROVE" | "REJECT") {
  const session = await auth();
  const role = session?.user?.role;
  
  // Validar se é QC ou Admin
  if (!["QC", "ADMIN", "OWNER", "UPLOADER"].includes(role || "")) {
    return { error: "Sem permissão." };
  }

  try {
    if (decision === "APPROVE") {
      await prisma.chapter.update({
        where: { id: chapterId },
        data: { workStatus: "READY" } // Pronto para publicar
      });
    } else {
      await prisma.chapter.update({
        where: { id: chapterId },
        data: { workStatus: "QC_REJECTED" } // Volta para edição
      });
    }
    revalidatePath("/dashboard/workspace");
    return { success: decision === "APPROVE" ? "Aprovado!" : "Rejeitado." };
  } catch (e) {
    return { error: "Erro ao revisar." };
  }
}

/**
 * Publicar Capítulo (Final)
 */
export async function publishChapter(chapterId: string) {
    const session = await auth();
    if (!["OWNER", "ADMIN", "UPLOADER"].includes(session?.user?.role || "")) {
        return { error: "Sem permissão." };
    }

    try {
        await prisma.chapter.update({
            where: { id: chapterId },
            data: { 
                workStatus: "PUBLISHED",
                createdAt: new Date() // Atualiza a data para aparecer no topo do feed
            }
        });
        // Revalida a página da obra no admin
        revalidatePath("/dashboard/obras/[id]"); 
        return { success: "Publicado com sucesso!" };
    } catch(e) {
        return { error: "Erro ao publicar" };
    }
}