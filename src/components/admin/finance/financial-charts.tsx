"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ['#FFD700', '#3b82f6', '#8884d8', '#ff8042', '#22c55e'];

interface ChartsProps {
  revenueOverTime: { date: string; value: number }[];
  revenueBySource: { name: string; value: number }[];
  topWorks: { name: string; revenue: number }[];
}

export function FinancialCharts({ revenueOverTime, revenueBySource, topWorks }: ChartsProps) {
  // Formatação para BRL no Tooltip
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* 1. GRÁFICO DE ÁREA: Evolução da Receita (30 Dias) */}
      <Card className="bg-[#111] border-zinc-800 col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white">Evolução da Receita (Últimos 30 Dias)</CardTitle>
        </CardHeader>
        {/* Correção Tailwind: h-[350px] -> h-87.5 */}
        <CardContent className="h-87.5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueOverTime}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#666" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickMargin={10}
              />
              <YAxis 
                stroke="#666" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(val) => `R$${val}`}
                width={80}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#FFD700' }}
                // CORREÇÃO TS: Aceita qualquer tipo e converte para número de forma segura
                formatter={(value: any) => [formatCurrency(Number(value || 0)), "Receita"]}
                labelStyle={{ color: '#999', marginBottom: '0.5rem' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#FFD700" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. GRÁFICO DE BARRAS: Top Obras */}
      <Card className="bg-[#111] border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Top 5 Obras Mais Rentáveis</CardTitle>
        </CardHeader>
        {/* Correção Tailwind: h-[300px] -> h-75 */}
        <CardContent className="h-75">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topWorks} layout="vertical" margin={{ left: 0, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
              <XAxis type="number" stroke="#666" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#ccc" 
                fontSize={12} 
                width={120} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                cursor={{fill: '#ffffff05'}}
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
                // CORREÇÃO TS
                formatter={(value: any) => [formatCurrency(Number(value || 0)), "Gerado"]}
              />
              <Bar dataKey="revenue" fill="#FFD700" radius={[0, 4, 4, 0]} barSize={20}>
                {topWorks.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#FFD700' : '#334155'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 3. GRÁFICO DE PIZZA: Fonte de Receita */}
      <Card className="bg-[#111] border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Distribuição de Receita</CardTitle>
        </CardHeader>
        {/* Correção Tailwind: h-[300px] -> h-75 */}
        <CardContent className="h-75">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={revenueBySource}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {revenueBySource.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '8px' }} 
                 // CORREÇÃO TS
                 formatter={(value: any) => formatCurrency(Number(value || 0))}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle"/>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  );
}