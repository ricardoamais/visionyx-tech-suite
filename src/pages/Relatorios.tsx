   import { useState, useMemo } from "react";
   import { useQuery } from "@tanstack/react-query";
   import { supabase } from "@/integrations/supabase/client";
   import { useEmpresa } from "@/contexts/EmpresaContext";
 import { PageHeader } from "@/components/PageHeader";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
  import { useOrdensServico } from "@/hooks/useOrdensServico";
  import { useOrcamentos } from "@/hooks/useOrcamentos";
  import { useContas } from "@/hooks/useContas";
  import { useMaintenanceContracts } from "@/hooks/useMaintenanceContracts";
 import { StatCard } from "@/components/StatCard";
 import { Button } from "@/components/ui/button";
 import { 
   startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, 
   isWithinInterval, format, parseISO, subMonths 
 } from "date-fns";
 import { ptBR } from "date-fns/locale";
   import { CalendarIcon, Printer, FileDown, CheckCircle2, XCircle, Clock, ClipboardList, Building, TrendingUp, DollarSign } from "lucide-react";
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
 import { Calendar } from "@/components/ui/calendar";
 import { cn } from "@/lib/utils";
 import { DateRange } from "react-day-picker";

const COLORS = ["hsl(217, 91%, 60%)", "hsl(38, 92%, 50%)", "hsl(142, 71%, 45%)", "hsl(220, 10%, 46%)"];

