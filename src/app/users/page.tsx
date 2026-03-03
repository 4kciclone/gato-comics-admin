import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Search, Info, ShieldAlert } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserActionsDropdown } from "@/components/users/UserActionsDropdown";

export default async function UsersPage() {
    const users = await prisma.user.findMany({
        take: 50,
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>
                    <p className="text-muted-foreground">Analise contas, bans temporários e assinaturas.</p>
                </div>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Input placeholder="Buscar por email ou username..." className="bg-background" />
                <Button variant="secondary" size="icon"><Search className="h-4 w-4" /></Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Balanço</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Nenhum usuário encontrado.</TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="flex items-center gap-3 font-medium">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.image || ""} />
                                            <AvatarFallback>{user.username?.slice(0, 2).toUpperCase() || "US"}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span>{user.name || user.username}</span>
                                            {user.mutedUntil && new Date() < user.mutedUntil && (
                                                <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                                                    <ShieldAlert className="h-3 w-3" /> Silenciado
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === "USER" ? "outline" : "default"}>{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs font-semibold gap-1">
                                            <span className="text-yellow-500">{user.balancePremium} Premium</span>
                                            <span className="text-blue-400">{user.xp} XP</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" asChild title="Ver Perfil">
                                                <Link href={`/users/${user.id}`}>
                                                    <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                </Link>
                                            </Button>
                                            <UserActionsDropdown user={{ id: user.id, username: user.username, role: user.role }} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
