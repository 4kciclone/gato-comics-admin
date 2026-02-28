"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, Loader2, Coins } from "lucide-react";
import { toast } from "sonner";
import { saveSettings } from "@/actions/settings";

const formSchema = z.object({
    LITE_COIN_PRICE: z.coerce.number().min(0.01, "O valor mínimo é 0.01"),
    PREMIUM_COIN_PRICE: z.coerce.number().min(0.01, "O valor mínimo é 0.01"),
});

export default function SettingsPage({
    initialSettings
}: {
    initialSettings: Record<string, string>
}) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fallback defaults if they don't exist yet in the DB
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            LITE_COIN_PRICE: parseFloat(initialSettings["LITE_COIN_PRICE"] || "0.10"),
            PREMIUM_COIN_PRICE: parseFloat(initialSettings["PREMIUM_COIN_PRICE"] || "1.00"),
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        const toastId = toast.loading("Salvando configurações globais...");

        try {
            const result = await saveSettings({
                LITE_COIN_PRICE: values.LITE_COIN_PRICE.toString(),
                PREMIUM_COIN_PRICE: values.PREMIUM_COIN_PRICE.toString()
            });

            if (result.success) {
                toast.success("Configurações atualizadas com sucesso!", { id: toastId });
                router.refresh();
            } else {
                toast.error(result.error || "Erro ao salvar", { id: toastId });
            }
        } catch (error) {
            toast.error("Ocorreu um erro no servidor.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-glow">Configurações Globais</h1>
                <p className="text-muted-foreground mt-1 text-lg">
                    Gerencie variáveis críticas do sistema como taxas de conversão de moedas.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card className="card-premium">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-yellow-500/20 rounded-lg">
                                    <Coins className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div>
                                    <CardTitle>Economia e Conversão</CardTitle>
                                    <CardDescription>
                                        Defina o valor em Reais (R$) para cada unidade das moedas virtuais do aplicativo.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="LITE_COIN_PRICE"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor da Moeda Lite (R$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} className="glass font-mono text-lg" />
                                        </FormControl>
                                        <FormDescription>
                                            Quanto custa 1 "Patinha Lite" (Moeda ganha em baús ou comprada barata).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="PREMIUM_COIN_PRICE"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-primary font-bold">Valor da Moeda Premium (R$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} className="glass border-primary/50 text-xl font-mono" />
                                        </FormControl>
                                        <FormDescription>
                                            Quanto custa 1 "Patinha Premium" (Moeda VIP para comprar capítulos restritos).
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Button type="submit" disabled={isSubmitting} size="lg" className="w-full text-lg h-14 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-5 w-5" />
                                Aplicar Configurações
                            </>
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
