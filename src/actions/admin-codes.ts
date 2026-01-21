"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CurrencyType } from "@prisma/client";
import { z } from "zod";

// Schema atualizado
const CodeSchema = z.object({
  code: z.string()
    .min(3, "O código deve ter pelo menos 3 caracteres")
    .regex(/^[A-Z0-9_-]+$/, "Use apenas letras maiúsculas, números, - e _"),
  amount: z.coerce.number().min(1, "O valor deve ser maior que 0"),
  type: z.enum(["PREMIUM", "LITE"]),
  maxUses: z.union([z.coerce.number(), z.literal(""), z.null()]).optional(),
  expiresAt: z.string().optional().nullable(),
});

export type CodeState = {
  error?: string;
  success?: string;
} | null;

export async function createPromoCode(prevState: CodeState, formData: FormData): Promise<CodeState> {
  const session = await auth();
  if (session?.user?.role !== "OWNER") return { error: "Sem permissão." };

  // 1. Limpeza de Dados
  const rawMaxUses = formData.get("maxUses")?.toString();
  const rawExpiresAt = formData.get("expiresAt")?.toString();

  const dataToValidate = {
    code: formData.get("code"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    maxUses: rawMaxUses && rawMaxUses !== "0" ? rawMaxUses : undefined,
    expiresAt: rawExpiresAt || undefined,
  };

  const validated = CodeSchema.safeParse(dataToValidate);

  if (!validated.success) {
    // CORREÇÃO AQUI: Troquei .errors por .issues
    const errorMessage = validated.error.issues[0]?.message || "Dados inválidos.";
    return { error: errorMessage };
  }

  const { code, amount, type, maxUses, expiresAt } = validated.data;

  try {
    const existing = await prisma.promoCode.findUnique({ where: { code } });
    if (existing) return { error: "Este código já existe." };

    await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        amount,
        type: type as CurrencyType,
        maxUses: maxUses ? Number(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }
    });

    revalidatePath("/dashboard/codigos");
    return { success: "Código criado com sucesso!" };
  } catch (error) {
    console.error("Erro ao criar código:", error);
    return { error: "Erro interno ao salvar no banco." };
  }
}

export async function deletePromoCode(id: string) {
    const session = await auth();
    if (session?.user?.role !== "OWNER") return { error: "Sem permissão." };
    
    try {
        await prisma.promoCode.delete({ where: { id } });
        revalidatePath("/dashboard/codigos");
        return { success: "Código deletado." };
    } catch (e) {
        return { error: "Erro ao deletar." };
    }
}