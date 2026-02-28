"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { SubscriptionTier, CurrencyType } from "@prisma/client";

// Tipagem de Retorno Especializado do Relatório
export type RevenueReportItem = {
    workId: string;
    workTitle: string;
    workCover: string;
    totalUnlocks: number;
    liteRevenue: number;
    premiumRevenue: number;
    tiersRevenue: {
        BRONZE: number;
        SILVER: number;
        GOLD: number;
        DIAMOND: number;
        NONE: number; // Sem Assinatura
    };
    tiersCount: {
        BRONZE: number;
        SILVER: number;
        GOLD: number;
        DIAMOND: number;
        NONE: number;
    };
};

export async function getWorksRevenueReport(
    startDate?: Date,
    endDate?: Date
): Promise<{ success: boolean; data?: RevenueReportItem[]; error?: string }> {
    const session = await auth();
    if (!session || !["ADMIN", "OWNER", "ACCOUNTANT"].includes(session.user.role)) {
        return { success: false, error: "Acesso Negado." };
    }

    const start = startDate || startOfMonth(new Date());
    const end = endDate || endOfMonth(new Date());

    try {
        // Encontra todos os Unlocks no balizador de tempo, e traz dados ricos da obra e user.
        const unlocks = await prisma.unlock.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                }
            },
            include: {
                user: {
                    select: {
                        subscriptionTier: true,
                    }
                },
                chapter: {
                    select: {
                        workId: true,
                        title: true,
                        work: {
                            select: {
                                title: true,
                                coverUrl: true,
                            }
                        }
                    }
                }
            }
        });

        // Agregação manual em memória
        const reportMap = new Map<string, RevenueReportItem>();

        unlocks.forEach((unlock: any) => {
            const wId = unlock.chapter.workId;
            const wTitle = unlock.chapter.work.title;
            const wCover = unlock.chapter.work.coverUrl;

            // Inicializa a obra no MAP se não existir
            if (!reportMap.has(wId)) {
                reportMap.set(wId, {
                    workId: wId,
                    workTitle: wTitle,
                    workCover: wCover,
                    totalUnlocks: 0,
                    liteRevenue: 0,
                    premiumRevenue: 0,
                    tiersRevenue: { BRONZE: 0, SILVER: 0, GOLD: 0, DIAMOND: 0, NONE: 0 },
                    tiersCount: { BRONZE: 0, SILVER: 0, GOLD: 0, DIAMOND: 0, NONE: 0 },
                });
            }

            const item = reportMap.get(wId)!;
            const spend = unlock.amountSpent || 0;

            // Faturamento Bruto 
            item.totalUnlocks += 1;
            if (unlock.currencyUsed === "LITE") {
                item.liteRevenue += spend;
            } else if (unlock.currencyUsed === "PREMIUM") {
                item.premiumRevenue += spend;
            }

            // Subdivisão por Tier
            const tier = unlock.user?.subscriptionTier || "NONE";
            // Incrementar contagem de unlocks dessa sub-origem
            item.tiersCount[tier as keyof typeof item.tiersCount] += 1;
            // Incrementar receita monetária vinda dessa sub-origem
            if (unlock.currencyUsed) {
                item.tiersRevenue[tier as keyof typeof item.tiersRevenue] += spend;
            }
        });

        // Ordenar por aqueles que mais ganharam Premium Revenue
        const result = Array.from(reportMap.values()).sort((a, b) => b.premiumRevenue - a.premiumRevenue);

        return { success: true, data: result };

    } catch (error) {
        console.error(error);
        return { success: false, error: "Falha ao gerar o relatório analítico." };
    }
}
