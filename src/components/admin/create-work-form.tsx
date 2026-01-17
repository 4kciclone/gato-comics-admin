"use client";

import { useActionState, useState, useRef } from "react";
import { createWork } from "@/actions/works";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, UploadCloud, AlertTriangle, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

// Lista de classificações (Mantida)
const AGE_RATINGS = [
  { value: "LIVRE", label: "Livre (Todos os públicos)", color: "text-green-500" },
  { value: "DEZ_ANOS", label: "10 Anos (Violência leve)", color: "text-blue-400" },
  { value: "DOZE_ANOS", label: "12 Anos (Linguagem, Insinuação)", color: "text-yellow-400" },
  { value: "QUATORZE_ANOS", label: "14 Anos (Violência, Drogas lícitas)", color: "text-orange-400" },
  { value: "DEZESSEIS_ANOS", label: "16 Anos (Violência grave, Nudez)", color: "text-red-400" },
  { value: "DEZOITO_ANOS", label: "18 Anos (Conteúdo Adulto, Sexo, Gore)", color: "text-red-600 font-bold" },
];

// Interface para os parceiros que vêm do banco
interface CreateWorkFormProps {
  partners: { id: string; name: string | null; email: string }[];
}

export function CreateWorkForm({ partners }: CreateWorkFormProps) {
  const [state, formAction, isPending] = useActionState(createWork, null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <form action={formAction}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: CAPA */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-[#111] border-[#27272a]">
            <CardHeader><CardTitle className="text-sm">Capa Oficial</CardTitle></CardHeader>
            <CardContent>
              <div className={cn(
                "relative aspect-2/3 w-full rounded-lg border-2 border-dashed border-zinc-800 bg-[#050505] flex items-center justify-center overflow-hidden transition-colors hover:border-[#FFD700]/50",
                !preview && "cursor-pointer"
              )}>
                <input
                  type="file"
                  name="coverImage"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  required
                />
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Capa" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <UploadCloud className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">Arraste ou clique</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA: DADOS */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#111] border-[#27272a] text-white">
            <CardHeader><CardTitle>Informações Principais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label>Título da Obra</Label>
                <Input name="title" placeholder="Ex: Solo Leveling" className="bg-[#050505] border-[#27272a]" required />
              </div>

              {/* --- NOVO CAMPO: DONO DA OBRA --- */}
              <div className="space-y-2">
                <Label className="text-[#FFD700] flex items-center gap-2">
                    <Crown size={14} /> Detentor dos Direitos (Parceiro)
                </Label>
                <Select name="ownerId">
                  <SelectTrigger className="bg-[#050505] border-[#27272a]">
                    <SelectValue placeholder="Selecione o parceiro..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#27272a] text-white">
                    {partners.length === 0 ? (
                        <SelectItem value="none" disabled>Nenhum usuário com cargo WORK_OWNER encontrado</SelectItem>
                    ) : (
                        partners.map(partner => (
                            <SelectItem key={partner.id} value={partner.id}>
                                {partner.name} ({partner.email})
                            </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-zinc-500">
                    Este usuário terá acesso ao painel de métricas desta obra.
                </p>
              </div>
              {/* -------------------------------- */}

              <div className="space-y-2">
                <Label>Sinopse</Label>
                <Textarea name="synopsis" placeholder="Resumo da história..." className="bg-[#050505] border-[#27272a] min-h-25" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Autor</Label><Input name="author" className="bg-[#050505]" required /></div>
                <div className="space-y-2"><Label>Estúdio</Label><Input name="studio" className="bg-[#050505]" /></div>
              </div>

              <div className="space-y-2">
                <Label>Gêneros (Tags)</Label>
                <Input name="genres" placeholder="Ação, Fantasia, Drama" className="bg-[#050505] border-[#27272a]" required />
                <p className="text-xs text-zinc-500">Separe por vírgulas.</p>
              </div>

            </CardContent>
          </Card>

          {/* CARD DE CLASSIFICAÇÃO ETÁRIA */}
          <Card className="bg-[#111] border-[#27272a] text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Classificação Indicativa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label>Faixa Etária</Label>
                <Select name="ageRating" required>
                  <SelectTrigger className="bg-[#050505] border-[#27272a]">
                    <SelectValue placeholder="Selecione a classificação" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-[#27272a] text-white">
                    {AGE_RATINGS.map((rating) => (
                      <SelectItem key={rating.value} value={rating.value} className={rating.color}>
                        {rating.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Avisos de Conteúdo (Content Warnings)</Label>
                <Input name="contentTags" placeholder="Ex: Violência Extrema, Nudez, Linguagem Imprópria" className="bg-[#050505] border-[#27272a]" />
              </div>

            </CardContent>
          </Card>

          {state?.error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900">{state.error}</p>}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isPending} className="bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90 w-full md:w-auto">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isPending ? "Cadastrando..." : "Cadastrar Obra"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}