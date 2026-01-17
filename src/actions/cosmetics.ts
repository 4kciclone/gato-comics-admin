"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CosmeticType } from "@prisma/client";

export type CosmeticState = {
  error?: string;
  success?: string;
} | null;

const CosmeticSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.enum(["AVATAR_FRAME", "COMMENT_BACKGROUND", "PROFILE_BANNER", "USERNAME_COLOR"]),
  rarity: z.enum(["COMMON", "RARE", "EPIC", "LEGENDARY"]),
  price: z.coerce.number().min(0, "Preço deve ser 0 ou maior"),
  imageUrl: z.string().url("URL da imagem/gif é obrigatória"),
});

// --- ADMIN: CRIAR ---
export async function createCosmetic(prevState: CosmeticState, formData: FormData): Promise<CosmeticState> {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== 'ADMIN' && role !== 'OWNER') return { error: "Acesso negado." };

  const validatedFields = CosmeticSchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) return { error: "Dados inválidos." };
  
  try {
    await prisma.cosmetic.create({ data: validatedFields.data });
    revalidatePath("/dashboard/cosmeticos");
    return { success: "Cosmético criado!" };
  } catch (error) {
    return { error: "Erro no banco de dados." };
  }
}

// --- ADMIN: DELETAR ---
export async function deleteCosmetic(id: string) {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== 'ADMIN' && role !== 'OWNER') return { error: "Acesso negado." };

  try {
    await prisma.cosmetic.delete({ where: { id } });
    revalidatePath("/dashboard/cosmeticos");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao deletar." };
  }
}

// --- USER: COMPRAR (Lógica para o site principal) ---
export async function buyCosmetic(prevState: CosmeticState, formData: FormData): Promise<CosmeticState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Login necessário." };

  const cosmeticId = formData.get("cosmeticId") as string;
  const userId = session.user.id;

  try {
    const [cosmetic, user] = await Promise.all([
      prisma.cosmetic.findUnique({ where: { id: cosmeticId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { balancePremium: true } }),
    ]);

    if (!cosmetic || !user) return { error: "Erro ao buscar dados." };
    if (user.balancePremium < cosmetic.price) return { error: "Saldo insuficiente." };

    // Verifica posse
    const alreadyOwns = await prisma.userCosmetic.findUnique({
        where: { userId_cosmeticId: { userId, cosmeticId } }
    });
    if (alreadyOwns) return { error: "Você já tem este item." };

    // Transação Atômica
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { balancePremium: { decrement: cosmetic.price } },
      }),
      prisma.userCosmetic.create({ data: { userId, cosmeticId } }),
      prisma.transaction.create({
        data: {
          userId,
          amount: -cosmetic.price,
          currency: "PREMIUM",
          type: "SPEND",
          description: `Compra: ${cosmetic.name}`
        }
      })
    ]);

    revalidatePath("/profile");
    return { success: "Comprado com sucesso!" };
  } catch (error) {
    return { error: "Erro na compra." };
  }
}

// --- USER: EQUIPAR (Lógica para o site principal) ---
export async function equipCosmetic(prevState: CosmeticState, formData: FormData): Promise<CosmeticState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Login necessário." };

  const cosmeticId = formData.get("cosmeticId") as string;
  const type = formData.get("type") as CosmeticType;
  const userId = session.user.id;

  try {
    // Verifica se o usuário realmente tem o item
    const owns = await prisma.userCosmetic.findUnique({
      where: { userId_cosmeticId: { userId, cosmeticId } }
    });
    if (!owns) return { error: "Você não possui este item." };

    // Mapeamento de campos corrigido
    const updates: any = {};
    if (type === "AVATAR_FRAME") updates.equippedAvatarFrameId = cosmeticId;
    if (type === "COMMENT_BACKGROUND") updates.equippedCommentBackgroundId = cosmeticId;
    if (type === "PROFILE_BANNER") updates.equippedProfileBannerId = cosmeticId; // <--- ADICIONADO

    await prisma.user.update({
      where: { id: userId },
      data: updates
    });

    revalidatePath("/profile");
    return { success: "Item equipado!" };
  } catch (error) {
    return { error: "Erro ao equipar." };
  }
}