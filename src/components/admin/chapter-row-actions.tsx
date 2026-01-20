"use client";

import { useState, useTransition } from "react";
import { publishChapter } from "@/actions/workflow"; // Vamos garantir que existem
import { Button } from "@/components/ui/button";
import { Loader2, Globe, EyeOff, Edit } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { ChapterWorkStatus } from "@prisma/client";

interface ChapterActionsProps {
  workId: string;
  chapterId: string;
  status: ChapterWorkStatus;
}

export function ChapterRowActions({ workId, chapterId, status }: ChapterActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handlePublish = () => {
    startTransition(async () => {
      const res = await publishChapter(chapterId);
      if (res?.error) toast.error(res.error);
      else toast.success("Capítulo publicado e visível no site!");
    });
  };

  // Se você quiser criar a função inversa (ocultar) no futuro
  /* const handleUnpublish = ... */

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Botão de Publicar (Só aparece se estiver PRONTO) */}
      {status === "READY" && (
        <Button 
          size="sm" 
          onClick={handlePublish} 
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700 text-white font-bold h-8 px-3"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3 mr-2" />}
          Publicar
        </Button>
      )}

      {/* Botão Editar (Link) */}
      <Link href={`/dashboard/obras/${workId}/chapters/${chapterId}`}>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-white">
          <Edit className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}