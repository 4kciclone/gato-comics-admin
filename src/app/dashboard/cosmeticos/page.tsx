import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CosmeticCreateForm } from "./create-form";
import { deleteCosmetic } from "@/actions/cosmetics";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Gem } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function CosmeticsPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "ADMIN" && role !== "OWNER") {
    redirect("/dashboard");
  }

  // Busca cosméticos existentes
  const cosmetics = await prisma.cosmetic.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Gem className="text-purple-500" /> Cosméticos
        </h1>
        <p className="text-zinc-400">Gerencie a loja de itens virtuais.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Coluna da Esquerda: Formulário */}
        <div className="xl:col-span-1">
            <CosmeticCreateForm />
        </div>

        {/* Coluna da Direita: Lista */}
        <div className="xl:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-white">Itens Ativos ({cosmetics.length})</h2>
            
            <div className="rounded-md border border-zinc-800 overflow-hidden bg-zinc-900">
                <Table>
                    <TableHeader className="bg-zinc-950">
                        <TableRow className="border-zinc-800 hover:bg-zinc-900">
                            <TableHead className="text-zinc-400 w-[80px]">Img</TableHead>
                            <TableHead className="text-zinc-400">Nome</TableHead>
                            <TableHead className="text-zinc-400">Tipo</TableHead>
                            <TableHead className="text-zinc-400">Preço</TableHead>
                            <TableHead className="text-right text-zinc-400">Ação</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cosmetics.map((item) => (
                            <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-800/50">
                                <TableCell>
                                    <div className="w-10 h-10 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium text-white">
                                    {item.name}
                                    <div className="flex gap-2 mt-1">
                                        <Badge variant="outline" className="text-[10px] h-5 border-zinc-700 text-zinc-400">
                                            {item.rarity}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="text-zinc-300 text-xs">
                                    {item.type.replace("_", " ")}
                                </TableCell>
                                <TableCell className="text-[#FFD700] font-bold font-mono">
                                    {item.price}
                                </TableCell>
                                <TableCell className="text-right">
                                    <form action={async () => {
                                        "use server";
                                        await deleteCosmetic(item.id);
                                    }}>
                                        <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-900/20">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
      </div>
    </div>
  );
}