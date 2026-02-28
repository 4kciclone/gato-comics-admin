import { prisma } from "@/lib/prisma";
import { Coins, ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function TransactionsPage() {
    // Pega as últimas 50 transações
    const transactions = await prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
            user: {
                select: { username: true, email: true }
            }
        }
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Fluxo de Caixa e Transações</h1>
                    <p className="text-muted-foreground">Visualize a economia global (entradas e saídas de moedas virtuais).</p>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data/Hora</TableHead>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Descrição</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhuma transação encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {tx.createdAt.toLocaleString("pt-BR")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{tx.user.username}</div>
                                        <div className="text-[10px] text-muted-foreground">{tx.user.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        {tx.type === "DEPOSIT" || tx.type === "EARN" || tx.type === "BONUS" ? (
                                            <Badge variant="outline" className="text-green-500 border-green-500 flex w-fit gap-1 items-center">
                                                <ArrowUpRight className="h-3 w-3" />
                                                {tx.type}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-red-500 border-red-500 flex w-fit gap-1 items-center">
                                                <ArrowDownRight className="h-3 w-3" />
                                                SPEND
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 items-center font-bold">
                                            <Coins className={`h-4 w-4 ${tx.currency === "PREMIUM" ? "text-yellow-500" : "text-blue-400"}`} />
                                            {tx.amount} {tx.currency === "LITE" ? "Lites" : "Premium"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {tx.description || "-"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
