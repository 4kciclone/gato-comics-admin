import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Eye, EyeOff } from "lucide-react";

export default async function WorksPage() {
  const session = await auth();
  if (!session || !["OWNER", "ADMIN", "UPLOADER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const works = await prisma.work.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { chapters: true } }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Gestão de Obras</h1>
          <p className="text-zinc-400">Gerencie seu catálogo, capítulos e equipes.</p>
        </div>
        <Link href="/dashboard/obras/novos">
          <Button className="bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90">
            <Plus className="w-4 h-4 mr-2" /> Nova Obra
          </Button>
        </Link>
      </div>

      <div className="border border-zinc-800 rounded-lg overflow-hidden bg-[#111]">
        <Table>
          <TableHeader className="bg-zinc-950">
            <TableRow className="border-zinc-800 hover:bg-zinc-900">
              <TableHead className="text-zinc-400">Capa</TableHead>
              <TableHead className="text-zinc-400">Título</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Capítulos</TableHead>
              <TableHead className="text-right text-zinc-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {works.map((work) => (
              <TableRow key={work.id} className="border-zinc-800 hover:bg-zinc-800/50">
                <TableCell>
                  <div className="w-10 h-14 bg-zinc-800 rounded overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={work.coverUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                </TableCell>
                <TableCell className="font-medium text-white">{work.title}</TableCell>
                <TableCell>
                  {work.isHidden ? (
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400"><EyeOff className="w-3 h-3 mr-1"/> Oculto</Badge>
                  ) : (
                    <Badge className="bg-green-900/30 text-green-400 hover:bg-green-900/40"><Eye className="w-3 h-3 mr-1"/> Público</Badge>
                  )}
                </TableCell>
                <TableCell className="text-zinc-300">{work._count.chapters}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/obras/${work.id}`}>
                    <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                      <BookOpen className="w-4 h-4 mr-2" /> Gerenciar
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}