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
import { deleteWork } from "@/actions/admin/delete-work"; // Importe a action criada
import { toast } from "sonner"; 

interface DeleteWorkButtonProps {
  workId: string;
  workTitle: string;
}

export function DeleteWorkButton({ workId, workTitle }: DeleteWorkButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteWork(workId);
      if (result?.error) {
        toast.error("Erro", { description: result.error });
        setIsOpen(false);
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" title="Deletar Obra">
          <Trash2 className="w-5 h-5" />
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent className="bg-[#111] border-zinc-800 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-500 text-xl">
            <AlertTriangle className="w-6 h-6" />
            DELETAR OBRA INTEIRA?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400 text-base">
            Você está prestes a excluir <strong>{workTitle}</strong>.
            <br /><br />
            Isso apagará:
            <ul className="list-disc list-inside mt-2 text-red-400 font-bold">
                <li>Todos os capítulos</li>
                <li>Todas as imagens do servidor (R2)</li>
                <li>Todo o histórico de leitura dos usuários</li>
            </ul>
            <br />
            Essa ação é irreversível.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white border-none font-bold"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
            ) : (
              "Sim, Deletar Tudo"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}