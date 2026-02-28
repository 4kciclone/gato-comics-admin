import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, ListTree } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function WorksPage() {
    const works = await prisma.work.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { chapters: true }
            }
        }
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Obras (Catálogo)</h1>
                    <p className="text-muted-foreground">Gerencie os títulos e mangás da Gato Comics.</p>
                </div>
                <Button asChild>
                    <Link href="/works/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Obra
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Autor/Artista</TableHead>
                            <TableHead className="text-center">Capítulos</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {works.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhuma obra encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            works.map((work) => (
                                <TableRow key={work.id}>
                                    <TableCell className="font-medium">
                                        {work.title}
                                        <div className="text-xs text-muted-foreground mt-1">/{work.slug}</div>
                                    </TableCell>
                                    <TableCell>
                                        {work.author} {work.artist ? ` / ${work.artist}` : ""}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{work._count.chapters}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {work.isHidden ? (
                                            <Badge variant="outline" className="text-red-500">Oculto</Badge>
                                        ) : (
                                            <Badge variant="default" className="bg-green-500">Público</Badge>
                                        )}
                                        {work.isAdult && (
                                            <Badge variant="destructive" className="ml-2">+18</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="icon" asChild title="Capítulos">
                                            <Link href={`/works/${work.id}/chapters`}>
                                                <ListTree className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="icon" asChild title="Editar">
                                            <Link href={`/works/${work.id}`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
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
