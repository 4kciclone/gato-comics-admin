"use server";

import { auth } from "@/auth"; 
import { prisma } from "@/lib/prisma";
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function deleteWork(workId: string) {
  const session = await auth();

  // Apenas Dono ou Admin podem deletar obras inteiras
  if (!session || !["OWNER", "ADMIN"].includes(session.user.role)) {
    return { error: "Sem permissão para deletar obras." };
  }

  try {
    // 1. Buscar todos os capítulos e suas imagens
    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        chapters: {
          select: { images: true }
        }
      }
    });

    if (!work) {
      return { error: "Obra não encontrada." };
    }

    // 2. Coletar TODAS as chaves (keys) de imagens para deletar
    let allKeysToDelete: { Key: string }[] = [];
    const publicUrl = process.env.R2_PUBLIC_URL || "";

    // Adiciona a capa da obra se for do R2
    if (work.coverUrl && work.coverUrl.includes("r2.dev")) { // ou seu domínio R2
         // Lógica simples de extração, ajuste conforme sua URL
         let key = work.coverUrl;
         if (publicUrl && key.startsWith(publicUrl)) {
            key = key.replace(publicUrl, "");
            if (key.startsWith("/")) key = key.substring(1);
            allKeysToDelete.push({ Key: key });
         }
    }

    // Adiciona imagens dos capítulos
    work.chapters.forEach(chapter => {
        chapter.images.forEach(url => {
            let key = url;
            if (publicUrl && url.startsWith(publicUrl)) {
                key = url.replace(publicUrl, "");
                if (key.startsWith("/")) key = key.substring(1);
            }
            allKeysToDelete.push({ Key: key });
        });
    });

    // 3. Deletar do R2 em lotes de 1000 (Limite da API S3)
    if (allKeysToDelete.length > 0) {
        const chunkSize = 1000;
        for (let i = 0; i < allKeysToDelete.length; i += chunkSize) {
            const chunk = allKeysToDelete.slice(i, i + chunkSize);
            await s3.send(new DeleteObjectsCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Delete: {
                    Objects: chunk,
                    Quiet: true
                }
            }));
        }
    }

    // 4. Deletar a Obra do Banco (Cascading delete removerá capítulos e staff)
    await prisma.work.delete({
      where: { id: workId },
    });

    revalidatePath("/dashboard/obras");
    
  } catch (error) {
    console.error("Erro ao deletar obra:", error);
    return { error: "Erro fatal ao deletar obra. Verifique logs." };
  }

  redirect("/dashboard/obras");
}