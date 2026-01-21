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
  const [state, formAction, isPending] = useActionState(createPromoCode, null);

  useEffect(() => {
    if (state?.success) toast.success(state.success);
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    // MUDANÇA: bg-zinc-900 (mais claro que o fundo da página) para destacar o card
    <Card className="bg-zinc-900 border-zinc-800 shadow-lg">
        <CardHeader>
            <CardTitle className="text-white">Criar Novo</CardTitle>
        </CardHeader>
        <CardContent>
            <form action={formAction} className="space-y-5">
                <div className="space-y-2">
                    <Label className="text-zinc-300">Código (Ex: WELCOME2026)</Label>
                    {/* MUDANÇA: Input preto (bg-black) com borda mais visível (border-zinc-700) */}
                    <Input 
                        name="code" 
                        className="bg-black border-zinc-700 text-white placeholder:text-zinc-600 uppercase font-mono tracking-wider" 
                        required 
                        placeholder="GATO10" 
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Tipo</Label>
                        <Select name="type" defaultValue="LITE">
                            <SelectTrigger className="bg-black border-zinc-700 text-white">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                                <SelectItem value="LITE">Lite (Roxa)</SelectItem>
                                <SelectItem value="PREMIUM">Premium (Ouro)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Quantidade</Label>
                        <Input 
                            type="number" 
                            name="amount" 
                            defaultValue="10" 
                            className="bg-black border-zinc-700 text-white" 
                            required 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-zinc-300">Limite de Usos (Opcional)</Label>
                    <Input 
                        type="number" 
                        name="maxUses" 
                        placeholder="Vazio = Infinito" 
                        className="bg-black border-zinc-700 text-white placeholder:text-zinc-600" 
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-zinc-300">Data de Expiração (Opcional)</Label>
                    <Input 
                        type="date" 
                        name="expiresAt" 
                        className="bg-black border-zinc-700 text-white scheme-dark" 
                    />
                </div>

                <Button disabled={isPending} className="w-full bg-[#FFD700] text-black font-bold hover:bg-yellow-300 transition-colors">
                    {isPending ? <Loader2 className="animate-spin mr-2"/> : "Gerar Código"}
                </Button>
            </form>
        </CardContent>
    </Card>
  )
}