"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ChapterWorkStatus } from "@prisma/client";

// Configuração R2 (Reaproveitando)
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/**
 * Enviar trabalho (Tradução ou Edição)
 */
export async function submitTask(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Não autorizado." };

  const chapterId = formData.get("chapterId") as string;
  const role = formData.get("role") as string; // TRANSLATOR ou EDITOR
  const file = formData.get("file") as File;

  if (!file || file.size === 0) return { error: "Arquivo obrigatório." };

  try {
    // 1. Upload do Arquivo
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `workflow/${role.toLowerCase()}/${Date.now()}-${file.name}`;
    
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: file.type, // .zip, .txt, .pdf
    }));

    const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    // 2. Atualizar Banco de Dados e Mudar Status
    let nextStatus: ChapterWorkStatus = "DRAFT";
    let updateData: any = {};

    if (role === "TRANSLATOR") {
      nextStatus = "EDITING"; // Vai para o Editor
      updateData = { translationUrl: fileUrl, workStatus: nextStatus };
    } else if (role === "EDITOR") {
      nextStatus = "QC_PENDING"; // Vai para o QC
      updateData = { editedZipUrl: fileUrl, workStatus: nextStatus };
    }

    await prisma.chapter.update({
      where: { id: chapterId },
      data: updateData
    });

    revalidatePath("/dashboard/workspace");
    return { success: "Trabalho enviado! O status do capítulo foi atualizado." };

  } catch (error) {
    console.error(error);
    return { error: "Erro no upload." };
  }
}

/**
 * QC: Aprovar ou Rejeitar
 */
export async function reviewTask(chapterId: string, decision: "APPROVE" | "REJECT") {
  const session = await auth();
  // Validar se é QC/Admin aqui...

  try {
    const newStatus: ChapterWorkStatus = decision === "APPROVE" ? "READY" : "TRANSLATING"; // Se rejeitar, volta pro inicio (ou editing)
    
    await prisma.chapter.update({
      where: { id: chapterId },
      data: { workStatus: newStatus }
    });

    revalidatePath("/dashboard/workspace");
    return { success: decision === "APPROVE" ? "Capítulo aprovado!" : "Capítulo devolvido para revisão." };
  } catch (error) {
    return { error: "Erro ao processar revisão." };
  }
}