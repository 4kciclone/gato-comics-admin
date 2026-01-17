"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquare, StickyNote, AlertTriangle, CheckCircle, Gavel } from "lucide-react";
import { toast } from "sonner";
import { dismissReports, punishUser, PunishmentType } from "@/actions/moderation";

interface ModerationCardProps {
  data: {
    contentId: string;
    contentType: "COMMENT" | "POST";
    contentBody: string;
    author: { id: string; name: string | null; image: string | null };
    reports: { id: string; reason: string; reporterName: string | null }[];
  };
}

export function ModerationCard({ data }: ModerationCardProps) {
  const [isPending, startTransition] = useTransition();
  const [punishmentType, setPunishmentType] = useState<PunishmentType>("DELETE_ONLY");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const reportIds = data.reports.map(r => r.id);

  const handleDismiss = () => {
    startTransition(async () => {
      const res = await dismissReports(reportIds);
      if (res.error) toast.error(res.error);
      else toast.success("Denúncias ignoradas.");
    });
  };

  const handlePunish = () => {
    startTransition(async () => {
      const res = await punishUser(
        data.contentId, 
        data.contentType, 
        data.author.id, 
        punishmentType, 
        reportIds
      );
      
      if (res.error) toast.error(res.error);
      else {
        toast.success("Punição aplicada.");
        setIsDialogOpen(false);
      }
    });
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden flex flex-col h-full">
      {/* HEADER */}
      <CardHeader className="bg-zinc-950 border-b border-zinc-800 py-3 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 border border-zinc-700">
              <AvatarImage src={data.author.image || ""} />
              <AvatarFallback>{data.author.name?.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-bold text-white leading-none">{data.author.name}</p>
              <p className="text-xs text-zinc-500">Autor</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-zinc-900 text-zinc-400 border-zinc-700 gap-1">
             {data.contentType === "POST" ? <StickyNote size={12}/> : <MessageSquare size={12}/>}
             {data.contentType === "POST" ? "Post" : "Comentário"}
          </Badge>
        </div>
      </CardHeader>

      {/* CONTEÚDO */}
      <CardContent className="flex-1 p-5 space-y-4">
        <div className="relative pl-4 border-l-2 border-red-500/50">
             <p className="text-zinc-200 text-sm italic">"{data.contentBody}"</p>
        </div>

        {/* LISTA DE DENÚNCIAS */}
        <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-3">
          <h4 className="text-xs font-bold text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangle size={12} /> {data.reports.length} Denúncia(s)
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
            {data.reports.map((report) => (
              <div key={report.id} className="text-xs flex justify-between items-center bg-red-900/10 p-1.5 rounded">
                <span className="text-zinc-300 font-medium">{report.reason}</span>
                <span className="text-zinc-500">por {report.reporterName}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {/* AÇÕES */}
      <CardFooter className="bg-zinc-950 border-t border-zinc-800 p-3 gap-2">
        <Button 
          variant="ghost" 
          className="flex-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
          onClick={handleDismiss}
          disabled={isPending}
        >
          <CheckCircle className="w-4 h-4 mr-2" /> Ignorar
        </Button>

        {/* MODAL DE PUNIÇÃO */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700" disabled={isPending}>
              <Gavel className="w-4 h-4 mr-2" /> Punir
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>Aplicar Punição</DialogTitle>
              <DialogDescription>
                Escolha a severidade da punição para <strong>{data.author.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">Tipo de Sanção</label>
              <Select 
                value={punishmentType} 
                onValueChange={(val) => setPunishmentType(val as PunishmentType)}
              >
                <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-700 text-white">
                  <SelectItem value="DELETE_ONLY">Apenas Apagar Conteúdo (Aviso)</SelectItem>
                  <SelectItem value="MUTE_24H">Apagar + Silenciar 24h</SelectItem>
                  <SelectItem value="MUTE_7D">Apagar + Silenciar 7 Dias</SelectItem>
                  <SelectItem value="BAN">BANIR PERMANENTEMENTE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button 
                variant="destructive" 
                onClick={handlePunish} 
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Gavel className="w-4 h-4 mr-2"/>}
                Confirmar Sentença
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}