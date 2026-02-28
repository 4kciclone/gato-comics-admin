import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, ShieldAlert, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AchievementsPage() {
    // @ts-ignore
    const achievements = await prisma.achievement.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { users: true }
            }
        }
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gamificação: Títulos e Conquistas</h1>
                    <p className="text-muted-foreground">Recompensas desbloqueáveis baseadas no engajamento dos leitores.</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Conquista
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {achievements.length === 0 ? (
                    <div className="col-span-full h-40 flex items-center justify-center rounded-md border border-dashed text-muted-foreground">
                        Nenhuma conquista criada. Gamifique a plataforma!
                    </div>
                ) : (
                    // @ts-ignore
                    achievements.map((achv: any) => (
                        <Card key={achv.id} className="relative overflow-hidden group">
                            {achv.isHidden && (
                                <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[10px] px-2 pt-1 pb-1 rounded-bl-lg font-bold z-10">
                                    SECRETA
                                </div>
                            )}
                            <CardContent className="p-5 flex gap-4">
                                <div className="h-14 w-14 shrink-0 rounded-full bg-primary/10 border-2 border-primary/20 flex flex-col items-center justify-center overflow-hidden">
                                    {achv.imageUrl ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={achv.imageUrl} alt={achv.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Trophy className="h-6 w-6 text-primary" />
                                    )}
                                </div>
                                <div className="flex flex-col flex-1">
                                    <h3 className="font-bold text-lg leading-tight mb-1">{achv.name}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">{achv.description}</p>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px]">
                                                {achv.type.replace("_", " ")}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">
                                                Meta: {achv.threshold}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-medium">
                                            {achv._count.users.toLocaleString("pt-BR")} desbloqueios
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
