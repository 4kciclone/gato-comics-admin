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
        totalValue: number;
        count: number;
        byType: Record<string, number>;
        details: any[];
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

    // 2. Buscar Logs de Assinatura (Tabela Nova)
    const subActivities = await prisma.subscriptionActivity.findMany({
        where: {
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

    const coinPacks = {
        totalValue: deposits.reduce((acc: number, tx: any) => acc + tx.amount, 0),
        count: deposits.length,
        details: deposits,
    };

    const subscriptions = {
        totalValue: subActivities.reduce((acc: number, act: any) => acc + act.amountPaid, 0),
        count: subActivities.length,
        byType: subActivities.reduce((acc: Record<string, number>, act: any) => {
            let label = "Compra";
            if (act.type === "DOWNGRADE") label = "Downgrade";
            else if (act.type.startsWith("UPGRADE")) label = "Upgrade";
            else if (act.oldTier === act.newTier) label = "Renovação";
            else if (!act.oldTier || act.oldTier === "NONE") label = "Primeira Assinatura";

            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {}),
        details: subActivities,
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

        // --- CSV 2: Assinaturas Detalhadas ---
        const subHeaders = ["Data", "Usuario", "Email", "Tipo", "Plano Antigo", "Novo Plano", "Valor Pago", "Timing"];
        const subRows = data.subscriptions.details.map((act: any) => [
            format(act.createdAt, "dd/MM/yyyy HH:mm"),
            `"${(act.user?.name || "N/A").replace(/"/g, '""')}"`,
            `"${(act.user?.email || "N/A").replace(/"/g, '""')}"`,
            act.type,
            act.oldTier || "NENHUM",
            act.newTier,
            act.amountPaid,
            act.timing
        ]);

        const subsCsv = [
            "RELATORIO DE ATIVIDADES DE ASSINATURA",
            subHeaders.join(","),
            ...subRows.map((row: (string | number)[]) => row.join(","))
        ].join("\n");

        const fullCsv = packsCsv + "\n\n" + subsCsv;
        const filename = `contabilidade_${format(startDate, "yyyy-MM-dd")}.csv`;

        return { success: true, csv: fullCsv, filename };
    } catch (e) {
        return { success: false, error: "Erro ao gerar CSV contábil." };
    }
}
