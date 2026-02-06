"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteChapter } from "@/actions/admin/delete-chapter"; 
import { toast } from "sonner"; 

interface DeleteChapterButtonProps {
  workId: string;
  chapterId: string;
  chapterOrder: number;
}

export function DeleteChapterButton({ workId, chapterId, chapterOrder }: DeleteChapterButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteChapter(workId, chapterId);
      if (result?.error) {
        toast.error("Erro ao deletar", { description: result.error });
        setIsOpen(false);
      }
      // Sucesso redireciona automaticamente via server action
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2 bg-red-950/40 hover:bg-red-900 text-red-400 hover:text-white border border-red-900/50">
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Excluir Capítulo</span>
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent className="bg-[#111] border-zinc-800 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            Tem certeza absoluta?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Você está prestes a excluir o <strong>Capítulo {chapterOrder}</strong>.
            <br /><br />
            Isso irá apagar permanentemente todas as imagens do servidor e remover o acesso dos usuários. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white hover:text-white">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white border-none"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deletando...</>
            ) : (
              "Sim, Excluir Definitivamente"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}