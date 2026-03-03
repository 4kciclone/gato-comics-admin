"use client";

import { useState } from "react";
import {
    MoreHorizontal,
    Shield,
    Coins,
    Zap,
    UserCog,
    Loader2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
    updateUserRole,
    managePremium,
    giveLiteCoins,
    setSubscription
} from "@/actions/admin-users";
import { UserRole, SubscriptionTier } from "@prisma/client";

interface UserActionsDropdownProps {
    user: {
        id: string;
        username: string;
        role: UserRole;
    };
}

export function UserActionsDropdown({ user }: UserActionsDropdownProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState<"role" | "premium" | "lite" | "vip" | null>(null);

    // Form states
    const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
    const [amount, setAmount] = useState<number>(0);
    const [reason, setReason] = useState("");
    const [selectedTier, setSelectedTier] = useState<SubscriptionTier | "NONE">("NONE");
    const [days, setDays] = useState(30);

    async function handleAction(actionFn: () => Promise<any>) {
        setIsLoading(true);
        try {
            const res = await actionFn();
            if (res.success) {
                toast.success(res.success);
                setOpenDialog(null);
            } else {
                toast.error(res.error || "Erro na operação.");
            }
        } catch (error) {
            toast.error("Erro interno.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações de Admin</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setOpenDialog("role")}>
                        <Shield className="mr-2 h-4 w-4" /> Alterar Cargo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenDialog("premium")}>
                        <Coins className="mr-2 h-4 w-4" /> Movimentar Premium
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenDialog("lite")}>
                        <Zap className="mr-2 h-4 w-4 text-blue-400" /> Dar Patinhas Lite
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setOpenDialog("vip")}>
                        <UserCog className="mr-2 h-4 w-4 text-purple-400" /> Gerenciar VIP
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Modal: Alterar Cargo */}
            <Dialog open={openDialog === "role"} onOpenChange={(open) => !open && setOpenDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Alterar Cargo: {user.username}</DialogTitle>
                        <DialogDescription>Apenas o dono pode alterar cargos administrativos.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Selecione o novo cargo</Label>
                            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">User (Padrão)</SelectItem>
                                    <SelectItem value="MODERATOR">Moderador</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="UPLOADER">Uploader</SelectItem>
                                    <SelectItem value="ACCOUNTANT">Contador</SelectItem>
                                    <SelectItem value="OWNER">Dono</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpenDialog(null)}>Cancelar</Button>
                        <Button onClick={() => handleAction(() => updateUserRole(user.id, selectedRole))} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Movimentar Premium */}
            <Dialog open={openDialog === "premium"} onOpenChange={(open) => !open && setOpenDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Movimentar Patinhas Premium</DialogTitle>
                        <DialogDescription>Use valores negativos para remover moedas.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Quantidade</Label>
                            <Input type="number" placeholder="Ex: 100 ou -50" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Motivo</Label>
                            <Input placeholder="Ex: Promoção ou Erro no Sistema" value={reason} onChange={(e) => setReason(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpenDialog(null)}>Cancelar</Button>
                        <Button onClick={() => handleAction(() => managePremium(user.id, amount, reason))} disabled={isLoading}>
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Gerenciar VIP */}
            <Dialog open={openDialog === "vip"} onOpenChange={(open) => !open && setOpenDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gerenciar Assinatura (VIP)</DialogTitle>
                        <DialogDescription>Conceder ou remover acesso VIP manualmente.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Plano</Label>
                            <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as any)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NONE">Nenhum / Cancelar</SelectItem>
                                    <SelectItem value="BRONZE">Bronze</SelectItem>
                                    <SelectItem value="SILVER">Prata</SelectItem>
                                    <SelectItem value="GOLD">Ouro</SelectItem>
                                    <SelectItem value="DIAMOND">Diamante</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedTier !== "NONE" && (
                            <div className="space-y-2">
                                <Label>Duração (Dias)</Label>
                                <Input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpenDialog(null)}>Cancelar</Button>
                        <Button onClick={() => handleAction(() => setSubscription(user.id, selectedTier, days))} disabled={isLoading}>
                            Aplicar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
