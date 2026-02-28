"use client";

import { Hand } from "lucide-react";

export default function SettingsPage({
    initialSettings
}: {
    initialSettings: Record<string, string>
}) {
    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-20">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-glow">Configurações Globais</h1>
                <p className="text-muted-foreground mt-1 text-lg">
                    Gerencie variáveis críticas do sistema relacionadas ao aplicativo e painel.
                </p>
            </div>

            <div className="glass rounded-lg border border-border p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
                <Hand className="h-16 w-16 mb-4 opacity-30" />
                <h3 className="text-xl font-medium text-foreground mb-2">Painel de Configurações Limpo</h3>
                <p>Nenhuma configuração necessita ser ajustada neste momento.</p>
            </div>
        </div>
    );
}
