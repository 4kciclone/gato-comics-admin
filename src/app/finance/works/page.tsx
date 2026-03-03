"use client";

import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Loader2, TrendingUp, Calendar as CalendarIcon, Wallet, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { exportWorksRevenueCSV } from "@/actions/export";
import { getWorksRevenueReport } from "@/actions/reports";
import { prisma } from "@/lib/prisma"; // This will be used in a new server action or fetched directly if possible
import Image from "next/image";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Típagem importada espelhando o report (poderia ser movida para tipo global, mas omitiremos pra agilidade)
type ReportItem = {
    workTitle: string;
    workCover: string;
    totalUnlocks: number;
    liteRevenue: number;
    premiumRevenue: number;
    tiersRevenue: { BRONZE: number; SILVER: number; GOLD: number; DIAMOND: number; NONE: number; };
    tiersCount: { BRONZE: number; SILVER: number; GOLD: number; DIAMOND: number; NONE: number; };
    liteSourcesRevenue: { AD_WATCH: number; COIN_PACK: number; SUBSCRIPTION: number; PROMO_CODE: number; ADMIN_GIFT: number; OTHER: number; };
};

export default function WorksRevenuePage() {
    const [date, setDate] = useState<{ from: Date; to: Date }>({
        from: subDays(new Date(), 30),
        to: new Date()
    });

    const [data, setData] = useState<ReportItem[]>([]);
    const [works, setWorks] = useState<{ id: string; title: string }[]>([]);
    const [selectedWork, setSelectedWork] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        // Fetch works for the filter dropdown
        async function loadWorks() {
            try {
                const res = await fetch("/api/works/list"); // I'll need to create this mini-endpoint or use a server action
                if (res.ok) {
                    const list = await res.json();
                    setWorks(list);
                }
            } catch (e) {
                console.error("Erro ao carregar lista de obras", e);
            }
        }
        loadWorks();
    }, []);

    useEffect(() => {
        if (date?.from && date?.to) {
            fetchData();
        }
    }, [date, selectedWork]);

    async function fetchData() {
        setIsLoading(true);
        try {
            const res = await getWorksRevenueReport(date.from, date.to, selectedWork);
            if (res.success && res.data) {
                setData(res.data);
            } else {
                toast.error(res.error || "Erro obtendo dados.");
            }
        } catch (error) {
            toast.error("Erro interno ao buscar relatórios.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleExport() {
        setIsExporting(true);
        const toastId = toast.loading("Gerando planilha CSV profissional...");
        try {
            const res = await exportWorksRevenueCSV(
                date.from.toISOString(),
                date.to.toISOString(),
                selectedWork
            );

            if (res.success && res.csv && res.filename) {
                // Criar o download do arquivo no navegador (Blob Trick)
                const blob = new Blob(["\uFEFF" + res.csv], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for excel UTF-8 BOM
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", res.filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                toast.success("Download iniciado!", { id: toastId });
            } else {
                toast.error(res.error || "Erro exportando.", { id: toastId });
            }
        } catch (error) {
            toast.error("Ocorreu um erro no cliente.", { id: toastId });
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <div className="flex flex-col gap-6 w-full pb-20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-glow flex items-center gap-2">
                        <TrendingUp className="h-8 w-8 text-primary" /> Faturamento por Obra (BI)
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Acompanhe o desempenho de vendas (Patinhas Lite e Premium) separadas por Assinaturas.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    <Select value={selectedWork} onValueChange={setSelectedWork}>
                        <SelectTrigger className="w-[200px] bg-background/50 glass border-primary/20">
                            <SelectValue placeholder="Filtrar por Obra" />
                        </SelectTrigger>
                        <SelectContent className="glass">
                            <SelectItem value="all">Todas as Obras</SelectItem>
                            {works.map((w) => (
                                <SelectItem key={w.id} value={w.id}>
                                    {w.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[260px] justify-start text-left font-normal glass",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y", { locale: ptBR })} -{" "}
                                            {format(date.to, "LLL dd, y", { locale: ptBR })}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y", { locale: ptBR })
                                    )
                                ) : (
                                    <span>Escolha um período</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 glass border-primary/20" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={(range: any) => { if (range) setDate(range) }}
                                numberOfMonths={2}
                                locale={ptBR}
                            />
                        </PopoverContent>
                    </Popover>

                    <Button onClick={handleExport} disabled={isExporting || isLoading || data.length === 0} className="shadow-lg shadow-primary/20">
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                        Exportar CSV
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="h-[400px] flex items-center justify-center glass rounded-lg border border-border">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : data.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center glass rounded-lg border border-border text-muted-foreground">
                    <Wallet className="h-16 w-16 mb-4 opacity-30" />
                    <p className="text-lg">Nenhuma venda registrada neste período.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {/* Sumário Estiloso Total */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="card-premium border-l-4 border-l-primary/60">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Obras com Movimentação</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{data.length}</div>
                            </CardContent>
                        </Card>
                        <Card className="card-premium border-l-4 border-l-amber-500/60">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Premium Consumido</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-amber-500 drop-shadow-sm flex items-center gap-2">
                                    <Wallet className="h-5 w-5" /> {data.reduce((a, b) => a + b.premiumRevenue, 0).toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="card-premium border-l-4 border-l-slate-400/60">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Lite Consumido</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-300 drop-shadow-sm flex items-center gap-2">
                                    <Wallet className="h-5 w-5" /> {data.reduce((a, b) => a + b.liteRevenue, 0).toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="card-premium">
                        <CardHeader>
                            <CardTitle>Detalhamento de Receita por Obra</CardTitle>
                            <CardDescription>
                                Ranking baseado na quantia de Patinhas de Unlocks contabilizadas no período.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto rounded-md border border-border/50">
                                <table className="w-full text-sm text-left align-middle">
                                    <thead className="bg-muted/40 text-muted-foreground border-b border-border/50">
                                        <tr>
                                            <th className="px-4 py-4 font-medium">Obra</th>
                                            <th className="px-4 py-4 font-medium">Unlocks</th>
                                            <th className="px-4 py-4 font-medium">Faturamento Premium</th>
                                            <th className="px-4 py-4 font-medium">Faturamento Lite</th>
                                            <th className="px-4 py-4 font-medium">Divisão (Lite) por Origem</th>
                                            <th className="px-4 py-4 font-medium">Divisão (Premium) por Assinatura</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/20">
                                        {data.map((item, i) => (
                                            <tr key={i} className="hover:bg-muted/10 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative h-12 w-9 rounded-sm overflow-hidden border border-border/50 shadow-sm shrink-0">
                                                            <Image src={item.workCover} alt={item.workTitle} fill className="object-cover" />
                                                        </div>
                                                        <span className="font-semibold text-foreground/90">{item.workTitle}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-mono">
                                                    {item.totalUnlocks.toLocaleString()}x
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-mono text-sm">
                                                        {item.premiumRevenue.toLocaleString()} pts
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="bg-slate-500/10 text-slate-300 border-slate-500/30 font-mono text-xs">
                                                        {item.liteRevenue.toLocaleString()} pts
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        {item.liteSourcesRevenue.AD_WATCH > 0 && (
                                                            <span className="bg-sky-500/20 text-sky-300 px-2 py-1 rounded-md border border-sky-500/30">
                                                                Anúncios: {item.liteSourcesRevenue.AD_WATCH}
                                                            </span>
                                                        )}
                                                        {item.liteSourcesRevenue.COIN_PACK > 0 && (
                                                            <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-md border border-green-500/30">
                                                                Pacotes Pagos: {item.liteSourcesRevenue.COIN_PACK}
                                                            </span>
                                                        )}
                                                        {item.liteSourcesRevenue.SUBSCRIPTION > 0 && (
                                                            <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-md border border-purple-500/30">
                                                                Assinatura Brinde: {item.liteSourcesRevenue.SUBSCRIPTION}
                                                            </span>
                                                        )}
                                                        {item.liteSourcesRevenue.PROMO_CODE > 0 && (
                                                            <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded-md border border-pink-500/30">
                                                                Promo Code: {item.liteSourcesRevenue.PROMO_CODE}
                                                            </span>
                                                        )}
                                                        {item.liteSourcesRevenue.ADMIN_GIFT > 0 && (
                                                            <span className="bg-rose-500/20 text-rose-300 px-2 py-1 rounded-md border border-rose-500/30">
                                                                Presente: {item.liteSourcesRevenue.ADMIN_GIFT}
                                                            </span>
                                                        )}
                                                        {item.liteSourcesRevenue.OTHER > 0 && (
                                                            <span className="bg-muted/50 text-muted-foreground px-2 py-1 rounded-md border border-border">
                                                                Outros/Antigos: {item.liteSourcesRevenue.OTHER}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        {item.tiersRevenue.DIAMOND > 0 && (
                                                            <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md border border-indigo-500/30">
                                                                Diamante: {item.tiersRevenue.DIAMOND}
                                                            </span>
                                                        )}
                                                        {item.tiersRevenue.GOLD > 0 && (
                                                            <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-md border border-yellow-500/30">
                                                                Ouro: {item.tiersRevenue.GOLD}
                                                            </span>
                                                        )}
                                                        {item.tiersRevenue.SILVER > 0 && (
                                                            <span className="bg-zinc-300/20 text-zinc-300 px-2 py-1 rounded-md border border-zinc-400/30">
                                                                Prata: {item.tiersRevenue.SILVER}
                                                            </span>
                                                        )}
                                                        {item.tiersRevenue.BRONZE > 0 && (
                                                            <span className="bg-orange-800/40 text-orange-300 px-2 py-1 rounded-md border border-orange-800/50">
                                                                Bronze: {item.tiersRevenue.BRONZE}
                                                            </span>
                                                        )}
                                                        {item.tiersRevenue.NONE > 0 && (
                                                            <span className="bg-muted/50 text-muted-foreground px-2 py-1 rounded-md border border-border">
                                                                Avulsos (Nenhum): {item.tiersRevenue.NONE}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
