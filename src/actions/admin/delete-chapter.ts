"use server";

import { auth } from "@/auth"; // Ajuste o caminho se for @/lib/auth
import { prisma } from "@/lib/prisma";
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Configuração R2 (Igual ao seu arquivo de upload)
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function deleteChapter(workId: string, chapterId: string) {
  const session = await auth();

  // 1. Verificação de Segurança
  if (!session || !["OWNER", "ADMIN", "UPLOADER"].includes(session.user.role)) {
    return { error: "Sem permissão para deletar." };
  }

  try {
    // 2. Buscar as imagens do capítulo antes de deletar
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { images: true, order: true }
    });

    if (!chapter) {
      return { error: "Capítulo não encontrado." };
    }

    // 3. Preparar exclusão do R2
    if (chapter.images && chapter.images.length > 0) {
      const publicUrl = process.env.R2_PUBLIC_URL || "";
      
      const objectsToDelete = chapter.images.map((url) => {
        // Lógica para recuperar a KEY original baseada no seu código de upload:
        // O upload salva: `${process.env.R2_PUBLIC_URL}/${key}`
        // Então aqui removemos a parte da URL pública para sobrar só "chapters/workId/..."
        let key = url;
        
        if (publicUrl && url.startsWith(publicUrl)) {
            // Remove a URL pública e a barra inicial se sobrar
            key = url.replace(publicUrl, "");
            if (key.startsWith("/")) key = key.substring(1);
        } else {
            // Fallback: Tenta pegar o caminho relativo via URL object
            try {
                const urlObj = new URL(url);
                key = urlObj.pathname.startsWith("/") ? urlObj.pathname.substring(1) : urlObj.pathname;
            } catch (e) {
                // Se falhar, usa a string como está
                key = url;
            }
        }
        
        return { Key: key };
      });

      // R2/S3 permite deletar até 1000 objetos por vez
      // Se tiver mais que 1000 páginas, seria ideal fazer chunks, mas para mangás geralmente é ok.
      if (objectsToDelete.length > 0) {
        await s3.send(new DeleteObjectsCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Delete: {
                Objects: objectsToDelete,
                Quiet: true // Não retorna erro se o arquivo já não existir
            }
        }));
      }
    }

    // 4. Deletar do Banco de Dados
    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    // 5. Atualizar Cache
    revalidatePath(`/dashboard/obras/${workId}`);

  } catch (error) {
    console.error("Erro ao deletar capítulo:", error);
    return { error: "Erro interno ao deletar. Verifique os logs." };
  }

  // Redireciona para a lista de capítulos da obra
  redirect(`/dashboard/obras/${workId}`);
}