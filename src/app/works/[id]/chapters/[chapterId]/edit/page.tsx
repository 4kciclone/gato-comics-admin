"use client";

import { useActionState, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { editChapter } from "@/actions/chapters";

export default function EditChapterPage({
    params
}: {
    params: Promise<{ id: string; chapterId: string }>
}) {
    const resolvedParams = use(params);
    const { id: workId, chapterId } = resolvedParams;

    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Using simple state to store existing chapter data
    const [chapter, setChapter] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [isFree, setIsFree] = useState<boolean>(true);

    useEffect(() => {
        async function fetchChapter() {
            try {
                const res = await fetch(`/api/works/${workId}/chapters/${chapterId}`);
                if (res.ok) {
                    const data = await res.json();
                    setChapter({
                        ...data,
                        // Ensure input datetime format
                        publishAt: new Date(data.publishAt).toISOString().slice(0, 16)
                    });
                    setIsFree(data.isFree);
                }
            } catch (error) {
                console.error("Failed to load chapter:", error);
                toast.error("Erro ao carregar dados do capítulo.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchChapter();
    }, [workId, chapterId]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading("Salvando alterações do capítulo...");

        try {
            const formData = new FormData(e.currentTarget);
            formData.append("isFree", isFree.toString());

            const result = await editChapter(chapterId, formData);

            if (result.success) {
                toast.success("Capítulo atualizado com sucesso!", { id: toastId });
                router.push(`/works/${workId}/chapters`);
                router.refresh();
            } else {
                toast.error(result.error || "Erro desconhecido", { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error("Ocorreu um erro ao salvar.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    if (!chapter) return <div className="p-8 text-center text-red-500">Capítulo não encontrado.</div>;

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href={`/works/${workId}/chapters`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-glow">Editar Capítulo #{chapter.order}</h1>
                    <p className="text-muted-foreground mt-1">Modifique configurações como preço e agenda de publicação.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="card-premium">
                        <CardHeader>
                            <CardTitle>Informações Básicas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="order">Número da Ordem</Label>
                                <Input id="order" name="order" type="number" defaultValue={chapter.order} required className="glass" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">Nome/Título opcional</Label>
                                <Input id="title" name="title" defaultValue={chapter.title} className="glass" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="publishAt">Agendar Lançamento</Label>
                                <Input type="datetime-local" id="publishAt" name="publishAt" defaultValue={chapter.publishAt} required className="glass" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="card-premium">
                        <CardHeader>
                            <CardTitle>Preço & Monetização</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <RadioGroup
                                    onValueChange={(val) => setIsFree(val === "true")}
                                    value={isFree ? "true" : "false"}
                                    className="flex flex-col space-y-1"
                                >
                                    <div className="flex items-center space-x-3 p-3 rounded-md border glass cursor-pointer">
                                        <RadioGroupItem value="true" id="r-free" />
                                        <Label htmlFor="r-free" className="font-normal cursor-pointer flex-1">
                                            Acesso Gratuito
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-3 rounded-md border border-primary/30 bg-primary/5 cursor-pointer relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"></div>
                                        <RadioGroupItem value="false" id="r-paid" />
                                        <Label htmlFor="r-paid" className="cursor-pointer flex-1 font-bold text-primary">
                                            Pago (Premium Bloqueado)
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            {!isFree && (
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                    <div className="space-y-2">
                                        <Label htmlFor="priceLite" className="text-secondary">Preço em Patinha Lite</Label>
                                        <Input id="priceLite" name="priceLite" type="number" defaultValue={chapter.priceLite} min={0} className="glass" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pricePremium" className="text-primary">Preço em Patinha Premium</Label>
                                        <Input id="pricePremium" name="pricePremium" type="number" defaultValue={chapter.pricePremium} min={0} className="glass font-bold border-primary/50" />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting} size="lg" className="h-12 w-full sm:w-auto font-bold shadow-lg shadow-primary/20">
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando...</>
                        ) : (
                            <><Save className="mr-2 h-5 w-5" /> Aplicar Alterações</>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
