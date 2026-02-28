import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShieldAlert } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function ReportsPage() {
    const reports = await prisma.report.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        include: {
            reporter: { select: { username: true } },
            comment: { select: { content: true, userId: true, user: { select: { username: true } } } },
            post: { select: { content: true, userId: true, user: { select: { username: true } } } }
        }
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Central de Denúncias</h1>
                    <p className="text-muted-foreground">Analise relatórios de má conduta (comentários ou posts da comunidade).</p>
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Alvo</TableHead>
                            <TableHead>Conteúdo Denunciado</TableHead>
                            <TableHead>Motivo / Reporter</TableHead>
                            <TableHead className="text-right">Ação</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    Nenhuma denúncia aberta no momento. Parabéns! 🎉
                                </TableCell>
                            </TableRow>
                        ) : (
                            reports.map((rep) => {
                                const isComment = !!rep.commentId;
                                const targetContent = isComment ? rep.comment?.content : rep.post?.content;
                                const targetAuthor = isComment ? rep.comment?.user?.username : rep.post?.user?.username;

                                return (
                                    <TableRow key={rep.id}>
                                        <TableCell>
                                            <Badge variant={isComment ? "outline" : "secondary"}>
                                                {isComment ? "Comentário" : "Post"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[400px]">
                                            <div className="font-semibold text-xs mb-1">Autor: {targetAuthor}</div>
                                            <div className="text-sm truncate p-2 border rounded bg-muted/20">
                                                {targetContent}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-red-500 mb-1">{rep.reason}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Por: {rep.reporter.username} <br />
                                                {rep.createdAt.toLocaleDateString("pt-BR")}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="outline" size="sm" className="text-green-500 hover:text-green-600 hover:bg-green-50">
                                                <CheckCircle className="h-4 w-4 mr-1" /> Ignorar
                                            </Button>
                                            <Button variant="destructive" size="sm">
                                                <ShieldAlert className="h-4 w-4 mr-1" /> Apagar e Punir
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
