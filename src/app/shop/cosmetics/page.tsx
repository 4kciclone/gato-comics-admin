import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Star, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CosmeticsPage() {
    const cosmetics = await prisma.cosmetic.findMany({
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Loja e Cosméticos</h1>
                    <p className="text-muted-foreground">Banners, molduras, cores para nome e decorações de perfil.</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Cosmético
                </Button>
            </div>

            {cosmetics.length === 0 ? (
                <div className="h-40 flex items-center justify-center rounded-md border border-dashed text-muted-foreground">
                    Nenhum cosmético cadastrado.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {cosmetics.map(cos => (
                        <Card key={cos.id} className={!cos.isActive ? "opacity-50" : ""}>
                            <CardContent className="p-4 flex flex-col gap-3">
                                <div className="aspect-square bg-muted rounded-md border flex items-center justify-center relative overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={cos.imageUrl} alt={cos.name} className="w-full h-full object-cover absolute inset-0" />
                                    <Badge className="absolute top-2 right-2 text-[10px]">{cos.rarity}</Badge>
                                </div>
                                <div>
                                    <h3 className="font-semibold line-clamp-1 flex justify-between items-center">
                                        {cos.name}
                                        <span className="text-xs font-normal opacity-70 border px-1 rounded bg-secondary">{cos.type.replace("_", " ")}</span>
                                    </h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[32px]">{cos.description}</p>
                                </div>

                                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                    <span className="text-sm font-bold flex items-center gap-1">
                                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                        {cos.price}
                                    </span>
                                    <Button variant="outline" size="sm" className="h-6 text-xs w-fit">
                                        <Edit className="h-3 w-3 mr-1" /> Editar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
