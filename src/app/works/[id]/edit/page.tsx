"use client";

import { useActionState, use } from "react";
import { editWork, WorkState } from "@/actions/works";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AgeRating } from "@prisma/client";

const initialState: WorkState = null;

export default function EditWorkPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    // Unwraps the params Promise in Next.js 15
    const resolvedParams = use(params);
    const workId = resolvedParams.id;

    // We manually bind the workId to our Server Action
    const updateWorkWithId = editWork.bind(null, workId);
    const [state, formAction, isPending] = useActionState(updateWorkWithId, initialState);

    const [work, setWork] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch existing data to populate default values
    useEffect(() => {
        async function fetchWork() {
            try {
                const res = await fetch(`/api/works/${workId}`);
                if (res.ok) {
                    const data = await res.json();
                    setWork(data);
                }
            } catch (error) {
                console.error("Failed to load work data");
            } finally {
                setIsLoading(false);
            }
        }
        fetchWork();
    }, [workId]);

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Carregando dados da obra...</div>;
    }

    if (!work) {
        return <div className="p-8 text-center text-red-500">Obra não encontrada.</div>;
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Editar Obra</h1>
                    <p className="text-muted-foreground">Altere os campos que desejar. Deixe a capa em branco para manter a atual.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href={`/works/${workId}`}>Voltar</Link>
                </Button>
            </div>

            <form action={formAction}>
                <Card>
                    <CardHeader>
                        <CardTitle>Informações Principais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {state?.error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Erro</AlertTitle>
                                <AlertDescription>{state.error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título da Obra</Label>
                                <Input id="title" name="title" defaultValue={work.title} placeholder="Ex: Solo Leveling" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="author">Autor</Label>
                                <Input id="author" name="author" defaultValue={work.author} placeholder="Autor principal" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="studio">Estúdio/Artista</Label>
                                <Input id="studio" name="studio" defaultValue={work.studio || ""} placeholder="Nome do estúdio ou desenhista" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ageRating">Classificação Indicativa</Label>
                                <Select name="ageRating" defaultValue={work.ageRating} required>
                                    <SelectTrigger id="ageRating">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LIVRE">Livre</SelectItem>
                                        <SelectItem value="DEZ_ANOS">10 Anos</SelectItem>
                                        <SelectItem value="DOZE_ANOS">12 Anos</SelectItem>
                                        <SelectItem value="QUATORZE_ANOS">14 Anos</SelectItem>
                                        <SelectItem value="DEZESSEIS_ANOS">16 Anos</SelectItem>
                                        <SelectItem value="DEZOITO_ANOS">18 Anos (+Adulto)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="genres">Gêneros (separados por vírgula)</Label>
                            <Input id="genres" name="genres" defaultValue={work.genres.join(", ")} placeholder="Ação, Fantasia, Isekai" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="synopsis">Sinopse</Label>
                            <Textarea
                                id="synopsis"
                                name="synopsis"
                                defaultValue={work.synopsis}
                                placeholder="Descrição resumida da obra..."
                                className="h-32"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coverImage">Substituir Capa (Opcional)</Label>
                            <Input id="coverImage" name="coverImage" type="file" accept="image/*" className="cursor-pointer" />
                            <p className="text-xs text-muted-foreground">Envie um novo arquivo caso deseje sobrescrever a imagem atual (Proporção 2:3).</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Salvando Alterações..." : "Salvar Edição"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