export default function Relatorios() {
   const [dateRange, setDateRange] = useState<DateRange | undefined>({
     from: subDays(new Date(), 30),
     to: new Date(),
   });
   const [activeFilter, setActiveFilter] = useState<string>("30d");
 
   const { companyId } = useEmpresa();
   const { data: ordensServico = [] } = useOrdensServico();
   const { data: orcamentos = [] } = useOrcamentos();
   const { data: contratos = [] } = useMaintenanceContracts();
   
   const { data: movimentos = [], isLoading: loadingMov } = useQuery({
     queryKey: ["relatorios-movimentos", companyId, dateRange],
     enabled: !!companyId && !!dateRange?.from && !!dateRange?.to,
     queryFn: async () => {
       const { data, error } = await supabase
         .from("caixa_movimentos")
         .select("*")
         .eq("company_id", companyId)
         .gte("created_at", startOfDay(dateRange!.from!).toISOString())
         .lte("created_at", endOfDay(dateRange!.to!).toISOString())
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data;
     }
   });
 
   const handleFilterChange = (filter: string) => {
     setActiveFilter(filter);
     const today = new Date();
     switch (filter) {
       case "7d":
         setDateRange({ from: subDays(today, 7), to: today });
         break;
       case "15d":
         setDateRange({ from: subDays(today, 15), to: today });
         break;
       case "30d":
         setDateRange({ from: subDays(today, 30), to: today });
         break;
       case "thisMonth":
         setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
         break;
       case "lastMonth":
         const lastMonth = subMonths(today, 1);
         setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
         break;
     }
   };
 
   const filteredData = useMemo(() => {
     if (!dateRange?.from || !dateRange?.to) return null;
 
     const interval = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) };
 
     const os = ordensServico.filter(o => isWithinInterval(parseISO(o.created_at), interval));
     const orcs = orcamentos.filter(o => isWithinInterval(parseISO(o.created_at), interval));
     
     const entradas = movimentos.filter(m => m.tipo === 'entrada');
     const saidas = movimentos.filter(m => m.tipo === 'saida');
     
     const faturamento = entradas.reduce((s, m) => s + Number(m.valor), 0);
     const totalSaidas = saidas.reduce((s, m) => s + Number(m.valor), 0);
     const lucro = faturamento - totalSaidas;
 
     const receitaOS = entradas.filter(m => m.origem === 'os').reduce((s, m) => s + Number(m.valor), 0);
     const receitaORC = entradas.filter(m => m.origem === 'orcamento' || m.origem === 'orc').reduce((s, m) => s + Number(m.valor), 0);
     const receitaPDV = entradas.filter(m => m.origem === 'pdv').reduce((s, m) => s + Number(m.valor), 0);
     const receitaContratos = entradas.filter(m => m.origem === 'contrato').reduce((s, m) => s + Number(m.valor), 0);
 
     const osFinalizadasPeriodo = os.filter(o => ["finalizado", "entregue"].includes(o.status)).length;
     const ticketMedioOS = osFinalizadasPeriodo > 0 ? receitaOS / osFinalizadasPeriodo : 0;
 
     const orcAprovados = orcs.filter(o => o.status === "aprovado").length;
     const orcRecusados = orcs.filter(o => o.status === "reprovado").length;
 
     const faturamentoPorDia = entradas.reduce((acc: any[], curr) => {
       const day = format(parseISO(curr.created_at), "dd/MM");
       const existing = acc.find(a => a.dia === day);
       if (existing) existing.valor += Number(curr.valor);
       else acc.push({ dia: day, valor: Number(curr.valor) });
       return acc;
     }, []).sort((a, b) => a.dia.localeCompare(b.dia));
 
     const porFormaPagamento = entradas.reduce((acc: any[], curr) => {
       const existing = acc.find(a => a.name === curr.forma_pagamento);
       if (existing) existing.value += Number(curr.valor);
       else acc.push({ name: curr.forma_pagamento, value: Number(curr.valor) });
       return acc;
     }, []);
 
     const statusOSData = [
       { name: "Aberto", value: os.filter(o => o.status === "aberto").length },
       { name: "Em Manutenção", value: os.filter(o => o.status === "em_manutencao").length },
       { name: "Finalizada", value: os.filter(o => o.status === "finalizado").length },
       { name: "Entregue", value: os.filter(o => o.status === "entregue").length },
     ].filter(s => s.value > 0);
 
     const servicosCount: Record<string, number> = {};
     os.forEach(o => {
       if (o.os_servicos) {
         o.os_servicos.forEach((s: any) => {
           servicosCount[s.descricao] = (servicosCount[s.descricao] || 0) + 1;
         });
       }
     });
     const servicosMaisRealizados = Object.entries(servicosCount)
       .map(([nome, quantidade]) => ({ nome, quantidade }))
       .sort((a, b) => b.quantidade - a.quantidade)
       .slice(0, 5);
 
     const clienteReceita: Record<string, { nome: string, total: number }> = {};
     os.forEach(o => {
       if (["finalizado", "entregue"].includes(o.status)) {
         const clienteId = o.cliente_id;
         const valor = (Number(o.valor_mao_obra) || 0) + (Number(o.valor_pecas) || 0);
         if (!clienteReceita[clienteId]) {
           clienteReceita[clienteId] = { nome: o.clientes?.nome || "Desconhecido", total: 0 };
         }
         clienteReceita[clienteId].total += valor;
       }
     });
     const topClientes = Object.values(clienteReceita)
       .sort((a, b) => b.total - a.total)
       .slice(0, 5);
 
      const topContratos = contratos
        .sort((a, b) => Number(b.valor_mensal) - Number(a.valor_mensal))
        .slice(0, 5)
        .map(c => ({ nome: c.empresa_nome, valor: Number(c.valor_mensal) }));
  
     return {
       summary: { 
         faturamento, totalSaidas, lucro, receitaOS, receitaORC, receitaPDV, receitaContratos, 
         ticketMedioOS, orcAprovados, orcRecusados, osFinalizadasPeriodo 
       },
       faturamentoPorDia,
       porFormaPagamento,
       statusOSData,
       servicosMaisRealizados,
       topClientes,
       topContratos,
       movimentos
     };
   }, [dateRange, ordensServico, orcamentos, movimentos, contratos]);
 
   const formatCurrency = (val: number) => 
     new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
 
   const handlePrint = () => window.print();
 
   return (
     <div className="space-y-6 pb-10">
       <style>
         {`
           @media print {
             .no-print { display: none !important; }
             body { background: white !important; }
             .glass-card { 
               background: white !important; 
               border: 1px solid #ddd !important; 
               box-shadow: none !important; 
               color: black !important;
             }
             .print-only { display: block !important; }
             .page-break { page-break-after: always; }
             * { -webkit-print-color-adjust: exact; }
           }
           .print-only { display: none; }
         `}
       </style>
 
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
         <PageHeader title="Relatórios" description="Análises e métricas do negócio" />
         <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={handlePrint}>
             <Printer className="w-4 h-4 mr-2" /> Imprimir
           </Button>
           <Button size="sm" onClick={handlePrint}>
             <FileDown className="w-4 h-4 mr-2" /> Exportar PDF
           </Button>
         </div>
       </div>
 
       <div className="print-only text-center mb-8">
         <h1 className="text-2xl font-bold">Visionyx - Relatório de Desempenho</h1>
         <p className="text-muted-foreground">
           Período: {dateRange?.from ? format(dateRange.from, "dd/MM/yyyy") : ""} até {dateRange?.to ? format(dateRange.to, "dd/MM/yyyy") : ""}
         </p>
       </div>
 
       <div className="flex flex-wrap items-center gap-2 no-print p-1 bg-muted/50 rounded-lg w-fit">
         {[
           { label: "7 dias", id: "7d" },
           { label: "15 dias", id: "15d" },
           { label: "30 dias", id: "30d" },
           { label: "Este mês", id: "thisMonth" },
           { label: "Mês anterior", id: "lastMonth" },
         ].map((f) => (
           <Button
             key={f.id}
             variant={activeFilter === f.id ? "default" : "ghost"}
             size="sm"
             onClick={() => handleFilterChange(f.id)}
             className="h-8"
           >
             {f.label}
           </Button>
         ))}
 
         <Popover>
           <PopoverTrigger asChild>
             <Button
               variant={activeFilter === "custom" ? "default" : "ghost"}
               size="sm"
               className={cn("h-8 justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
               onClick={() => setActiveFilter("custom")}
             >
               <CalendarIcon className="mr-2 h-4 w-4" />
               {dateRange?.from ? (
                 dateRange.to ? (
                   <>
                     {format(dateRange.from, "dd/MM", { locale: ptBR })} - {format(dateRange.to, "dd/MM", { locale: ptBR })}
                   </>
                 ) : (
                   format(dateRange.from, "dd/MM", { locale: ptBR })
                 )
               ) : (
                 <span>Personalizado</span>
               )}
             </Button>
           </PopoverTrigger>
           <PopoverContent className="w-auto p-0" align="end">
             <Calendar
               initialFocus
               mode="range"
               defaultMonth={dateRange?.from}
               selected={dateRange}
               onSelect={setDateRange}
               numberOfMonths={2}
               locale={ptBR}
             />
           </PopoverContent>
         </Popover>
       </div>
 
        {filteredData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Faturamento Total" value={formatCurrency(filteredData.summary.faturamento)} icon={FileDown} gradientClass="grad-blue" />
            <StatCard title="Receita OS" value={formatCurrency(filteredData.summary.receitaOS)} icon={ClipboardList} gradientClass="grad-orange" />
            <StatCard title="Receita PDV" value={formatCurrency(filteredData.summary.receitaPDV)} icon={TrendingUp} gradientClass="grad-green" />
            <StatCard title="Receita Contratos" value={formatCurrency(filteredData.summary.receitaContratos)} icon={Building} gradientClass="grad-purple" />
            <StatCard title="Saídas Total" value={formatCurrency(filteredData.summary.totalSaidas)} icon={TrendingUp} />
            <StatCard title="Lucro Líquido" value={formatCurrency(filteredData.summary.lucro)} icon={DollarSign} gradientClass={filteredData.summary.lucro >= 0 ? "grad-green" : "grad-orange"} />
            <StatCard title="Ticket Médio OS" value={formatCurrency(filteredData.summary.ticketMedioOS)} icon={CalendarIcon} />
            <StatCard title="OS Finalizadas" value={filteredData.summary.osFinalizadasPeriodo} icon={CheckCircle2} />
          </div>
        )}
 
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="glass-card">
           <CardHeader><CardTitle className="text-base">Serviços Mais Realizados</CardTitle></CardHeader>
           <CardContent>
             {filteredData.servicosMaisRealizados.length > 0 ? (
               <ResponsiveContainer width="100%" height={260}>
                 <BarChart data={filteredData.servicosMaisRealizados} layout="vertical">
                   <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                   <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                   <YAxis dataKey="nome" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
                   <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                   <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-[260px] flex items-center justify-center text-muted-foreground">Nenhum dado encontrado para o período selecionado</div>
             )}
           </CardContent>
         </Card>
 
         <Card className="glass-card">
           <CardHeader><CardTitle className="text-base">Distribuição por Pagamento</CardTitle></CardHeader>
           <CardContent>
             {filteredData && filteredData.porFormaPagamento.length > 0 ? (
               <ResponsiveContainer width="100%" height={260}>
                 <PieChart>
                   <Pie data={filteredData.porFormaPagamento} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                     {filteredData.porFormaPagamento.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                   </Pie>
                   <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => formatCurrency(v)} />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-[260px] flex items-center justify-center text-muted-foreground">Nenhum dado encontrado para o período selecionado</div>
             )}
           </CardContent>
         </Card>
 
         <Card className="glass-card lg:col-span-2">
           <CardHeader><CardTitle className="text-base">Faturamento por Período</CardTitle></CardHeader>
           <CardContent>
             {filteredData.faturamentoPorDia.length > 0 ? (
               <ResponsiveContainer width="100%" height={280}>
                 <BarChart data={filteredData.faturamentoPorDia}>
                   <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                   <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                   <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                   <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => formatCurrency(v)} />
                   <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Faturamento" />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-[280px] flex items-center justify-center text-muted-foreground">Nenhum dado encontrado para o período selecionado</div>
             )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Top Contratos por Valor</CardTitle></CardHeader>
            <CardContent>
              {filteredData.topContratos.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={filteredData.topContratos} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$ ${v}`} />
                    <YAxis dataKey="nome" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="valor" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} name="Valor Mensal" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">Nenhum contrato cadastrado</div>
              )}
            </CardContent>
          </Card>
  
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Ranking de Clientes (Top 5)</CardTitle></CardHeader>
            <CardContent>
              {filteredData.topClientes.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={filteredData.topClientes} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$ ${v}`} />
                    <YAxis dataKey="nome" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="total" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} name="Total Gerado" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">Nenhum dado encontrado para o período selecionado</div>
              )}
            </CardContent>
          </Card>
        {filteredData && (
           <Card className="glass-card lg:col-span-2 no-print">
             <CardHeader>
               <CardTitle className="text-base">Detalhamento de Movimentações</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="overflow-x-auto">
                 <table className="enterprise-table">
                   <thead>
                     <tr>
                       <th>Data</th>
                       <th>Descrição</th>
                       <th>Origem</th>
                       <th>Pagamento</th>
                       <th className="text-right">Valor</th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredData.movimentos.map((m: any) => (
                       <tr key={m.id}>
                         <td className="text-xs">{format(parseISO(m.created_at), "dd/MM/yyyy HH:mm")}</td>
                         <td className="text-[13px] font-medium">{m.descricao}</td>
                         <td>
                           <span className={cn(
                             "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                             m.origem === 'os' ? "bg-blue-100 text-blue-700" :
                             m.origem === 'pdv' ? "bg-green-100 text-green-700" :
                             m.origem === 'contrato' ? "bg-purple-100 text-purple-700" :
                             "bg-orange-100 text-orange-700"
                           )}>
                             {m.origem || 'PDV'}
                           </span>
                         </td>
                         <td className="text-xs opacity-70 uppercase font-bold">{m.forma_pagamento}</td>
                         <td className={cn(
                           "text-right font-bold text-sm",
                           m.tipo === 'entrada' ? "text-green-600" : "text-destructive"
                         )}>
                           {m.tipo === 'entrada' ? '+' : '-'} {formatCurrency(Number(m.valor))}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                   <tfoot>
                     <tr className="bg-muted/30">
                       <td colSpan={4} className="text-right font-bold py-3 uppercase tracking-wider text-[10px]">Total Período:</td>
                       <td className={cn(
                         "text-right font-black text-base py-3",
                         filteredData.summary.lucro >= 0 ? "text-green-600" : "text-destructive"
                       )}>
                         {formatCurrency(filteredData.summary.lucro)}
                       </td>
                     </tr>
                   </tfoot>
                 </table>
               </div>
             </CardContent>
           </Card>
         )}
       </div>
 
       <div className="print-only mt-20 text-center text-xs text-muted-foreground border-t pt-4">
         Relatório gerado em {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })} - Visionyx
       </div>
     </div>
   );
 }
