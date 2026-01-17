"use client";

import { useActionState, useState } from "react";
import { updateChapterImages } from "@/actions/chapters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, RefreshCw, AlertTriangle, FileArchive } from "lucide-react";
import { toast } from "sonner";

export function ChapterImageUpdater({ workId, chapterId }: { workId: string, chapterId: string }) {
  const [state, formAction, isPending] = useActionState(updateChapterImages, null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Feedback visual via Toast
  if (state?.error) toast.error(state.error);
  if (state?.success) toast.success(state.success);

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
        <form action={formAction} className="space-y-4">
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
            {fileName && <p className="text-xs text-orange-400 mt-1">Selecionado: {fileName}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}