import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Ticket, Trash2 } from "lucide-react";
import { CreateCodeForm } from "./create-code-form"; // Vamos criar abaixo
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Ticket className="text-[#FFD700]" /> Códigos de Presente
        </h1>
        <p className="text-zinc-400">Gere códigos promocionais para marketing e recompensas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-1">
            <CreateCodeForm />
         </div>

         <div className="lg:col-span-2">
            <Card className="bg-[#111] border-zinc-800">
                <CardHeader><CardTitle>Códigos Ativos</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-zinc-900">
                                <TableHead>Código</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Usos</TableHead>
                                <TableHead>Expira em</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {codes.map(code => (
                                <TableRow key={code.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                    <TableCell className="font-mono font-bold text-white tracking-widest">{code.code}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={code.type === "PREMIUM" ? "text-[#FFD700] border-[#FFD700]/30" : "text-purple-400 border-purple-500/30"}>
                                            {code.amount} {code.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-zinc-400">
                                        {code.usedCount} / {code.maxUses || "∞"}
                                    </TableCell>
                                    <TableCell className="text-xs text-zinc-500">
                                        {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : "Nunca"}
                                    </TableCell>
                                    <TableCell>
                                        <form action={async () => { "use server"; await deletePromoCode(code.id) }}>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-900/20"><Trash2 className="w-4 h-4"/></Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}