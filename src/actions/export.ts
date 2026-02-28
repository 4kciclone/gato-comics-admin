"use server";

import { auth } from "@/auth";
import { getWorksRevenueReport } from "./reports";
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
        const report = await getWorksRevenueReport(startDate, endDate);

        if (!report.success || !report.data) {
            return { success: false, error: "Falha ao compilar dados para CSV." };
        }

        const data = report.data;

        // Cabeçalhos (Headers) RFC 4180
        const headers = [
            "ID da Obra",
            "Título da Obra",
            "Total de Unlocks",
            "Receita Lite (Qtd Moedas)",
            "Receita Premium (Qtd Moedas)",
            "Receita de Nao-Assinantes",
            "Receita Ouro",
            "Receita Prata",
            "Receita Bronze",
            "Receita Diamante",
            "Unlocks Nao-Assinantes",
            "Unlocks Ouro",
            "Unlocks Prata",
            "Unlocks Bronze",
            "Unlocks Diamante"
        ];

        // Linhas de Dados
        const rows = data.map((item) => [
            item.workId,
            `"${item.workTitle.replace(/"/g, '""')}"`, // Escape quotes
            item.totalUnlocks,
            item.liteRevenue,
            item.premiumRevenue,
            item.tiersRevenue.NONE,
            item.tiersRevenue.GOLD,
            item.tiersRevenue.SILVER,
            item.tiersRevenue.BRONZE,
            item.tiersRevenue.DIAMOND,
            item.tiersCount.NONE,
            item.tiersCount.GOLD,
            item.tiersCount.SILVER,
            item.tiersCount.BRONZE,
            item.tiersCount.DIAMOND,
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const filename = `receitas_obras_${format(startDate, "yyyy-MM-dd")}_a_${format(endDate, "yyyy-MM-dd")}.csv`;

        return { success: true, csv: csvContent, filename };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Erro gerando arquivo." };
    }
}
