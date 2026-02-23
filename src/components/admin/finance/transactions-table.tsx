"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Receipt } from "lucide-react";

interface Transaction {
  amount: number;
  createdAt: Date;
  description: string | null;
}

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  // Ordenar por data (mais recente primeiro)
  const sortedTx = [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Card className="bg-[#111] border-zinc-800">
        <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-400" /> Histórico de Transações
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                <Table>
                    <TableHeader className="bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-sm">
                        <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                            <TableHead className="text-zinc-400">Data</TableHead>
                            <TableHead className="text-zinc-400">Descrição</TableHead>
                            <TableHead className="text-right text-zinc-400">Valor (Patinhas)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedTx.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-zinc-500">
                                    Nenhuma transação encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedTx.map((tx, idx) => (
                                <TableRow key={idx} className="border-zinc-800 hover:bg-zinc-900/30">
                                    <TableCell className="text-zinc-400 text-xs">
                                        {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell className="text-white text-sm">
                                        {tx.description || "Depósito"}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-[#FFD700] font-bold">
                                        +{tx.amount}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
  );
}