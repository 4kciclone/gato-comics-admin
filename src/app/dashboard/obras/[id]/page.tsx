import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkStaffManager } from "@/components/admin/work-staff-manager";
import { Plus, Users, FileText } from "lucide-react";

export default async function WorkDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const work = await prisma.work.findUnique({
    where: { id },
    include: {
      chapters: { orderBy: { order: "desc" } },
      staff: { include: { user: true } } // Inclui a equipe
    }
  });

  if (!work) return notFound();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* CABEÇALHO DA OBRA */}
      <div className="flex gap-6 items-start">
        <div className="w-32 h-48 bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-zinc-700">
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img src={work.coverUrl} alt={work.title} className="w-full h-full object-cover" />
        </div>
        <div>
           <div className="flex items-center gap-3 mb-2">
             <h1 className="text-3xl font-bold text-white">{work.title}</h1>
             <Badge variant="outline" className="border-zinc-700 text-zinc-400">{work.ageRating.replace("_", " ")}</Badge>
           </div>
           <p className="text-zinc-400 max-w-2xl">{work.synopsis}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLUNA PRINCIPAL: CAPÍTULOS */}
        <div className="md:col-span-2 space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FFD700]" /> Capítulos
              </h2>
              <Link href={`/dashboard/obras/${work.id}/chapters/new`}>
                <Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold">
                   <Plus className="w-4 h-4 mr-2" /> Adicionar Capítulo
                </Button>
              </Link>
           </div>

           <div className="bg-[#111] border border-zinc-800 rounded-lg overflow-hidden">
              {work.chapters.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">Nenhum capítulo ainda.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-950 text-zinc-400">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Título</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {work.chapters.map(chap => (
                      <tr key={chap.id} className="hover:bg-zinc-900/50">
                        <td className="p-3 font-mono text-[#FFD700]">{chap.order}</td>
                        <td className="p-3 text-white">{chap.title}</td>
                        <td className="p-3">
                           <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                             {chap.workStatus}
                           </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Link href={`/dashboard/obras/${work.id}/chapters/${chap.id}`}>
                            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                            Editar
                            </Button>
                          </Link>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
           </div>
        </div>

        {/* COLUNA LATERAL: EQUIPE (Repassar Funções) */}
        <div className="md:col-span-1">
           <Card className="bg-[#111] border-zinc-800">
             <CardHeader>
               <CardTitle className="flex items-center gap-2 text-base">
                 <Users className="w-4 h-4 text-blue-400" /> Equipe da Obra
               </CardTitle>
             </CardHeader>
             <CardContent>
               <WorkStaffManager workId={work.id} initialStaff={work.staff as any} />
             </CardContent>
           </Card>
        </div>

      </div>
    </div>
  );
}