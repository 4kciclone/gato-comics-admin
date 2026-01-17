"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateUserRole, managePremium, giveLiteCoins, setSubscription } from "@/actions/admin-users";
import { toast } from "sonner";
import { Edit, Loader2, Shield, Coins, Crown } from "lucide-react";

export function UserEditDialog({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // Estados dos formulários
  const [role, setRole] = useState(user.role);
  const [premiumAmount, setPremiumAmount] = useState("");
  const [liteAmount, setLiteAmount] = useState("");
  const [subTier, setSubTier] = useState<string>(user.subscriptionTier || "NONE");
  const [subDays, setSubDays] = useState("30");

  // Handlers
  const handleRoleChange = () => {
    startTransition(async () => {
      const res = await updateUserRole(user.id, role);
      if (res.success) toast.success(res.success);
      else toast.error(res.error);
    });
  };

  const handlePremium = () => {
    startTransition(async () => {
      const amount = parseInt(premiumAmount);
      if (isNaN(amount)) return;
      const res = await managePremium(user.id, amount, "Inserção Manual");
      if (res.success) { toast.success(res.success); setPremiumAmount(""); }
      else toast.error(res.error);
    });
  };

  const handleLite = () => {
    startTransition(async () => {
      const amount = parseInt(liteAmount);
      if (isNaN(amount)) return;
      const res = await giveLiteCoins(user.id, amount, 7); // Padrão 7 dias
      if (res.success) { toast.success(res.success); setLiteAmount(""); }
      else toast.error(res.error);
    });
  };

  const handleSub = () => {
    startTransition(async () => {
      const days = parseInt(subDays);
      const res = await setSubscription(user.id, subTier as any, days);
      if (res.success) toast.success(res.success);
      else toast.error(res.error);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Edit className="w-4 h-4 text-zinc-400 hover:text-white" /></Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111] border-zinc-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar: {user.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="role" className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 w-full">
            <TabsTrigger value="role" className="flex-1">Cargo</TabsTrigger>
            <TabsTrigger value="economy" className="flex-1">Economia</TabsTrigger>
            <TabsTrigger value="sub" className="flex-1">Assinatura</TabsTrigger>
          </TabsList>

          {/* ABA DE CARGO */}
          <TabsContent value="role" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cargo Atual</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="USER">Usuário</SelectItem>
                  <SelectItem value="WORK_OWNER">Parceiro (Dono de Obra)</SelectItem>
                  <SelectItem value="TRANSLATOR">Tradutor</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                  <SelectItem value="QC">QC</SelectItem>
                  <SelectItem value="UPLOADER">Uploader</SelectItem>
                  <SelectItem value="MODERATOR">Moderador</SelectItem>
                  <SelectItem value="ACCOUNTANT">Contador</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleRoleChange} disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Shield className="w-4 h-4 mr-2"/>}
              Atualizar Permissões
            </Button>
          </TabsContent>

          {/* ABA DE ECONOMIA */}
          <TabsContent value="economy" className="space-y-6 py-4">
            <div className="space-y-2 p-3 border border-zinc-800 rounded bg-zinc-900/50">
              <Label className="text-[#FFD700]">Adicionar Premium (Permanente)</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  placeholder="Qtd (Ex: 100 ou -100)" 
                  value={premiumAmount} 
                  onChange={e => setPremiumAmount(e.target.value)}
                  className="bg-zinc-950 border-zinc-800"
                />
                <Button onClick={handlePremium} disabled={isPending} className="bg-[#FFD700] text-black">
                   {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : "Enviar"}
                </Button>
              </div>
            </div>

            <div className="space-y-2 p-3 border border-zinc-800 rounded bg-zinc-900/50">
              <Label className="text-blue-400">Adicionar Lite (Validade 7 dias)</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  placeholder="Qtd" 
                  value={liteAmount} 
                  onChange={e => setLiteAmount(e.target.value)}
                  className="bg-zinc-950 border-zinc-800"
                />
                <Button onClick={handleLite} disabled={isPending} className="bg-blue-600 text-white">
                   {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : "Enviar"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ABA DE ASSINATURA */}
          <TabsContent value="sub" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select value={subTier} onValueChange={setSubTier}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="NONE">Sem Plano (Remover)</SelectItem>
                    <SelectItem value="BRONZE">Bronze</SelectItem>
                    <SelectItem value="SILVER">Prata</SelectItem>
                    <SelectItem value="GOLD">Ouro</SelectItem>
                    <SelectItem value="DIAMOND">Diamante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duração (Dias)</Label>
                <Input 
                  type="number" 
                  value={subDays} 
                  onChange={e => setSubDays(e.target.value)} 
                  className="bg-zinc-950 border-zinc-800"
                />
              </div>
            </div>
            <Button onClick={handleSub} disabled={isPending} className="w-full bg-purple-600 hover:bg-purple-700">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Crown className="w-4 h-4 mr-2"/>}
              Definir Assinatura
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}