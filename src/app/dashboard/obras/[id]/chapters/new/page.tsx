"use client";

import { useActionState, useState, use } from "react";
import { createChapter } from "@/actions/chapters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UploadCloud, FileArchive, ArrowRight } from "lucide-react";

const initialState = {
  message: null as string | null,
};

export default function NewChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: workId } = use(params);
  
  const [state, formAction, isPending] = useActionState(createChapter, initialState);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Novo Capítulo</h1>
        <p className="text-zinc-400">Upload e configuração inicial.</p>
      </div>

      <form action={formAction}>
        <input type="hidden" name="workId" value={workId} />

        <Card className="bg-[#111] border-[#27272a] text-white">
          <CardHeader><CardTitle>Dados do Capítulo</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número (#)</Label>
                <Input name="number" type="number" step="0.1" placeholder="Ex: 1" className="bg-[#050505] border-[#27272a]" required />
              </div>
              <div className="space-y-2">
                <Label>Título (Opcional)</Label>
                <Input name="title" placeholder="Ex: O Começo" className="bg-[#050505] border-[#27272a]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#FFD700]">Preço Premium</Label>
                <Input name="pricePremium" type="number" defaultValue="3" className="bg-[#050505] border-[#27272a]" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Preço Lite</Label>
                <Input name="priceLite" type="number" defaultValue="10" className="bg-[#050505] border-[#27272a]" />
              </div>
            </div>

            {/* FLUXO DE TRABALHO - REPASSAR FUNÇÃO */}
            <div className="p-4 bg-zinc-900 rounded border border-zinc-800 space-y-2">
                <Label className="text-blue-400 font-bold flex items-center gap-2">
                    Fluxo de Trabalho Inicial <ArrowRight className="w-4 h-4"/>
                </Label>
                <p className="text-xs text-zinc-500 mb-2">
                    Defina para quem esse capítulo vai agora. Se já estiver pronto, marque como "Publicado" ou "Pronto".
                </p>
                <Select name="initialStatus" defaultValue="DRAFT">
                    <SelectTrigger className="bg-[#050505] border-[#27272a]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] text-white border-zinc-800">
                        <SelectItem value="DRAFT">Rascunho (Ninguém vê)</SelectItem>
                        <SelectItem value="TRANSLATING">Enviar para Tradutor</SelectItem>
                        <SelectItem value="EDITING">Enviar para Editor</SelectItem>
                        <SelectItem value="QC_PENDING">Enviar para QC</SelectItem>
                        <SelectItem value="PUBLISHED" className="text-green-500 font-bold">Publicar Agora</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center space-x-2">
               <input type="checkbox" id="isFree" name="isFree" className="rounded border-zinc-700 bg-[#050505]" />
               <Label htmlFor="isFree">Capítulo Gratuito</Label>
            </div>

            <div className="space-y-2">
              <Label>Arquivo de Imagens (.zip)</Label>
              <div className="border-2 border-dashed border-[#27272a] hover:border-[#FFD700] rounded-lg p-8 transition-colors text-center relative bg-[#050505]/50">
                <input 
                  type="file" 
                  name="file" 
                  accept=".zip" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
                  required
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  {fileName ? (
                    <>
                      <FileArchive className="w-10 h-10 text-[#FFD700]" />
                      <span className="text-white font-medium">{fileName}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-zinc-500" />
                      <span className="text-zinc-400">Arraste seu ZIP aqui</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}

            <Button type="submit" disabled={isPending} className="w-full bg-[#FFD700] text-black font-bold h-12">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : "Criar Capítulo"}
            </Button>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}