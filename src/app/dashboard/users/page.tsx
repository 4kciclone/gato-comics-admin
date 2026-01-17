import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserEditDialog } from "@/components/admin/user-edit-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q: string }> }) {
  const session = await auth();
  
  // SEGURANÇA MÁXIMA: Só Owner
  if (session?.user?.role !== "OWNER") {
    redirect("/dashboard");
  }

  const { q } = await searchParams;
  const query = q || "";

  // Busca Usuários
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
      ]
    },
    take: 20,
    orderBy: { createdAt: "desc" },
    include: {
      liteCoinBatches: {
        where: { expiresAt: { gt: new Date() } } // Para calcular saldo Lite atual
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-[#FFD700]" /> Gestão de Usuários
          </h1>
          <p className="text-zinc-400">Atribua cargos, gerencie saldos e assinaturas.</p>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="bg-[#111] p-4 rounded-lg border border-zinc-800">
        <form className="flex gap-2">
          <Input 
            name="q" 
            defaultValue={query} 
            placeholder="Buscar por nome, email ou username..." 
            className="bg-zinc-950 border-zinc-800 text-white"
          />
          <Button type="submit" className="bg-zinc-800 hover:bg-zinc-700">
            <Search className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-[#111] border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-950 text-zinc-400 uppercase">
            <tr>
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">Cargo</th>
              <th className="px-6 py-4">Saldo (P/L)</th>
              <th className="px-6 py-4">Assinatura</th>
              <th className="px-6 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-300">
            {users.map(user => {
              const liteBalance = user.liteCoinBatches.reduce((a, b) => a + b.amount, 0);
              
              return (
                <tr key={user.id} className="hover:bg-zinc-900/50">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback>{user.name?.slice(0,1)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-white">{user.name}</p>
                      <p className="text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-mono">
                    <span className="text-[#FFD700] font-bold">{user.balancePremium}</span>
                    <span className="text-zinc-600 mx-1">/</span>
                    <span className="text-blue-400">{liteBalance}</span>
                  </td>
                  <td className="px-6 py-4">
                    {user.subscriptionTier ? (
                      <Badge className="bg-purple-900/30 text-purple-400 hover:bg-purple-900/50">
                        {user.subscriptionTier}
                      </Badge>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {/* Passamos o user inteiro para o modal preencher os campos */}
                    <UserEditDialog user={user} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="p-8 text-center text-zinc-500">Nenhum usuário encontrado.</div>
        )}
      </div>
    </div>
  );
}