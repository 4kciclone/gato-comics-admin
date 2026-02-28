import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, ShieldBan, MessageSquare, BookOpen, Star, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function UserProfilePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = await params;
    const user = await prisma.user.findUnique({
        where: { id: resolvedParams.id }
    });

    if (!user) {
        notFound();
    }

    const isMuted = user.mutedUntil && new Date() < user.mutedUntil;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/users">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Perfil de Usuário</h1>
                </div>
                <div className="flex-1" />
                {isMuted ? (
                    <Button variant="outline" className="text-green-600 border-green-600">
                        Remover Punição
                    </Button>
                ) : (
                    <Button variant="destructive">
                        <ShieldBan className="mr-2 h-4 w-4" /> Mutar / Banir
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Info Pessoal e Status */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={user.image || ""} />
                                <AvatarFallback className="text-2xl">{user.username?.slice(0, 2).toUpperCase() || "US"}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-xl font-bold">{user.name || user.username}</h2>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div className="flex gap-2 w-full mt-2">
                                <div className="flex-1 rounded-md border p-3 flex flex-col items-center">
                                    <span className="text-xl font-bold text-yellow-500">{user.balancePremium}</span>
                                    <span className="text-[10px] uppercase text-muted-foreground">Premium</span>
                                </div>
                                <div className="flex-1 rounded-md border p-3 flex flex-col items-center">
                                    <span className="text-xl font-bold text-blue-400">{user.xp}</span>
                                    <span className="text-[10px] uppercase text-muted-foreground">XP Global</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhes da Conta</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Membro desde</span>
                                <span className="font-semibold">{user.createdAt.toLocaleDateString("pt-BR")}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Cargo</span>
                                <Badge variant={user.role === "USER" ? "outline" : "default"}>{user.role}</Badge>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Status</span>
                                {isMuted ? (
                                    <span className="text-red-500 font-bold whitespace-nowrap text-right">
                                        Silenciado até <br />{user.mutedUntil?.toLocaleDateString("pt-BR")}
                                    </span>
                                ) : (
                                    <span className="text-green-500 font-bold">Ativo</span>
                                )}
                            </div>
                            {user.subscriptionTier && (
                                <div className="flex justify-between pt-2">
                                    <span className="text-muted-foreground">Assinatura Ativa</span>
                                    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600">{user.subscriptionTier}</Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Estatísticas de Atividade */}
                <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">-</div>
                                    <div className="text-xs text-muted-foreground">Caps. Lidos</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <Star className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">-</div>
                                    <div className="text-xs text-muted-foreground">Na Biblioteca</div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">-</div>
                                    <div className="text-xs text-muted-foreground">Comentários</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex gap-2 items-center"><UserCheck className="h-5 w-5" /> Bio e Preferências</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <span className="text-muted-foreground block mb-1 font-semibold">Biografia</span>
                                <p className="border rounded-md p-3 bg-muted/50 whitespace-pre-wrap">{user.bio || "Usuário não preencheu a bio."}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-muted-foreground block mb-1 font-semibold">Localização</span>
                                    <p>{user.location || "-"}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-1 font-semibold">Perfil</span>
                                    <Badge variant="outline">{user.privacySettings}</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
