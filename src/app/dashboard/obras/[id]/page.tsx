import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkStaffManager } from "@/components/admin/work-staff-manager";
import { ChapterRowActions } from "@/components/admin/chapter-row-actions";
import { DeleteWorkButton } from "@/components/admin/delete-work-button"; // <--- Importado
import { Plus, Users, FileText, ArrowLeft, Coins } from "lucide-react";


const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Rascunho", color: "bg-zinc-800 text-zinc-500 border-zinc-700" },
  TRANSLATING: { label: "Traduzindo", color: "bg-blue-950/40 text-blue-400 border-blue-900" },
  EDITING: { label: "Editando", color: "bg-purple-950/40 text-purple-400 border-purple-900" },
  QC_PENDING: { label: "Análise QC", color: "bg-yellow-950/40 text-yellow-400 border-yellow-900" },
  QC_REJECTED: { label: "Rejeitado", color: "bg-red-950/40 text-red-400 border-red-900" },
  READY: { label: "Pronto", color: "bg-cyan-950/40 text-cyan-400 border-cyan-800 animate-pulse" },
  PUBLISHED: { label: "Publicado", color: "bg-green-950/40 text-green-400 border-green-900" },
};

export default async function WorkDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const work = await prisma.work.findUnique({
    where: { id },
    include: {
      chapters: { orderBy: { order: "desc" } },
      staff: { include: { user: true } }
    }
  });

  if (!work) return notFound();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      
      {/* CABEÇALHO DA OBRA */}
      <div className="flex flex-col md:flex-row gap-8 items-start bg-[#111] p-6 rounded-xl border border-zinc-800 relative">
        <div className="w-40 aspect-[2/3] bg-zinc-800 rounded-lg overflow-hidden shrink-0 border border-zinc-700 shadow-xl">
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img src={work.coverUrl} alt={work.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 space-y-4 w-full">
           <div className="space-y-2">
             <div className="flex items-center gap-3 w-full">
                <Link href="/dashboard/obras">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Button>
                </Link>
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">{work.ageRating.replace("_", " ")}</Badge>
                {work.isHidden ? <Badge variant="destructive">Oculto</Badge> : <Badge className="bg-green-600">Visível</Badge>}
                
                {/* BOTÃO DE DELETAR OBRA (Alinhado à direita) */}
                <div className="ml-auto">
                    <DeleteWorkButton workId={work.id} workTitle={work.title} />
                </div>
             </div>
             
             <h1 className="text-4xl font-black text-white tracking-tight">{work.title}</h1>
             <p className="text-zinc-400 max-w-3xl leading-relaxed text-sm">{work.synopsis}</p>
           </div>
           
           <div className="flex flex-wrap gap-2 pt-2">
              {work.genres.map(g => (
                <span key={g} className="text-xs px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-500">
                    {g}
                </span>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA PRINCIPAL: CAPÍTULOS */}
        <div className="lg:col-span-2 space-y-4">
           <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FFD700]" /> Capítulos
              </h2>
              <Link href={`/dashboard/obras/${work.id}/chapters/new`}>
                <Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold">
                   <Plus className="w-4 h-4 mr-2" /> Novo Capítulo
                </Button>
              </Link>
           </div>

           <div className="bg-[#111] border border-zinc-800 rounded-lg overflow-hidden">
              {work.chapters.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 flex flex-col items-center">
                    <FileText className="w-12 h-12 mb-3 opacity-20" />
                    <p>Nenhum capítulo enviado ainda.</p>
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Título</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Preço</th>
                      <th className="px-4 py-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {work.chapters.map(chap => {
                      const statusConfig = STATUS_MAP[chap.workStatus] || STATUS_MAP.DRAFT;
                      
                      return (
                        <tr key={chap.id} className="hover:bg-zinc-900/50 transition-colors group">
                            <td className="px-4 py-3 font-mono text-[#FFD700] font-bold w-16">{chap.order}</td>
                            
                            <td className="px-4 py-3 text-white font-medium">
                                {chap.title || <span className="text-zinc-600 italic">Sem título</span>}
                                {chap.isFree && <span className="ml-2 text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded border border-green-500/20">Grátis</span>}
                            </td>
                            
                            <td className="px-4 py-3">
                                <Badge variant="outline" className={`text-[10px] h-5 ${statusConfig.color}`}>
                                    {statusConfig.label}
                                </Badge>
                            </td>

                            <td className="px-4 py-3 text-right text-xs text-zinc-500">
                                {!chap.isFree && (
                                    <div className="flex items-center justify-end gap-2">
                                        <span title="Premium" className="flex items-center text-[#FFD700]"><Coins className="w-3 h-3 mr-1"/>{chap.pricePremium}</span>
                                        <span title="Lite" className="flex items-center text-purple-400"><Coins className="w-3 h-3 mr-1"/>{chap.priceLite}</span>
                                    </div>
                                )}
                            </td>
                            
                            <td className="px-4 py-3 text-right">
                                <ChapterRowActions 
                                    workId={work.id} 
                                    chapterId={chap.id} 
                                    status={chap.workStatus} 
                                />
                            </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
           </div>
        </div>

        {/* COLUNA LATERAL: EQUIPE (Mantenha igual) */}
        <div className="lg:col-span-1 space-y-6">
           <Card className="bg-[#111] border-zinc-800">
             <CardHeader>
               <CardTitle className="flex items-center gap-2 text-base text-white">
                 <Users className="w-4 h-4 text-blue-400" /> Equipe de Produção
               </CardTitle>
             </CardHeader>
             <CardContent>
               <WorkStaffManager workId={work.id} initialStaff={work.staff as any} />
             </CardContent>
           </Card>

           <Card className="bg-[#111] border-zinc-800">
                <CardContent className="p-4">
                    <p className="text-xs text-zinc-500 leading-relaxed">
                        <strong className="text-zinc-300">Fluxo:</strong> Adicione Tradutor, Editor e QC. 
                        Quando o capítulo for criado, o status será <span className="text-blue-400">Traduzindo</span>. 
                        Após passar por todos, ficará <span className="text-cyan-400">Pronto</span> para você publicar.
                    </p>
                </CardContent>
           </Card>
        </div>

      </div>
    </div>
  );
}