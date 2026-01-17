import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChapterImageUpdater } from "@/components/admin/chapter-image-updater";

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
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/obras/${workId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Editar Capítulo {chapter.order}</h1>
          <p className="text-zinc-400">{chapter.work.title}</p>
        </div>
      </div>

      {/* Edição de Metadados (Título, Preço) */}
      {/* Aqui você pode criar uma action separada 'updateChapterDetails' se quiser editar texto */}
      <Card className="bg-[#111] border-zinc-800">
        <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
        <CardContent>
            <form className="space-y-4">
                {/* Nota: Isso é apenas visual por enquanto, focaremos na troca de imagem */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Título</Label>
                        <Input defaultValue={chapter.title} className="bg-zinc-950 border-zinc-800" disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>Ordem (#)</Label>
                        <Input defaultValue={chapter.order.toString()} className="bg-zinc-950 border-zinc-800" disabled />
                    </div>
                </div>
                <div className="p-3 bg-zinc-900 rounded text-xs text-zinc-500">
                    Para editar título e preços, implementaremos uma action updateDetails em breve. 
                    O foco agora é a substituição de páginas abaixo.
                </div>
            </form>
        </CardContent>
      </Card>

      {/* COMPONENTE DE HOT SWAP */}
      <ChapterImageUpdater workId={workId} chapterId={chapterId} />

      {/* Visualização das Páginas Atuais (Opcional, para conferência) */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-white">Páginas Atuais ({chapter.images.length})</h3>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {chapter.images.slice(0, 12).map((img, idx) => (
                <div key={idx} className="aspect-[2/3] bg-zinc-800 rounded overflow-hidden relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Página ${idx}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                </div>
            ))}
            {chapter.images.length > 12 && (
                <div className="aspect-[2/3] bg-zinc-900 rounded flex items-center justify-center text-zinc-500 text-xs">
                    +{chapter.images.length - 12} mais...
                </div>
            )}
        </div>
      </div>

    </div>
  );
}