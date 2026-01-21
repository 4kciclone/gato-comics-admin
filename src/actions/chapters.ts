"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import JSZip from "jszip";
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

export type ChapterState = {
  message?: string | null;
  error?: string | null;
  success?: string | null;
} | null;

/**
 * 1. CRIAR CAPÍTULO (Upload ZIP)
 */
export async function createChapter(prevState: ChapterState, formData: FormData): Promise<ChapterState> {
  const session = await auth();
  if (!session || !["OWNER", "ADMIN", "UPLOADER"].includes(session.user.role)) {
    return { error: "Sem permissão." };
  }

  const workId = formData.get("workId") as string;
  const title = formData.get("title") as string;
  const number = parseFloat(formData.get("number") as string);
  const pricePremium = parseInt(formData.get("pricePremium") as string) || 3;
  const priceLite = parseInt(formData.get("priceLite") as string) || 10;
  const isFree = formData.get("isFree") === "on";
  const initialStatus = formData.get("initialStatus") as ChapterWorkStatus || "DRAFT";
  const file = formData.get("file") as File;

  if (!workId || isNaN(number) || !file || file.size === 0) {
    return { error: "Dados inválidos ou arquivo faltando." };
  }

  // --- NOVA VERIFICAÇÃO DE DUPLICIDADE ---
  const slug = `capitulo-${number}`;
  const existingChapter = await prisma.chapter.findFirst({
    where: {
      workId,
      OR: [
        { order: number }, // Verifica pelo número
        { slug: slug }     // Verifica pelo slug
      ]
    }
  });

  if (existingChapter) {
    return { 
      error: `O Capítulo ${number} já existe nesta obra! Vá para a lista de capítulos e clique em 'Editar' para substituir as imagens.` 
    };
  }
  // ---------------------------------------

  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const imagesToUpload: { name: string; buffer: Buffer }[] = [];

    for (const [filename, fileData] of Object.entries(zip.files)) {
      if (!fileData.dir && !filename.startsWith("__MACOSX") && !filename.includes(".DS_Store")) {
        if (filename.match(/\.(jpg|jpeg|png|webp)$/i)) {
            const content = await fileData.async("nodebuffer");
            imagesToUpload.push({ name: filename, buffer: content });
        }
      }
    }

    imagesToUpload.sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    if (imagesToUpload.length === 0) return { error: "ZIP vazio ou sem imagens válidas." };

    const uploadedUrls: string[] = [];
    const timestamp = Date.now();

    for (const img of imagesToUpload) {
      const ext = img.name.split('.').pop()?.toLowerCase();
      const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      
      const key = `chapters/${workId}/${number}/${timestamp}-${img.name}`;

      await s3.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: img.buffer,
        ContentType: contentType,
      }));

      uploadedUrls.push(`${process.env.R2_PUBLIC_URL}/${key}`);
    }

    await prisma.chapter.create({
      data: {
        workId,
        title,
        order: number,
        slug, // Usamos o slug verificado acima
        images: uploadedUrls,
        pricePremium,
        priceLite,
        isFree,
        workStatus: initialStatus
      }
    });

  } catch (error) {
    console.error(error);
    return { error: "Erro ao processar upload." };
  }

  revalidatePath(`/dashboard/obras/${workId}`);
  redirect(`/dashboard/obras/${workId}`);
}

// ... (Mantenha as funções updateChapterStatus e updateChapterImages iguais)
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
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const imagesToUpload: { name: string; buffer: Buffer }[] = [];

    for (const [filename, fileData] of Object.entries(zip.files)) {
      if (!fileData.dir && !filename.startsWith("__MACOSX") && !filename.includes(".DS_Store")) {
        const content = await fileData.async("nodebuffer");
        imagesToUpload.push({ name: filename, buffer: content });
      }
    }

    imagesToUpload.sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    if (imagesToUpload.length === 0) return { error: "O ZIP está vazio." };

    const uploadedUrls: string[] = [];
    const timestamp = Date.now();

    for (const img of imagesToUpload) {
      const ext = img.name.split('.').pop()?.toLowerCase();
      const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      
      const key = `chapters/${workId}/${chapterId}/${timestamp}-${img.name}`;

      await s3.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: img.buffer,
        ContentType: contentType,
      }));

      uploadedUrls.push(`${process.env.R2_PUBLIC_URL}/${key}`);
    }

    await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        images: uploadedUrls,
        updatedAt: new Date()
      }
    });

    revalidatePath(`/dashboard/obras/${workId}`);
    return { success: "Páginas substituídas com sucesso!" };

  } catch (error) {
    console.error(error);
    return { error: "Erro ao processar o arquivo ZIP." };
  }
}