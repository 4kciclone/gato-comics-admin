import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Users, ListTree, Settings, Image as ImageIcon } from "lucide-react";

export default async function WorkDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = await params;
    const work = await prisma.work.findUnique({
        where: { id: resolvedParams.id },
        include: {
            staff: {
                include: { user: true }
            },
            owner: true,
            _count: {
                select: { chapters: true, libraryEntries: true }
            }
        }
    });

    if (!work) {
        notFound();
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/works">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{work.title}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant={work.isHidden ? "destructive" : "default"}>
                            {work.isHidden ? "Oculto" : "Público"}
                        </Badge>
                        {work.isAdult && <Badge variant="destructive">+18</Badge>}
                        <span className="text-sm text-muted-foreground">{work.slug}</span>
                    </div>
                </div>
                <div className="flex-1" />
                <Button asChild>
                    <Link href={`/works/${work.id}/chapters`}>
                        <ListTree className="mr-2 h-4 w-4" />
                        Gerenciar Capítulos
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Capa</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={work.coverUrl} alt={work.title} className="w-full rounded-md object-cover aspect-[2/3] border" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Métricas Básicas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Capítulos Lançados</span>
                                <span className="font-semibold">{work._count.chapters}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Em Bibliotecas</span>
                                <span className="font-semibold">{work._count.libraryEntries}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Visualizações Totais</span>
                                <span className="font-semibold">{work.viewsCount.toLocaleString("pt-BR")}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Informações da Obra
                            </CardTitle>
                            <Button variant="outline" size="sm">Editar</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground font-semibold block mb-1">Autor</span>
                                    {work.author}
                                </div>
                                <div>
                                    <span className="text-muted-foreground font-semibold block mb-1">Artista/Estúdio</span>
                                    {work.artist || work.studio || "-"}
                                </div>
                                <div className="col-span-2">
                                    <span className="text-muted-foreground font-semibold block mb-1">Gêneros</span>
                                    <div className="flex gap-2 flex-wrap">
                                        {work.genres.map(g => <Badge key={g} variant="secondary">{g}</Badge>)}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-muted-foreground font-semibold block mb-1">Sinopse</span>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{work.synopsis}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Equipe da Obra (Staff)
                            </CardTitle>
                            <Button variant="outline" size="sm">Adicionar Membro</Button>
                        </CardHeader>
                        <CardContent>
                            {work.staff.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground border-dashed border-2 rounded-md">
                                    Nenhum membro da staff vinculado a esta obra.
                                </div>
                            ) : (
                                <ul className="divide-y">
                                    {work.staff.map(s => (
                                        <li key={s.id} className="py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={s.user.image || `https://avatar.vercel.sh/${s.user.email}`} alt={s.user.name || "User"} className="h-8 w-8 rounded-full bg-muted" />
                                                <div>
                                                    <p className="font-medium text-sm">{s.user.name || s.user.username}</p>
                                                    <p className="text-xs text-muted-foreground">{s.user.email}</p>
                                                </div>
                                            </div>
                                            <Badge>{s.role}</Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
