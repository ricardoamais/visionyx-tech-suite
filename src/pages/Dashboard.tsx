 import { ClipboardList, Clock, CheckCircle, FileText, DollarSign, TrendingUp, TrendingDown, Building } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
 import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useEmpresa } from "@/contexts/EmpresaContext";

const statusMap: Record<string, string> = {
  aberto: "Aberto",
  em_analise: "Em análise",
  aguardando_aprovacao: "Aguardando aprovação",
  em_manutencao: "Em manutenção",
  finalizado: "Finalizado",
  entregue: "Entregue",
};

export default function Dashboard() {
  const { companyId } = useEmpresa();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", companyId],
    enabled: !!companyId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const now = new Date();
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const [osRes, orcRes, movimentosRes, contasRes, contratoPagRes] = await Promise.all([
        supabase
          .from("ordens_servico")
          .select("id, status, numero, created_at, clientes(nome)")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),
        supabase
          .from("orcamentos")
          .select("id, status")
          .eq("company_id", companyId),
        supabase
          .from("caixa_movimentos")
          .select("valor, created_at, tipo, origem")
          .eq("company_id", companyId)
          .gte("created_at", sixMonthsAgo.toISOString()),
        supabase
          .from("contas")
          .select("valor, tipo, status")
          .eq("company_id", companyId)
          .eq("status", "pendente"),
        supabase
          .from("contrato_pagamentos")
          .select("valor, data_pagamento")
          .eq("company_id", companyId)
          .eq("status", "pago")
          .gte("data_pagamento", inicioMes.split('T')[0])
          .lte("data_pagamento", fimMes.split('T')[0]),
      ]);

      const os = osRes.data || [];
      const orc = orcRes.data || [];
      const movimentos = movimentosRes.data || [];
      const contas = contasRes.data || [];
      const contratoPagamentos = contratoPagRes.data || [];

      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const chartDataMap: Record<string, { mes: string; receitaOS: number; receitaContratos: number; despesa: number; sortKey: number }> = {};
      
      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const monthLabel = months[d.getMonth()];
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        chartDataMap[key] = { mes: monthLabel, receitaOS: 0, receitaContratos: 0, despesa: 0, sortKey: d.getTime() };
      }

      movimentos.forEach(m => {
        const d = new Date(m.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (chartDataMap[key]) {
          if (m.tipo === "entrada") {
            if (m.origem === "contrato") {
              chartDataMap[key].receitaContratos += Number(m.valor);
            } else {
              chartDataMap[key].receitaOS += Number(m.valor);
            }
          } else if (m.tipo === "saida") {
            chartDataMap[key].despesa += Number(m.valor);
          }
        }
      });

      const chartData = Object.values(chartDataMap)
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(({ mes, receitaOS, receitaContratos, despesa }) => ({ mes, receitaOS, receitaContratos, despesa }));

      const faturamentoMes = movimentos
        .filter(m => m.created_at >= inicioMes && m.tipo === "entrada")
        .reduce((s, m) => s + Number(m.valor), 0);

      const receitaContratosMes = contratoPagamentos
        .reduce((s, p) => s + Number(p.valor), 0);

      return {
        osAbertas: os.filter(o => o.status === "aberto").length,
        osAndamento: os.filter(o => ["em_analise", "em_manutencao", "aguardando_aprovacao"].includes(o.status)).length,
        osFinalizadas: os.filter(o => o.status === "finalizado" || o.status === "entregue").length,
        orcPendentes: orc.filter(o => o.status === "pendente").length,
        faturamentoMes,
        receitaContratosMes,
        aReceber: contas.filter(c => c.tipo === "receber").reduce((s, c) => s + Number(c.valor), 0),
        aPagar: contas.filter(c => c.tipo === "pagar").reduce((s, c) => s + Number(c.valor), 0),
        recentOS: os.slice(0, 10),
        chartData,
      };
    },
  });

  if (isLoading || !stats) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

   return (
     <div className="space-y-10 pb-10">
       <div>
         <h1 className="text-3xl font-black tracking-tight">Dashboard Overview</h1>
         <p className="text-muted-foreground text-sm mt-1 font-medium">Bem-vindo ao centro de comando da sua empresa.</p>
       </div>
 
       <div className="space-y-4">
         <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-50 px-1">Operacional</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard title="OS Abertas" value={stats.osAbertas} icon={ClipboardList} gradientClass="grad-blue" trend="8%" />
           <StatCard title="Em Andamento" value={stats.osAndamento} icon={Clock} gradientClass="grad-orange" trend="12%" />
           <StatCard title="Finalizadas" value={stats.osFinalizadas} icon={CheckCircle} gradientClass="grad-green" trend="24%" />
           <StatCard title="Orçamentos Pendentes" value={stats.orcPendentes} icon={FileText} gradientClass="grad-purple" trend="5%" trendUp={false} />
         </div>
       </div>

       <div className="space-y-4">
         <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-50 px-1">Financeiro</h2>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard title="Faturamento" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.faturamentoMes)} icon={DollarSign} gradientClass="grad-blue" trend="15%" />
           <StatCard title="Receita Contratos" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.receitaContratosMes)} icon={Building} gradientClass="grad-green" trend="2%" />
           <StatCard title="A Receber" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.aReceber)} icon={TrendingUp} gradientClass="grad-orange" />
           <StatCard title="A Pagar" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.aPagar)} icon={TrendingDown} gradientClass="grad-purple" />
         </div>
       </div>
 
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-2 shadow-xl shadow-primary/5 border-border/40 overflow-hidden">
           <CardHeader className="border-b border-border/40 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Evolução Financeira</CardTitle>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /> Serviços</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Contratos</div>
                </div>
              </div>
           </CardHeader>
           <CardContent className="pt-8">
             <ResponsiveContainer width="100%" height={320}>
               <AreaChart data={stats.chartData}>
                 <defs>
                   <linearGradient id="colorOS" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                   </linearGradient>
                   <linearGradient id="colorContratos" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                 <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                 <Tooltip 
                   contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                   itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                 />
                 <Area type="monotone" dataKey="receitaOS" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorOS)" name="OS / Serviços" />
                 <Area type="monotone" dataKey="receitaContratos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorContratos)" name="Contratos" />
               </AreaChart>
             </ResponsiveContainer>
           </CardContent>
         </Card>
 
         <Card className="shadow-xl shadow-primary/5 border-border/40 overflow-hidden">
           <CardHeader className="border-b border-border/40 bg-muted/20">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Últimas Atividades</CardTitle>
           </CardHeader>
           <CardContent className="p-0">
             <div className="overflow-auto max-h-[400px]">
               <table className="enterprise-table">
                 <thead>
                   <tr>
                     <th>Ref</th>
                     <th>Cliente</th>
                     <th>Status</th>
                   </tr>
                 </thead>
                 <tbody>
                   {stats.recentOS.length === 0 ? (
                     <tr><td colSpan={3} className="text-center text-muted-foreground py-10 font-medium">Nenhuma atividade recente</td></tr>
                   ) : stats.recentOS.map((order: any) => (
                     <tr key={order.id} className="cursor-pointer">
                       <td className="font-bold text-primary text-xs">{order.numero}</td>
                       <td className="text-[13px] font-medium truncate max-w-[120px]">{(order.clientes as any)?.nome || "—"}</td>
                       <td><StatusBadge status={statusMap[order.status] || order.status} /></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
   );
}
