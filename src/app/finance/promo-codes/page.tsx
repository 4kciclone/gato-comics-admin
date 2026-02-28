import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PlusCircle, Ticket, Trash2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function PromoCodesPage() {
    const codes = await prisma.promoCode.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cupons Promocionais</h1>
                    <p className="text-muted-foreground">Crie e gerencie códigos de resgate para LITE ou PREMIUM.</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Cupom
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Mídia Ofertada</TableHead>
                            <TableHead className="text-center">Resgates</TableHead>
                            <TableHead className="text-center">Validade / Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {codes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhum cupom gerado. Crie o primeiro!
                                </TableCell>
                            </TableRow>
                        ) : (
                            codes.map((code) => {
                                const isExpired = code.expiresAt && new Date() > code.expiresAt;
                                const isMaxUsed = code.maxUses && code.usedCount >= code.maxUses;
                                const isActuallyActive = code.isActive && !isExpired && !isMaxUsed;

                                return (
                                    <TableRow key={code.id}>
                                        <TableCell className="font-medium font-mono text-lg flex items-center gap-2">
                                            <Ticket className="h-4 w-4 text-muted-foreground" />
                                            {code.code}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={code.type === "PREMIUM" ? "default" : "secondary"}>
                                                {code.amount} {code.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {code.usedCount} {code.maxUses ? `/ ${code.maxUses}` : ""}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {isActuallyActive ? (
                                                <Badge variant="outline" className="text-green-500 border-green-500">Ativo</Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    {!code.isActive ? "Desativado" : isExpired ? "Expirado" : "Esgotado"}
                                                </Badge>
                                            )}
                                            {code.expiresAt && (
                                                <div className="text-[10px] text-muted-foreground mt-1">
                                                    Exp: {code.expiresAt.toLocaleDateString("pt-BR")}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
