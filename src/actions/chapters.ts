"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import JSZip from "jszip";

// Config R2
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export type ChapterState = {
  message?: string | null;
  error?: string | null;
  success?: string | null;
} | null;

/**
 * ATUALIZAÇÃO QUENTE (HOT SWAP) DE IMAGENS
 * Substitui as páginas sem quebrar compras ou histórico.
 */
export async function updateChapterImages(prevState: ChapterState, formData: FormData): Promise<ChapterState> {
  const session = await auth();
  if (!session || !["OWNER", "ADMIN", "UPLOADER"].includes(session.user.role)) {
    return { error: "Sem permissão." };
  }

  const chapterId = formData.get("chapterId") as string;
  const workId = formData.get("workId") as string;
  const file = formData.get("file") as File;

  if (!chapterId || !file || file.size === 0) {
    return { error: "Arquivo inválido." };
  }

  try {
    // 1. Processar o ZIP
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const imagesToUpload: { name: string; buffer: Buffer }[] = [];

    // Extrair arquivos
    for (const [filename, fileData] of Object.entries(zip.files)) {
      if (!fileData.dir && !filename.startsWith("__MACOSX") && !filename.includes(".DS_Store")) {
        const content = await fileData.async("nodebuffer");
        imagesToUpload.push({ name: filename, buffer: content });
      }
    }

    // Ordenar por nome (1.jpg, 2.jpg...) para garantir a ordem de leitura
    imagesToUpload.sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    if (imagesToUpload.length === 0) return { error: "O ZIP está vazio ou sem imagens válidas." };

    // 2. Upload para o R2
    const uploadedUrls: string[] = [];
    const timestamp = Date.now();

    for (const img of imagesToUpload) {
      const extension = img.name.split('.').pop() || "jpg";
      // Caminho: chapters/ID_DA_OBRA/ID_DO_CAPITULO/TIMESTAMP-NOME
      const key = `chapters/${workId}/${chapterId}/${timestamp}-${img.name}`;

      await s3.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: img.buffer,
        ContentType: `image/${extension === 'png' ? 'png' : 'jpeg'}`,
        ACL: 'public-read'
      }));

      uploadedUrls.push(`${process.env.R2_PUBLIC_URL}/${key}`);
    }

    // 3. Atualizar APENAS o array de imagens no Banco
    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        images: uploadedUrls, // Substitui o array antigo pelo novo
        updatedAt: new Date()
      }
    });

    revalidatePath(`/dashboard/obras/${workId}`);
    return { success: "Páginas substituídas com sucesso! Os leitores verão a nova versão imediatamente." };

  } catch (error) {
    console.error(error);
    return { error: "Erro ao processar o arquivo ZIP." };
  }
}