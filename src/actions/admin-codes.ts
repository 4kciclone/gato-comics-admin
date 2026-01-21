"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CurrencyType } from "@prisma/client";
import { z } from "zod";

const CodeSchema = z.object({
  code: z.string().min(3).regex(/^[A-Z0-9_-]+$/, "Use apenas letras maiúsculas, números, - e _"),
  amount: z.coerce.number().min(1),
  type: z.enum(["PREMIUM", "LITE"]),
  maxUses: z.coerce.number().optional(),
  expiresAt: z.string().optional(),
});

// Definindo o tipo de retorno
export type CodeState = {
  error?: string;
  success?: string;
} | null;

// ADICIONADO: prevState como primeiro argumento
export async function createPromoCode(prevState: CodeState, formData: FormData): Promise<CodeState> {
  const session = await auth();
  if (session?.user?.role !== "OWNER") return { error: "Sem permissão." };

  const rawData = Object.fromEntries(formData.entries());
  const validated = CodeSchema.safeParse(rawData);

  if (!validated.success) return { error: "Dados inválidos." };

  const { code, amount, type, maxUses, expiresAt } = validated.data;

  try {
    const existing = await prisma.promoCode.findUnique({ where: { code } });
    if (existing) return { error: "Este código já existe." };

    await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        amount,
        type: type as CurrencyType,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }
    });

    revalidatePath("/dashboard/codigos");
    return { success: "Código criado com sucesso!" };
  } catch (error) {
    return { error: "Erro ao criar código." };
  }
}

// A função de deletar não usa useActionState, então pode ficar simples, 
// mas é bom manter o padrão se for mudar no futuro.
export async function deletePromoCode(id: string) {
    const session = await auth();
    if (session?.user?.role !== "OWNER") return { error: "Sem permissão." };
    
    await prisma.promoCode.delete({ where: { id } });
    revalidatePath("/dashboard/codigos");
    return { success: "Código deletado." };
}