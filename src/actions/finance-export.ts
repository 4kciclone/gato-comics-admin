"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function getFinanceReport(type: "MONTHLY" | "FULL") {
  const session = await auth();
  if (session?.user?.role !== "OWNER" && session?.user?.role !== "ACCOUNTANT") {
    throw new Error("Não autorizado");
  }

  // 1. Definir o filtro de data
  const whereClause: any = {};
  
  if (type === "MONTHLY") {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    whereClause.createdAt = {
      gte: firstDay,
      lte: lastDay,
    };
  }

  // 2. Buscar Transações
  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } }
    }
  });

  return transactions;
}

/**
 * Gera o arquivo Excel (Buffer em Base64) para download no cliente
 */
export async function generateExcelReport(type: "MONTHLY" | "FULL") {
  const data = await getFinanceReport(type);
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Relatório Financeiro");

  // Configurar Colunas
  worksheet.columns = [
    { header: "ID", key: "id", width: 25 },
    { header: "Data", key: "date", width: 20 },
    { header: "Hora", key: "time", width: 10 },
    { header: "Usuário", key: "user", width: 30 },
    { header: "Email", key: "email", width: 30 },
    { header: "Tipo", key: "type", width: 15 },
    { header: "Moeda", key: "currency", width: 10 },
    { header: "Valor", key: "amount", width: 15 },
    { header: "Descrição", key: "description", width: 40 },
  ];

  // Estilizar Cabeçalho
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF000000" }, // Fundo Preto
  };

  // Adicionar Dados
  data.forEach((tx) => {
    worksheet.addRow({
      id: tx.id,
      date: tx.createdAt.toLocaleDateString("pt-BR"),
      time: tx.createdAt.toLocaleTimeString("pt-BR"),
      user: tx.user.name,
      email: tx.user.email,
      type: tx.type,
      currency: tx.currency,
      amount: tx.amount,
      description: tx.description || "-",
    });
  });

  // Gerar Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Retornar como Base64 para o cliente baixar
  return Buffer.from(buffer).toString("base64");
}