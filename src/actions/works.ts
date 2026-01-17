"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { AgeRating } from "@prisma/client";

// Configuração do Cliente R2 (Cloudflare)
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export type WorkState = {
  message?: string | null;
  error?: string | null;
  success?: string | null;
  errors?: Record<string, string>; // Erros específicos por campo
} | null;

/**
 * Server Action para criar uma nova obra.
 */
export async function createWork(prevState: WorkState, formData: FormData): Promise<WorkState> {
  const session = await auth();
  const role = session?.user?.role;

  // 1. Verificação de Permissão (RBAC)
  if (!["OWNER", "ADMIN", "UPLOADER"].includes(role || "")) {
    return { error: "Você não tem permissão para criar obras." };
  }

  // 2. Extração dos Dados do Formulário
  const title = formData.get("title") as string;
  const synopsis = formData.get("synopsis") as string;
  const author = formData.get("author") as string;
  const studio = formData.get("studio") as string;
  const genresRaw = formData.get("genres") as string;
  
  // Novos campos
  const ageRating = formData.get("ageRating") as AgeRating;
  const contentTagsRaw = formData.get("contentTags") as string;
  const ownerIdRaw = formData.get("ownerId") as string;
  
  const coverFile = formData.get("coverImage") as File;

  // 3. Validação Básica
  if (!title || !author || !coverFile || coverFile.size === 0) {
    return { error: "Preencha os campos obrigatórios (Título, Autor e Capa)." };
  }

  try {
    // 4. Upload da Capa para o Cloudflare R2
    const fileBuffer = Buffer.from(await coverFile.arrayBuffer());
    // Nome único: timestamp-nome-limpo.ext
    const fileName = `covers/${Date.now()}-${coverFile.name.replace(/\s+/g, '-').toLowerCase()}`;
    
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: coverFile.type,
      ACL: 'public-read', // Se seu bucket não for público por padrão
    }));

    const coverUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    // 5. Processamento de Dados
    const genres = genresRaw.split(",").map(s => s.trim()).filter(Boolean);
    const contentTags = contentTagsRaw ? contentTagsRaw.split(",").map(s => s.trim()).filter(Boolean) : [];
    
    // Tratamento do OwnerId (se vier "none" ou vazio, vira null)
    const ownerId = (ownerIdRaw && ownerIdRaw !== "none") ? ownerIdRaw : null;

    // Gerar Slug (URL amigável)
    const slug = title.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9]+/g, "-") // Troca espaços/símbolos por traço
      .replace(/^-+|-+$/g, ""); // Remove traços do início/fim

    // Verifica se slug já existe
    const existingSlug = await prisma.work.findUnique({ where: { slug } });
    if (existingSlug) {
      return { error: "Já existe uma obra com este título/slug." };
    }

    // 6. Salvar no Banco de Dados
    await prisma.work.create({
      data: {
        title,
        slug,
        synopsis,
        author,
        studio,
        genres,
        coverUrl,
        
        // Novos Campos
        ageRating,
        contentTags,
        ownerId, // Conecta ao usuário parceiro
        isAdult: ageRating === "DEZOITO_ANOS", // Define flag +18 automaticamente
      }
    });

  } catch (error) {
    console.error("Erro ao criar obra:", error);
    return { error: "Erro interno ao processar a requisição. Verifique os logs." };
  }

  // 7. Redirecionar e Revalidar
  revalidatePath("/dashboard/obras"); // Atualiza a lista no painel
  redirect("/dashboard/obras"); // Manda o usuário para a lista
}