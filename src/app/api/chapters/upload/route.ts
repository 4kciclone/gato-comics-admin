import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// CRÍTICO: Esta configuração permite uploads grandes
export const maxDuration = 300; // 5 minutos de timeout

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["OWNER", "ADMIN", "UPLOADER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const formData = await request.formData();
    
    const workId = formData.get("workId") as string;
    const title = formData.get("title") as string;
    const number = parseFloat(formData.get("number") as string);
    const pricePremium = parseInt(formData.get("pricePremium") as string) || 3;
    const priceLite = parseInt(formData.get("priceLite") as string) || 10;
    const isFree = formData.get("isFree") === "on" || formData.get("isFree") === "true";
    const initialStatus = (formData.get("initialStatus") as ChapterWorkStatus) || "DRAFT";
    const file = formData.get("file") as File;

    if (!workId || isNaN(number) || !file || file.size === 0) {
      return NextResponse.json({ 
        error: "Dados inválidos ou arquivo faltando." 
      }, { status: 400 });
    }

    // Verificação de duplicidade
    const slug = `capitulo-${number}`;
    const existingChapter = await prisma.chapter.findFirst({
      where: {
        workId,
        OR: [
          { order: number },
          { slug: slug }
        ]
      }
    });

    if (existingChapter) {
      return NextResponse.json({ 
        error: `O Capítulo ${number} já existe nesta obra! Vá para a lista de capítulos e clique em 'Editar' para substituir as imagens.` 
      }, { status: 409 });
    }

    // Processar ZIP
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

    if (imagesToUpload.length === 0) {
      return NextResponse.json({ 
        error: "ZIP vazio ou sem imagens válidas." 
      }, { status: 400 });
    }

    const uploadedUrls: string[] = [];
    const timestamp = Date.now();

    // Upload para R2
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

    // Criar capítulo no banco
    const chapter = await prisma.chapter.create({
      data: {
        workId,
        title,
        order: number,
        slug,
        images: uploadedUrls,
        pricePremium,
        priceLite,
        isFree,
        workStatus: initialStatus
      }
    });

    return NextResponse.json({ 
      success: true,
      chapterId: chapter.id,
      redirectUrl: `/dashboard/obras/${workId}`
    });

  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json({ 
      error: "Erro ao processar upload." 
    }, { status: 500 });
  }
}