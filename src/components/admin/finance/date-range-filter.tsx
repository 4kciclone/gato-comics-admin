"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangeFilterProps {
  from: Date;
  to: Date;
}

export function DateRangeFilter({ from, to }: DateRangeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [date, setDate] = React.useState<DateRange | undefined>({
    from,
    to,
  });

  // Atualiza a URL quando a data muda
  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    
    if (range?.from && range?.to) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("from", range.from.toISOString());
      params.set("to", range.to.toISOString());
      router.push(`?${params.toString()}`, { scroll: false });
    }
  };

  const setPreset = (days: number) => {
    const newTo = new Date();
    const newFrom = subDays(newTo, days);
    handleSelect({ from: newFrom, to: newTo });
  };

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal bg-[#111] border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/y", { locale: ptBR })} -{" "}
                  {format(date.to, "dd/MM/y", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "dd/MM/y", { locale: ptBR })
              )
            ) : (
              <span>Selecione o período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-[#111] border-zinc-800" align="end">
          <div className="p-3 border-b border-zinc-800 flex gap-2">
             <Button variant="outline" size="sm" onClick={() => setPreset(7)} className="text-xs h-8 bg-zinc-900 border-zinc-700">7 dias</Button>
             <Button variant="outline" size="sm" onClick={() => setPreset(30)} className="text-xs h-8 bg-zinc-900 border-zinc-700">30 dias</Button>
             <Button variant="outline" size="sm" onClick={() => setPreset(90)} className="text-xs h-8 bg-zinc-900 border-zinc-700">90 dias</Button>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={ptBR}
            className="bg-[#111] text-white"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}