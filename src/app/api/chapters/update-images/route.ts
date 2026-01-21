import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import JSZip from "jszip";

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
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !["OWNER", "ADMIN", "UPLOADER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const formData = await request.formData();
    
    const chapterId = formData.get("chapterId") as string;
    const workId = formData.get("workId") as string;
    const file = formData.get("file") as File;

    if (!chapterId || !file || file.size === 0) {
      return NextResponse.json({ 
        error: "Arquivo inválido." 
      }, { status: 400 });
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
        error: "O ZIP está vazio ou não contém imagens válidas." 
      }, { status: 400 });
    }

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

    return NextResponse.json({ 
      success: true,
      message: "Páginas substituídas com sucesso!",
      redirectUrl: `/dashboard/obras/${workId}`
    });

  } catch (error) {
    console.error("Erro ao atualizar imagens:", error);
    return NextResponse.json({ 
      error: "Erro ao processar o arquivo ZIP." 
    }, { status: 500 });
  }
}