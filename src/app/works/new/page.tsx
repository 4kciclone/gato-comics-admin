"use client";

import { useActionState } from "react";
import { createWork, WorkState } from "@/actions/works";
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

const initialState: WorkState = null;

export default function NewWorkPage() {
    const [state, formAction, isPending] = useActionState(createWork, initialState);

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Adicionar Obra</h1>
                    <p className="text-muted-foreground">Preencha os dados e anexe a capa para adicionar ao catálogo.</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/works">Cancelar</Link>
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
                                <Input id="title" name="title" placeholder="Ex: Solo Leveling" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="author">Autor</Label>
                                <Input id="author" name="author" placeholder="Autor principal" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="studio">Estúdio/Artista</Label>
                                <Input id="studio" name="studio" placeholder="Nome do estúdio ou desenhista" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ageRating">Classificação Indicativa</Label>
                                <Select name="ageRating" defaultValue="LIVRE" required>
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
                            <Input id="genres" name="genres" placeholder="Ação, Fantasia, Isekai" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="synopsis">Sinopse</Label>
                            <Textarea
                                id="synopsis"
                                name="synopsis"
                                placeholder="Descrição resumida da obra..."
                                className="h-32"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coverImage">Capa (Imagem principal)</Label>
                            <Input id="coverImage" name="coverImage" type="file" accept="image/*" required className="cursor-pointer" />
                            <p className="text-xs text-muted-foreground">O arquivo será enviado para o Cloudflare R2 automaticamente e deve ter boa resolução (Proporção 2:3).</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Salvando Obra..." : "Criar Obra"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
