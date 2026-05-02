 import { useState, useMemo } from "react";
 import { PageHeader } from "@/components/PageHeader";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
 import { useOrdensServico } from "@/hooks/useOrdensServico";
 import { useOrcamentos } from "@/hooks/useOrcamentos";
 import { useContas } from "@/hooks/useContas";
 import { StatCard } from "@/components/StatCard";
 import { Button } from "@/components/ui/button";
 import { 
   startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, 
   isWithinInterval, format, parseISO, subMonths 
 } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { CalendarIcon, Printer, FileDown } from "lucide-react";
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
 
   const { data: ordensServico = [] } = useOrdensServico();
   const { data: orcamentos = [] } = useOrcamentos();
   const { data: contas = [] } = useContas();
 
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
     if (!dateRange?.from || !dateRange?.to) return {
       os: [], orcamentos: [], contas: [], summary: {
         osAbertas: 0, osFinalizadas: 0, faturamento: 0, ticketMedio: 0, orcAprovados: 0, orcRecusados: 0
       }
     };
 
     const interval = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) };
 
     const os = ordensServico.filter(o => isWithinInterval(parseISO(o.created_at), interval));
     const orcs = orcamentos.filter(o => isWithinInterval(parseISO(o.created_at), interval));
     const receipts = contas.filter(c => 
       c.tipo === "receber" && 
       c.status === "recebido" && 
       c.vencimento && 
       isWithinInterval(parseISO(c.vencimento), interval)
     );
 
     const osAbertas = os.filter(o => ["aberto", "em_analise", "aguardando_aprovacao", "em_manutencao"].includes(o.status)).length;
     const osFinalizadas = os.filter(o => ["finalizado", "entregue"].includes(o.status)).length;
     const faturamento = receipts.reduce((acc, curr) => acc + Number(curr.valor), 0);
     const ticketMedio = osFinalizadas > 0 ? faturamento / osFinalizadas : 0;
     const orcAprovados = orcs.filter(o => o.status === "aprovado").length;
     const orcRecusados = orcs.filter(o => o.status === "reprovado").length;
 
     // Charts data
     const faturamentoPorDia = receipts.reduce((acc: any[], curr) => {
       const day = format(parseISO(curr.vencimento!), "dd/MM");
       const existing = acc.find(a => a.dia === day);
       if (existing) existing.valor += Number(curr.valor);
       else acc.push({ dia: day, valor: Number(curr.valor) });
       return acc;
     }, []).sort((a, b) => a.dia.localeCompare(b.dia));
 
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
 
     return {
       summary: { osAbertas, osFinalizadas, faturamento, ticketMedio, orcAprovados, orcRecusados },
       faturamentoPorDia,
       statusOSData,
       servicosMaisRealizados,
       topClientes
     };
   }, [dateRange, ordensServico, orcamentos, contas]);
 
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
 
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         <StatCard title="OS Abertas" value={filteredData.summary.osAbertas} icon={BarChart} />
         <StatCard title="OS Finalizadas" value={filteredData.summary.osFinalizadas} icon={BarChart} />
         <StatCard title="Faturamento Total" value={formatCurrency(filteredData.summary.faturamento)} icon={FileDown} />
         <StatCard title="Ticket Médio" value={formatCurrency(filteredData.summary.ticketMedio)} icon={CalendarIcon} />
         <StatCard title="Orçamentos Aprovados" value={filteredData.summary.orcAprovados} icon={BarChart} />
         <StatCard title="Orçamentos Recusados" value={filteredData.summary.orcRecusados} icon={BarChart} />
       </div>
 
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
           <CardHeader><CardTitle className="text-base">Status das OS</CardTitle></CardHeader>
           <CardContent>
             {filteredData.statusOSData.length > 0 ? (
               <ResponsiveContainer width="100%" height={260}>
                 <PieChart>
                   <Pie data={filteredData.statusOSData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                     {filteredData.statusOSData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                   </Pie>
                   <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
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
 
         <Card className="glass-card lg:col-span-2">
           <CardHeader><CardTitle className="text-base">Ranking de Clientes (Top 5)</CardTitle></CardHeader>
           <CardContent>
             {filteredData.topClientes.length > 0 ? (
               <ResponsiveContainer width="100%" height={280}>
                 <BarChart data={filteredData.topClientes} layout="vertical">
                   <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                   <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$ ${v}`} />
                   <YAxis dataKey="nome" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
                   <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => formatCurrency(v)} />
                   <Bar dataKey="total" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} name="Total Gerado" />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-[280px] flex items-center justify-center text-muted-foreground">Nenhum dado encontrado para o período selecionado</div>
             )}
           </CardContent>
         </Card>
       </div>
 
       <div className="print-only mt-20 text-center text-xs text-muted-foreground border-t pt-4">
         Relatório gerado em {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })} - Visionyx
       </div>
     </div>
   );
 }
