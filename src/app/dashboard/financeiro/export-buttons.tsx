"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { generateExcelReport, getFinanceReport } from "@/actions/finance-export";
import { toast } from "sonner";

export function ExportButtons() {
  const [loadingCsv, setLoadingCsv] = useState(false);
  const [loadingXlsx, setLoadingXlsx] = useState(false);

  // --- LÓGICA DE DOWNLOAD CSV (Simples) ---
  const downloadCsv = async () => {
    setLoadingCsv(true);
    try {
      const data = await getFinanceReport("FULL");
      
      // Converter JSON para CSV
      const headers = ["ID,Data,Usuario,Email,Tipo,Moeda,Valor,Descricao"];
      const rows = data.map(tx => {
        const date = new Date(tx.createdAt).toISOString();
        // Escapar vírgulas nos textos para não quebrar o CSV
        const desc = tx.description ? `"${tx.description.replace(/"/g, '""')}"` : "";
        return `${tx.id},${date},"${tx.user.name}","${tx.user.email}",${tx.type},${tx.currency},${tx.amount},${desc}`;
      });

      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `relatorio_completo_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Relatório CSV baixado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar CSV.");
    } finally {
      setLoadingCsv(false);
    }
  };

  // --- LÓGICA DE DOWNLOAD EXCEL (Profissional) ---
  const downloadXlsx = async () => {
    setLoadingXlsx(true);
    try {
      // Recebe o arquivo em Base64 do servidor
      const base64 = await generateExcelReport("MONTHLY");
      
      // Converte Base64 para Blob
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      
      // Dispara Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `relatorio_mensal_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Relatório Excel gerado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar Excel.");
    } finally {
      setLoadingXlsx(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        onClick={downloadXlsx}
        disabled={loadingXlsx}
      >
        {loadingXlsx ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
        Exportar Relatório (Mês .XLSX)
      </Button>
      
      <Button 
        className="bg-green-600 hover:bg-green-700 text-white"
        onClick={downloadCsv}
        disabled={loadingCsv}
      >
        {loadingCsv ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
        Exportar Completo (.CSV)
      </Button>
    </div>
  );
}