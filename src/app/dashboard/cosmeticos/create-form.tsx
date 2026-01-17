"use client";

import { useActionState, useState } from "react";
import { createCosmetic } from "@/actions/cosmetics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Image as ImageIcon } from "lucide-react";

export function CosmeticCreateForm() {
  const [state, formAction, isPending] = useActionState(createCosmetic, null);
  const [previewUrl, setPreviewUrl] = useState("");

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Novo Cosmético</CardTitle>
        <CardDescription className="text-zinc-400">
          Adicione itens à loja. Use links públicos do R2.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="flex gap-6">
            {/* Preview da Imagem */}
            <div className="shrink-0">
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center bg-zinc-950 overflow-hidden relative">
                    {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                        <ImageIcon className="text-zinc-700 w-8 h-8" />
                    )}
                </div>
                <p className="text-xs text-center text-zinc-500 mt-2">Preview</p>
            </div>

            {/* Campos Principais */}
            <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input name="name" placeholder="Ex: Moldura Dourada" className="bg-zinc-950 border-zinc-800 text-white" required />
                    </div>
                    <div className="space-y-2">
                        <Label>Preço (Patinhas)</Label>
                        <Input name="price" type="number" placeholder="250" className="bg-zinc-950 border-zinc-800 text-white" required />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>URL da Imagem (R2/S3)</Label>
                    <Input 
                        name="imageUrl" 
                        placeholder="https://..." 
                        className="bg-zinc-950 border-zinc-800 text-white" 
                        onChange={(e) => setPreviewUrl(e.target.value)}
                        required 
                    />
                </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input name="description" placeholder="Descrição curta para a loja" className="bg-zinc-950 border-zinc-800 text-white" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Tipo</Label>
                <Select name="type" required>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white"><SelectValue placeholder="Tipo..." /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="AVATAR_FRAME">Moldura de Avatar</SelectItem>
                        <SelectItem value="PROFILE_BANNER">Banner de Perfil</SelectItem>
                        <SelectItem value="COMMENT_BACKGROUND">Fundo de Comentário</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Raridade</Label>
                <Select name="rarity" required>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white"><SelectValue placeholder="Raridade..." /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="COMMON">Comum (Cinza)</SelectItem>
                        <SelectItem value="RARE">Raro (Azul)</SelectItem>
                        <SelectItem value="EPIC">Épico (Roxo)</SelectItem>
                        <SelectItem value="LEGENDARY">Lendário (Dourado)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>

          {state?.error && <p className="text-red-400 text-sm bg-red-950/50 p-2 rounded border border-red-900/50">{state.error}</p>}
          {state?.success && <p className="text-green-400 text-sm bg-green-950/50 p-2 rounded border border-green-900/50">{state.success}</p>}

          <Button type="submit" disabled={isPending} className="w-full bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cadastrar Item
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}