"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw, FileArchive } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ChapterImageUpdater({ workId, chapterId }: { workId: string, chapterId: string }) {
  const router = useRouter();
  
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setUploadProgress(0);

    const formData = new FormData(e.currentTarget);

    try {
      // Simular progresso durante o upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch("/api/chapters/update-images", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao atualizar imagens");
        setIsPending(false);
        setUploadProgress(0);
        return;
      }

      // Sucesso
      toast.success(data.message || "Páginas substituídas com sucesso!");
      setFileName(null);
      
      // Resetar form
      e.currentTarget.reset();
      
      // Aguardar 1s e recarregar a página
      setTimeout(() => {
        router.refresh();
        setIsPending(false);
        setUploadProgress(0);
      }, 1000);
      
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar os dados. Tente novamente.");
      setIsPending(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="border-orange-900/50 bg-orange-950/10">
      <CardHeader>
        <CardTitle className="text-orange-500 flex items-center gap-2 text-lg">
          <RefreshCw className="w-5 h-5" /> Substituir Páginas (Hot Swap)
        </CardTitle>
        <CardDescription className="text-orange-200/60">
          Use isto se subiu o capítulo com erros (páginas repetidas, erro de tradução, etc).
          <br />
          <strong>Isso não apaga o capítulo.</strong> Quem já comprou continuará com acesso, mas verá as novas imagens.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="workId" value={workId} />
          <input type="hidden" name="chapterId" value={chapterId} />

          <div className="space-y-2">
            <Label className="text-zinc-300">Novo Arquivo .ZIP</Label>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Input 
                  type="file" 
                  name="file" 
                  accept=".zip"
                  className="bg-[#050505] border-zinc-700 text-white pl-10"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
                  disabled={isPending}
                  required 
                />
                <FileArchive className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              </div>
              <Button 
                type="submit" 
                disabled={isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Substituir Agora"}
              </Button>
            </div>
            {fileName && !isPending && (
              <p className="text-xs text-orange-400 mt-1">Selecionado: {fileName}</p>
            )}
            {isPending && uploadProgress > 0 && (
              <div className="space-y-1 mt-2">
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-orange-400">
                  {uploadProgress < 100 ? "Processando e enviando..." : "Finalizando..."}
                </p>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}