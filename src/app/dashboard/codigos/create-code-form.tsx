"use client";

import { useActionState, useEffect } from "react";
import { createPromoCode } from "@/actions/admin-codes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CreateCodeForm() {
  // Agora a assinatura da função bate com o esperado pelo useActionState
  const [state, formAction, isPending] = useActionState(createPromoCode, null);

  useEffect(() => {
    if (state?.success) toast.success(state.success);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Card className="bg-[#111] border-zinc-800">
        <CardHeader><CardTitle>Criar Novo</CardTitle></CardHeader>
        <CardContent>
            <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                    <Label>Código (Ex: WELCOME2026)</Label>
                    <Input name="code" className="bg-zinc-950 border-zinc-800 uppercase" required placeholder="GATO10" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select name="type" defaultValue="LITE">
                            <SelectTrigger className="bg-zinc-950 border-zinc-800"><SelectValue/></SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                <SelectItem value="LITE">Lite (Roxa)</SelectItem>
                                <SelectItem value="PREMIUM">Premium (Ouro)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Quantidade</Label>
                        <Input type="number" name="amount" defaultValue="10" className="bg-zinc-950 border-zinc-800" required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Limite de Usos (Opcional)</Label>
                    <Input type="number" name="maxUses" placeholder="Vazio = Infinito" className="bg-zinc-950 border-zinc-800" />
                </div>
                <div className="space-y-2">
                    <Label>Data de Expiração (Opcional)</Label>
                    {/* CORREÇÃO TAILWIND: scheme-dark em vez de [color-scheme:dark] */}
                    <Input type="date" name="expiresAt" className="bg-zinc-950 border-zinc-800 scheme-dark" />
                </div>
                <Button disabled={isPending} className="w-full bg-[#FFD700] text-black font-bold hover:bg-yellow-300">
                    {isPending ? <Loader2 className="animate-spin"/> : "Gerar Código"}
                </Button>
            </form>
        </CardContent>
    </Card>
  )
}