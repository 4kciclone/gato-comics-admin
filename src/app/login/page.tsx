"use client";

import { useActionState } from "react"; // Hook do React 19/Next 15
import { authenticate } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800 text-white">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-[#FFD700] w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="w-6 h-6 text-black" />
          </div>
          <CardTitle className="text-2xl font-bold">Gato Admin</CardTitle>
          <CardDescription className="text-zinc-400">
            Acesso restrito para funcionários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Corporativo</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="admin@gatocomics.com.br" 
                className="bg-zinc-950 border-zinc-800 text-white focus:border-[#FFD700]"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                className="bg-zinc-950 border-zinc-800 text-white focus:border-[#FFD700]"
                required 
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded bg-red-900/20 border border-red-900/50 text-red-200 text-sm text-center">
                {errorMessage}
              </div>
            )}

            <Button 
              className="w-full bg-[#FFD700] text-black font-bold hover:bg-[#FFD700]/90" 
              disabled={isPending}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Acessar Painel"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-zinc-800 pt-4">
          <p className="text-xs text-zinc-500">
            Sistema seguro monitorado por IP.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}