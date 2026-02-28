import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Plus, Eye, Clock, CalendarDays, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ChaptersListPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = await params;

    const work = await prisma.work.findUnique({
        where: { id: resolvedParams.id },
        include: {
            chapters: {
                orderBy: { order: 'desc' }
            }
        }
    });

    if (!work) return <div>Obra não encontrada</div>;

    const chapters = work.chapters;
    const now = new Date();

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-glow">
                        Capítulos: {work.title}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie os capítulos e os agendamentos de lançamento.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild className="glass">
                        <Link href={`/works/${work.id}`}>Voltar para Obra</Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/works/${work.id}/chapters/new`}>
                            <Plus className="mr-2 h-4 w-4" /> Novo Capítulo
                        </Link>
                    </Button>
                </div>
            </div>

            <Card className="card-premium">
                <CardHeader>
                    <CardTitle>Catálogo de Capítulos</CardTitle>
                    <CardDescription>Lista completa de envios.</CardDescription>
                </CardHeader>
                <CardContent>
                    {chapters.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground glass rounded-lg">
                            <CalendarDays className="h-12 w-12 mb-4 opacity-50" />
                            <p>Nenhum capítulo cadastrado ainda.</p>
                            <Button variant="link" asChild className="mt-2">
                                <Link href={`/works/${work.id}/chapters/new`}>Agendar o primeiro!</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden glass">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Ordem</th>
                                        <th className="px-4 py-3 font-medium">Título</th>
                                        <th className="px-4 py-3 font-medium">Lançamento (Agendamento)</th>
                                        <th className="px-4 py-3 font-medium">Status no Site</th>
                                        <th className="px-4 py-3 font-medium text-center">Preços (Lite / Premium)</th>
                                        <th className="px-4 py-3 font-medium">Acesso</th>
                                        <th className="px-4 py-3 font-medium text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {chapters.map((chapter) => {
                                        const isPublished = new Date(chapter.publishAt) <= now;

                                        return (
                                            <tr key={chapter.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono font-medium">#{chapter.order}</td>
                                                <td className="px-4 py-3 font-medium">{chapter.title}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                        {format(chapter.publishAt, "d 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isPublished ? (
                                                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-emerald-500/20">
                                                            Publicado
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                                            Agendado
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {chapter.isFree ? (
                                                        <span className="text-muted-foreground">-</span>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2 text-xs font-mono">
                                                            <span className="text-secondary">{chapter.priceLite} L</span>
                                                            <span className="text-muted-foreground">/</span>
                                                            <span className="text-primary font-bold">{chapter.pricePremium} P</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {chapter.isFree ? (
                                                        <Badge variant="secondary" className="bg-muted/50">Gratuito</Badge>
                                                    ) : (
                                                        <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30 shadow-none border-primary/20 flex items-center gap-1 w-fit">
                                                            <Lock className="h-3 w-3" /> Pago
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/works/${work.id}/chapters/${chapter.id}/edit`}>Editar</Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
