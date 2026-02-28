"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function createChapter(formData: FormData) {
  const session = await auth();
  if (!session || !["OWNER", "ADMIN"].includes(session.user.role)) {
    return { success: false, error: "Sem permissão." };
  }

  try {
    const workId = formData.get("workId") as string;
    const title = formData.get("title") as string;
    const order = parseInt(formData.get("order") as string);
    const isFree = formData.get("isFree") === "true";
    const publishAt = new Date(formData.get("publishAt") as string);
    const pages = formData.getAll("pages") as File[];

    if (!workId || isNaN(order) || pages.length === 0) {
      return { success: false, error: "Dados incompletos." };
    }

    const work = await prisma.work.findUnique({ where: { id: workId } });
    if (!work) return { success: false, error: "Obra não encontrada." };

    const imageUrls: string[] = [];

    for (let i = 0; i < pages.length; i++) {
      const file = pages[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const extension = file.name.split(".").pop();
      const uniqueId = crypto.randomBytes(8).toString("hex");
      const key = `works/${work.slug}/chapters/${order}-${uniqueId}.${extension}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      );

      imageUrls.push(`${process.env.R2_PUBLIC_URL}/${key}`);
    }

    await prisma.chapter.create({
      data: {
        workId,
        title,
        slug: `capitulo-${order}-${crypto.randomBytes(3).toString("hex")}`,
        order,
        isFree,
        publishAt,
        images: imageUrls,
      },
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Erro interno ao criar capítulo." };
  }
}