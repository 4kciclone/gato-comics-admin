import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Ticket, Trash2 } from "lucide-react";
import { CreateCodeForm } from "./create-code-form";
import { Button } from "@/components/ui/button";
import { deletePromoCode } from "@/actions/admin-codes";

export default async function CodesPage() {
  const session = await auth();
  if (session?.user?.role !== "OWNER") redirect("/dashboard");

  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } }
  });

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Ticket className="text-[#FFD700]" /> Códigos de Presente
        </h1>
        <p className="text-zinc-400">Gere códigos promocionais para marketing e recompensas.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         {/* Formulário */}
         <div className="xl:col-span-1">
            <CreateCodeForm />
         </div>

         {/* Tabela de Códigos */}
         <div className="xl:col-span-2">
            {/* MUDANÇA: bg-zinc-900 para destacar do fundo preto */}
            <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
                <CardHeader className="border-b border-zinc-800 pb-4">
                    <CardTitle className="text-white">Códigos Ativos</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-hidden rounded-b-lg">
                        <Table>
                            {/* MUDANÇA: Cabeçalho preto para contraste */}
                            <TableHeader className="bg-black">
                                <TableRow className="border-zinc-800 hover:bg-black">
                                    <TableHead className="text-zinc-300 font-bold">Código</TableHead>
                                    <TableHead className="text-zinc-300">Valor</TableHead>
                                    <TableHead className="text-zinc-300">Usos</TableHead>
                                    <TableHead className="text-zinc-300">Expira em</TableHead>
                                    <TableHead className="text-right">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {codes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                                            Nenhum código criado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    codes.map(code => (
                                        <TableRow key={code.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                                            <TableCell className="font-mono font-bold text-[#FFD700] tracking-widest text-base">
                                                {code.code}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`border ${code.type === "PREMIUM" ? "border-yellow-500/30 text-yellow-500 bg-yellow-500/10" : "border-purple-500/30 text-purple-400 bg-purple-500/10"}`}>
                                                    {code.amount} {code.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-zinc-300">
                                                {code.usedCount} <span className="text-zinc-600">/</span> {code.maxUses || "∞"}
                                            </TableCell>
                                            <TableCell className="text-sm text-zinc-400">
                                                {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : "Nunca"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <form action={async () => { "use server"; await deletePromoCode(code.id) }}>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-950/30 hover:text-red-400 transition-colors">
                                                        <Trash2 className="w-4 h-4"/>
                                                    </Button>
                                                </form>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}