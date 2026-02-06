import { auth } from "@/auth"; 
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChapterImageUpdater } from "@/components/admin/chapter-image-updater";
import { DeleteChapterButton } from "@/components/admin/delete-chapter-button"; // <--- Importado

interface PageProps {
  params: Promise<{ id: string; chapterId: string }>;
}

export default async function EditChapterPage({ params }: PageProps) {
  const { id: workId, chapterId } = await params;
  const session = await auth();

  if (!session || !["OWNER", "ADMIN", "UPLOADER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { work: { select: { title: true } } }
  });

  if (!chapter) return notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/obras/${workId}`}>
            <Button variant="outline" size="icon" className="border-zinc-700 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800">
                <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Capítulo {chapter.order}
                <span className={`text-xs px-2 py-0.5 rounded border ${chapter.isFree ? 'border-green-900 bg-green-900/20 text-green-400' : 'border-yellow-900 bg-yellow-900/20 text-yellow-500'}`}>
                    {chapter.isFree ? 'Grátis' : 'Pago'}
                </span>
            </h1>
            <p className="text-zinc-400 text-sm">{chapter.work.title}</p>
          </div>
        </div>

        {/* BOTÃO DE DELETAR AQUI */}
        <DeleteChapterButton 
            workId={workId} 
            chapterId={chapterId} 
            chapterOrder={chapter.order} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Esquerda: Informações e Substituição */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Metadados */}
            <Card className="bg-[#111] border-zinc-800">
                <CardHeader><CardTitle className="text-white text-base">Metadados</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Título</Label>
                            <Input defaultValue={chapter.title || "Sem título"} className="bg-zinc-950 border-zinc-800 text-zinc-300" disabled />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Slug</Label>
                            <Input defaultValue={chapter.slug} className="bg-zinc-950 border-zinc-800 text-zinc-500" disabled />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Componente de Substituição de Imagens */}
            <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">Substituir Páginas</h3>
                <p className="text-sm text-zinc-400">Faça upload de um novo ZIP para substituir todas as imagens atuais.</p>
                <ChapterImageUpdater workId={workId} chapterId={chapterId} />
            </div>
        </div>

        {/* Coluna Direita: Preview das Imagens Atuais */}
        <div className="lg:col-span-1">
             <div className="bg-[#111] border border-zinc-800 rounded-xl p-4 sticky top-4">
                <h3 className="font-bold text-white mb-4 flex justify-between items-center">
                    Páginas Atuais 
                    <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">{chapter.images.length}</span>
                </h3>
                
                <div className="grid grid-cols-3 gap-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {chapter.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-[2/3] group rounded overflow-hidden bg-zinc-900 border border-zinc-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={img} 
                                alt={`Pg ${idx + 1}`} 
                                className="w-full h-full object-cover" 
                                loading="lazy"
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-black/70 py-0.5 text-center">
                                <span className="text-[10px] text-white font-mono">{idx + 1}</span>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}