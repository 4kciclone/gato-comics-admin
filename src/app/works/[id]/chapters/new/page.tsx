"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UploadCloud, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createChapter } from "@/actions/chapters";

const formSchema = z.object({
    title: z.string().min(1, "Título é obrigatório"),
    order: z.coerce.number().min(1, "Ordem deve ser no mínimo 1"),
    isFree: z.boolean(),
    publishAt: z.string().min(1, "Data de agendamento é obrigatória")
});

export default function NewChapterPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pageFiles, setPageFiles] = useState<File[]>([]);
    const [resolvedId, setResolvedId] = useState<string>("");

    // Resolve params client-side workaround since this is a client component
    useState(() => {
        params.then(p => setResolvedId(p.id));
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            title: "",
            order: 1,
            isFree: true,
            // Format now to datetime-local expected string
            publishAt: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!resolvedId) return;
        if (pageFiles.length === 0) {
            toast.error("Você precisa adicionar pelo menos 1 imagem para o capítulo.");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Fazendo upload das imagens e criando capítulo...");

        try {
            const formData = new FormData();
            formData.append("workId", resolvedId);
            formData.append("title", values.title);
            formData.append("order", values.order.toString());
            formData.append("isFree", values.isFree.toString());
            formData.append("publishAt", new Date(values.publishAt).toISOString());

            pageFiles.forEach(file => {
                formData.append("pages", file);
            });

            const result = await createChapter(formData);

            if (result.success) {
                toast.success("Capítulo criado com sucesso!", { id: toastId });
                router.push(`/works/${resolvedId}/chapters`);
                router.refresh();
            } else {
                toast.error(result.error || "Erro desconhecido", { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error("Ocorreu um erro ao enviar.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!resolvedId) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href={`/works/${resolvedId}/chapters`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-glow">Criar Novo Capítulo</h1>
                    <p className="text-muted-foreground mt-1">
                        Faça upload das imagens e configure o lançamento.
                    </p>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="card-premium">
                            <CardHeader>
                                <CardTitle>Informações Básicas</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="order"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Número do Capítulo</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} className="glass" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome/Título opcional</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: O Início de Tudo" {...field} className="glass" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="publishAt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Agendar Lançamento</FormLabel>
                                            <FormControl>
                                                <Input type="datetime-local" {...field} className="glass border-primary/50 text-primary-foreground focus:ring-primary" />
                                            </FormControl>
                                            <FormDescription>
                                                Se escolher uma data futura, o capítulo ficará bloqueado no site até chegar a hora.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card className="card-premium">
                            <CardHeader>
                                <CardTitle>Preço & Monetização</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="isFree"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={(val) => field.onChange(val === "true")}
                                                    defaultValue={field.value ? "true" : "false"}
                                                    className="flex flex-col space-y-1"
                                                >
                                                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-md border glass hover:bg-white/5 transition-colors cursor-pointer">
                                                        <FormControl>
                                                            <RadioGroupItem value="true" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal cursor-pointer flex-1">
                                                            Acesso Gratuito
                                                        </FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center space-x-3 space-y-0 p-3 rounded-md border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"></div>
                                                        <FormControl>
                                                            <RadioGroupItem value="false" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal cursor-pointer flex-1 font-bold text-primary">
                                                            Pago (Premium Bloqueado)
                                                        </FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="card-premium">
                        <CardHeader>
                            <CardTitle>Páginas (Imagens)</CardTitle>
                            <CardDescription>
                                Selecione as imagens do capítulo na ordem correta.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Input
                                    id="pages"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="glass"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setPageFiles(Array.from(e.target.files));
                                        }
                                    }}
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    {pageFiles.length > 0 ? `${pageFiles.length} imagens selecionadas para upload.` : "Nenhuma imagem selecionada."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={isSubmitting} size="lg" className="w-full text-lg h-14 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processando e Enviando...
                            </>
                        ) : (
                            <>
                                <UploadCloud className="mr-2 h-5 w-5" />
                                Publicar e Salvar Capítulo
                            </>
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
