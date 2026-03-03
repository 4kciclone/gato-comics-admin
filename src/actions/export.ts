"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function exportWorksRevenueCSV(
    startDateStr: string,
    endDateStr: string
): Promise<{ success: boolean; csv?: string; filename?: string; error?: string }> {
    const session = await auth();
    if (!session || !["ADMIN", "OWNER", "ACCOUNTANT"].includes(session.user.role)) {
        return { success: false, error: "Acesso Negado." };
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    try {
        const unlocks = await prisma.unlock.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        subscriptionTier: true,
                    }
                },
                chapter: {
                    select: {
                        title: true,
                        work: {
                            select: {
                                title: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        if (!unlocks || unlocks.length === 0) {
            return { success: false, error: "Nenhum destravamento encontrado no período." };
        }

        // Cabeçalhos (Headers) RFC 4180
        const headers = [
            "Data/Hora",
            "Usuario (Nome)",
            "Usuario (Email)",
            "Obra",
            "Capitulo",
            "Tipo Moeda",
            "Moedas Gastas",
            "Origem da Moeda",
            "Tier do Usuario no Momento"
        ];

        // Linhas de Dados
        const rows = unlocks.map((unlock: any) => {
            const userName = unlock.user?.name || "Desconhecido";
            const userEmail = unlock.user?.email || "N/A";
            const workTitle = unlock.chapter.work.title || "Obra Deletada";
            const chapterTitle = unlock.chapter.title || "Capitulo Deletado";
            const currency = unlock.currencyUsed === "LITE" ? "Patinha Lite" : "Patinha Premium";
            const amount = unlock.amountSpent || 0;
            const source = unlock.currencyUsed === "LITE" ? (unlock.liteSource || "OUTROS") : "COMPRA_DIRETA_PREMIUM";
            const tier = unlock.user?.subscriptionTier || "NENHUM";
            const dateStr = format(unlock.createdAt, "dd/MM/yyyy HH:mm:ss");

            return [
                `"${dateStr}"`,
                `"${userName.replace(/"/g, '""')}"`,
                `"${userEmail.replace(/"/g, '""')}"`,
                `"${workTitle.replace(/"/g, '""')}"`,
                `"${chapterTitle.replace(/"/g, '""')}"`,
                `"${currency}"`,
                amount,
                `"${source}"`,
                `"${tier}"`
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map((row: any) => row.join(","))
        ].join("\n");

        const filename = `faturamento_detalhado_${format(startDate, "yyyy-MM-dd")}_a_${format(endDate, "yyyy-MM-dd")}.csv`;

        return { success: true, csv: csvContent, filename };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Erro gerando arquivo detalhado." };
    }
}
