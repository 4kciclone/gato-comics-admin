"use client";

import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Download,
    Loader2,
    Calculator,
    Calendar as CalendarIcon,
    ArrowUpRight,
    History,
    CreditCard,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getAccountingData, exportAccountingCSV } from "@/actions/accounting";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function AccountingPage() {
    const [date, setDate] = useState<{ from: Date; to: Date }>({
        from: subDays(new Date(), 30),
        to: new Date()
    });

    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (date?.from && date?.to) {
            fetchData();
        }
    }, [date]);

    async function fetchData() {
        setIsLoading(true);
        try {
            const res = await getAccountingData(date.from, date.to);
            if (res.success) {
                setData(res.data);
            }
        } catch (error: any) {
            toast.error(error.message || "Erro ao buscar dados contábeis.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleExport() {
        setIsExporting(true);
        const toastId = toast.loading("Gerando planilha para o contador...");
        try {
            const res = await exportAccountingCSV(date.from.toISOString(), date.to.toISOString());

            if (res.success && res.csv && res.filename) {
                const blob = new Blob(["\uFEFF" + res.csv], { type: 'text/csv;charset=utf-8;' });
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
            toast.error("Erro interno ao exportar.", { id: toastId });
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <div className="flex flex-col gap-6 w-full pb-20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-glow flex items-center gap-2">
                        <Calculator className="h-8 w-8 text-emerald-400" /> Contabilidade Mensal
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Relatórios estritos de entrada de capital (Venda de Pacotes e Assinaturas).
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("justify-start text-left font-normal w-[260px]", !date && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "dd LLL, y", { locale: ptBR })} -{" "}
                                            {format(date.to, "dd LLL, y", { locale: ptBR })}
                                        </>
                                    ) : (
                                        format(date.from, "dd LLL, y", { locale: ptBR })
                                    )
                                ) : (
                                    <span>Selecione o Período</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date as any}
                                onSelect={setDate as any}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>

                    <Button onClick={handleExport} disabled={isExporting || isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                        Exportar CSV (Contador)
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map(i => <Card key={i} className="h-32 animate-pulse bg-white/5" />)}
                </div>
            ) : data && (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="card-premium border-emerald-500/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Venda de Pacotes (Moedas)</CardTitle>
                                <CreditCard className="h-4 w-4 text-emerald-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-400">
                                    {data.coinPacks.totalValue.toLocaleString()} Moedas Obtenidas
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {data.coinPacks.count} pacotes vendidos no período.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="card-premium border-purple-500/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Novas Assinaturas</CardTitle>
                                <Zap className="h-4 w-4 text-purple-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-400">
                                    {data.subscriptions.totalCount} Conversões
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Novos planos registrados no log.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="card-premium">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" /> Detalhamento de Depósitos
                            </CardTitle>
                            <CardDescription>Lista de entradas de capital identificadas como depósitos diretos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Usuário</TableHead>
                                        <TableHead>Moeda</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Descrição</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.coinPacks.details.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                Nenhum depósito no período selecionado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.coinPacks.details.map((tx: any) => (
                                            <TableRow key={tx.id}>
                                                <TableCell className="text-xs font-mono">
                                                    {format(new Date(tx.createdAt), "dd/MM/yy HH:mm")}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{tx.user?.name || "N/A"}</div>
                                                    <div className="text-[10px] text-muted-foreground">{tx.user?.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={tx.currency === "PREMIUM" ? "text-yellow-500 border-yellow-500" : "text-sky-400 border-sky-400"}>
                                                        {tx.currency}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-bold text-emerald-400">
                                                    +{tx.amount}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {tx.description}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
