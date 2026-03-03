"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, format } from "date-fns";

export type AccountingReportData = {
    coinPacks: {
        totalValue: number;
        count: number;
        details: any[];
    };
    subscriptions: {
        totalCount: number;
        byTier: Record<string, number>;
        logs: any[];
    };
};

export async function getAccountingData(startDate?: Date, endDate?: Date) {
    const session = await auth();
    if (!session || !["ADMIN", "OWNER", "ACCOUNTANT"].includes(session.user.role)) {
        throw new Error("Acesso Negado.");
    }

    const start = startDate || startOfMonth(new Date());
    const end = endDate || endOfMonth(new Date());

    // 1. Buscar Depósitos (Pacotes de Moedas)
    const deposits = await prisma.transaction.findMany({
        where: {
            type: "DEPOSIT",
            createdAt: {
                gte: start,
                lte: end,
            },
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // 2. Buscar Logs de Assinatura
    const subLogs = await prisma.activityLog.findMany({
        where: {
            type: "NEW_SUBSCRIPTION",
            createdAt: {
                gte: start,
                lte: end,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const coinPacks = {
        totalValue: deposits.reduce((acc, tx) => acc + tx.amount, 0),
        count: deposits.length,
        details: deposits,
    };

    const subscriptions = {
        totalCount: subLogs.length,
        byTier: subLogs.reduce((acc: any, log: any) => {
            // Tenta extrair o tier do metadata ou da mensagem
            const tier = log.metadata?.tier || "Desconhecido";
            acc[tier] = (acc[tier] || 0) + 1;
            return acc;
        }, {}),
        logs: subLogs,
    };

    return {
        success: true,
        data: {
            coinPacks,
            subscriptions,
        },
    };
}

export async function exportAccountingCSV(startDateStr: string, endDateStr: string) {
    const session = await auth();
    if (!session || !["ADMIN", "OWNER", "ACCOUNTANT"].includes(session.user.role)) {
        return { success: false, error: "Acesso Negado." };
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    try {
        const { data } = await getAccountingData(startDate, endDate);

        // --- CSV 1: Pacotes de Moedas ---
        const packHeaders = ["Data", "Usuario", "Email", "Valor (Moedas)", "Descricao"];
        const packRows = data.coinPacks.details.map((tx: any) => [
            format(tx.createdAt, "dd/MM/yyyy HH:mm"),
            `"${(tx.user?.name || "N/A").replace(/"/g, '""')}"`,
            `"${(tx.user?.email || "N/A").replace(/"/g, '""')}"`,
            tx.amount,
            `"${(tx.description || "").replace(/"/g, '""')}"`
        ]);

        const packsCsv = [
            "RELATORIO DE PACOTES COMPRADOS",
            packHeaders.join(","),
            ...packRows.map(row => row.join(","))
        ].join("\n");

        // --- CSV 2: Assinaturas ---
        const subHeaders = ["Data", "Mensagem"];
        const subRows = data.subscriptions.logs.map((log: any) => [
            format(log.createdAt, "dd/MM/yyyy HH:mm"),
            `"${log.message.replace(/"/g, '""')}"`
        ]);

        const subsCsv = [
            "RELATORIO DE NOVAS ASSINATURAS",
            subHeaders.join(","),
            ...subRows.map(row => row.join(","))
        ].join("\n");

        const fullCsv = packsCsv + "\n\n" + subsCsv;
        const filename = `contabilidade_${format(startDate, "yyyy-MM-dd")}.csv`;

        return { success: true, csv: fullCsv, filename };
    } catch (e) {
        return { success: false, error: "Erro ao gerar CSV contábil." };
    }
}
