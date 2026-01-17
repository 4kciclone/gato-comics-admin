"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserRole, SubscriptionTier } from "@prisma/client";

// Helper para verificar permissão
async function checkOwner() {
  const session = await auth();
  if (session?.user?.role !== "OWNER") {
    throw new Error("Apenas o Dono pode realizar esta ação.");
  }
  return session.user.id; // Retorna ID do admin que fez a ação
}

/**
 * 1. Alterar Cargo
 */
export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    await checkOwner();
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });
    revalidatePath("/dashboard/users");
    return { success: "Cargo atualizado com sucesso." };
  } catch (error) {
    return { error: "Erro ao atualizar cargo." };
  }
}

/**
 * 2. Adicionar/Remover Patinhas Premium
 */
export async function managePremium(userId: string, amount: number, reason: string) {
  try {
    const adminId = await checkOwner();
    
    // Transação atômica: Atualiza saldo + Cria registro financeiro
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { balancePremium: { increment: amount } }
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount,
          currency: "PREMIUM",
          type: amount > 0 ? "BONUS" : "SPEND", // Se adicionar é Bônus, se tirar é Gasto (ajuste manual)
          description: `Ajuste Admin: ${reason}`,
          metadata: { adminId }
        }
      })
    ]);

    revalidatePath("/dashboard/users");
    return { success: "Saldo Premium atualizado." };
  } catch (error) {
    return { error: "Erro ao movimentar saldo." };
  }
}

/**
 * 3. Adicionar Patinhas Lite (Cria um lote com validade)
 */
export async function giveLiteCoins(userId: string, amount: number, daysValid: number) {
  try {
    const adminId = await checkOwner();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysValid);

    await prisma.$transaction([
      prisma.liteCoinBatch.create({
        data: { userId, amount, expiresAt }
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount,
          currency: "LITE",
          type: "BONUS",
          description: "Bônus Admin (Lite)",
          metadata: { adminId, daysValid }
        }
      })
    ]);

    revalidatePath("/dashboard/users");
    return { success: `Enviado ${amount} Lite (Validade: ${daysValid} dias).` };
  } catch (error) {
    return { error: "Erro ao enviar Lite." };
  }
}

/**
 * 4. Gerenciar Assinatura (Dar VIP)
 */
export async function setSubscription(userId: string, tier: SubscriptionTier | "NONE", days: number) {
  try {
    await checkOwner();

    if (tier === "NONE") {
      // Cancelar assinatura
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionTier: null, subscriptionValidUntil: null }
      });
      return { success: "Assinatura removida." };
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + days);

    await prisma.user.update({
      where: { id: userId },
      data: { 
        subscriptionTier: tier as SubscriptionTier,
        subscriptionValidUntil: validUntil
      }
    });

    revalidatePath("/dashboard/users");
    return { success: `Assinatura ${tier} concedida por ${days} dias.` };
  } catch (error) {
    return { error: "Erro ao definir assinatura." };
  }
}