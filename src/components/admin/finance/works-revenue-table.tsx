"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign } from "lucide-react";

interface WorkData {
  id: string;
  title: string;
  owner: string;
  sales: number;
  revenue: number;
  partnerShare: number;
}

const formatBRL = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function WorksRevenueTable({ data }: { data: WorkData[] }) {
  return (
    <Card className="bg-[#111] border-zinc-800">
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle className="text-white flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-500" /> Receita por Obra
                    </CardTitle>
                    <CardDescription>Detalhamento de vendas e cálculo de repasse (50%)</CardDescription>
                </div>
                <div className="text-right">
                    <p className="text-xs text-zinc-500 uppercase font-bold">Total Repasse</p>
                    <p className="text-xl font-bold text-white">
                        {formatBRL(data.reduce((acc, curr) => acc + curr.partnerShare, 0))}
                    </p>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[500px]">
                <Table>
                    <TableHeader className="bg-zinc-900/50">
                        <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                            <TableHead className="text-zinc-400">Obra</TableHead>
                            <TableHead className="text-zinc-400">Parceiro/Dono</TableHead>
                            <TableHead className="text-right text-zinc-400">Vendas (Patinhas)</TableHead>
                            <TableHead className="text-right text-zinc-400">Receita Bruta</TableHead>
                            <TableHead className="text-right text-green-400 font-bold">Repasse</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                                    Nenhuma venda registrada neste período.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((work) => (
                                <TableRow key={work.id} className="border-zinc-800 hover:bg-zinc-900/30">
                                    <TableCell className="font-medium text-white">{work.title}</TableCell>
                                    <TableCell className="text-zinc-400">{work.owner}</TableCell>
                                    <TableCell className="text-right font-mono text-zinc-300">{work.sales}</TableCell>
                                    <TableCell className="text-right font-mono text-zinc-300">{formatBRL(work.revenue)}</TableCell>
                                    <TableCell className="text-right font-mono text-green-400 font-bold">
                                        {formatBRL(work.partnerShare)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </CardContent>
    </Card>
  );
}