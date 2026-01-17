"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, FileImage, CheckCircle, XCircle, UploadCloud, Download, Loader2, Clock } from "lucide-react";
import { submitTask, reviewTask } from "@/actions/workflow";
import { toast } from "sonner";

interface TaskCardProps {
  chapter: any;
  userRole: string; // O papel do usuário logado NESSA obra (ex: EDITOR)
}

export function TaskCard({ chapter, userRole }: TaskCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Define se este card é acionável pelo usuário atual
  const isMyTurn = 
    (userRole === "TRANSLATOR" && chapter.workStatus === "TRANSLATING") ||
    (userRole === "EDITOR" && chapter.workStatus === "EDITING") ||
    (userRole === "QC" && chapter.workStatus === "QC_PENDING");

  const statusColors: any = {
    TRANSLATING: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    EDITING: "bg-purple-500/20 text-purple-400 border-purple-500/50",
    QC_PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    READY: "bg-green-500/20 text-green-400 border-green-500/50",
  };

  const handleReview = async (decision: "APPROVE" | "REJECT") => {
    setIsPending(true);
    const res = await reviewTask(chapter.id, decision);
    setIsPending(false);
    if (res.error) toast.error(res.error);
    else toast.success(res.success);
  };

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    const res = await submitTask(formData);
    setIsPending(false);
    if (res.error) {
        toast.error(res.error);
    } else {
        toast.success(res.success);
        setIsUploadOpen(false);
    }
  }

  return (
    <Card className={`border ${isMyTurn ? "border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.1)]" : "border-zinc-800 opacity-70 hover:opacity-100"} bg-[#111] transition-all`}>
      <CardHeader className="p-4 border-b border-zinc-800 flex flex-row justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-[10px]">
               Cap. {chapter.order}
             </Badge>
             <Badge className={`text-[10px] border ${statusColors[chapter.workStatus] || "bg-zinc-800 text-zinc-400"}`}>
               {chapter.workStatus}
             </Badge>
          </div>
          <h3 className="font-bold text-white text-lg leading-tight">{chapter.work.title}</h3>
          <p className="text-sm text-zinc-500">{chapter.title}</p>
        </div>
        {isMyTurn && (
            <div className="animate-pulse w-3 h-3 rounded-full bg-[#FFD700]" title="Sua vez!" />
        )}
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {/* ARQUIVOS DISPONÍVEIS */}
        <div className="space-y-2">
            {chapter.rawZipUrl && (
                <a href={chapter.rawZipUrl} target="_blank" className="flex items-center gap-2 text-xs p-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors">
                    <FileImage className="w-4 h-4 text-blue-400" />
                    <span>Baixar RAW (.zip)</span>
                    <Download className="w-3 h-3 ml-auto opacity-50" />
                </a>
            )}
            {chapter.translationUrl && (
                <a href={chapter.translationUrl} target="_blank" className="flex items-center gap-2 text-xs p-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors">
                    <FileText className="w-4 h-4 text-green-400" />
                    <span>Baixar Tradução</span>
                    <Download className="w-3 h-3 ml-auto opacity-50" />
                </a>
            )}
            {chapter.editedZipUrl && (
                <a href={chapter.editedZipUrl} target="_blank" className="flex items-center gap-2 text-xs p-2 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors">
                    <FileImage className="w-4 h-4 text-purple-400" />
                    <span>Baixar Edição (.zip)</span>
                    <Download className="w-3 h-3 ml-auto opacity-50" />
                </a>
            )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {isMyTurn ? (
            <div className="w-full">
                {/* AÇÕES DE TRADUTOR / EDITOR */}
                {(userRole === "TRANSLATOR" || userRole === "EDITOR") && (
                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold">
                                <UploadCloud className="w-4 h-4 mr-2" />
                                {userRole === "TRANSLATOR" ? "Enviar Tradução" : "Enviar Edição"}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                            <DialogHeader>
                                <DialogTitle>Entregar Tarefa</DialogTitle>
                            </DialogHeader>
                            <form action={handleSubmit} className="space-y-4 py-4">
                                <input type="hidden" name="chapterId" value={chapter.id} />
                                <input type="hidden" name="role" value={userRole} />
                                
                                <div className="space-y-2">
                                    <Label>Arquivo ({userRole === "TRANSLATOR" ? ".txt / .pdf" : ".zip"})</Label>
                                    <Input type="file" name="file" className="bg-zinc-950 border-zinc-800" required />
                                </div>
                                <Button type="submit" disabled={isPending} className="w-full bg-[#FFD700] text-black hover:bg-[#FFD700]/90">
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar e Concluir"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}

                {/* AÇÕES DE QC */}
                {userRole === "QC" && (
                    <div className="flex gap-2 w-full">
                        <Button 
                            onClick={() => handleReview("REJECT")} 
                            variant="destructive" 
                            disabled={isPending}
                            className="flex-1 bg-red-900/50 hover:bg-red-900 border border-red-900"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <XCircle className="w-4 h-4 mr-2" />} 
                            Rejeitar
                        </Button>
                        <Button 
                            onClick={() => handleReview("APPROVE")} 
                            disabled={isPending}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Aprovar
                        </Button>
                    </div>
                )}
            </div>
        ) : (
            <div className="w-full text-center">
                <p className="text-xs text-zinc-600 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" /> Aguardando etapa anterior
                </p>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}