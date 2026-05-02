import { ClipboardList, Clock, CheckCircle, FileText, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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
  const { empresaId } = useEmpresa();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", empresaId],
    enabled: !!empresaId,
    staleTime: 30000,
    queryFn: async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const [osRes, orcRes, contasRes] = await Promise.all([
        supabase
          .from("ordens_servico")
          .select("id, status, numero, created_at, clientes(nome)")
          .eq("empresa_id", empresaId)
          .order("created_at", { ascending: false }),
        supabase
          .from("orcamentos")
          .select("id, status")
          .eq("empresa_id", empresaId),
        supabase
          .from("contas")
          .select("id, tipo, valor, status, vencimento, created_at")
          .eq("empresa_id", empresaId)
          .gte("created_at", sixMonthsAgo.toISOString()),
      ]);
      const os = osRes.data || [];
      const orc = orcRes.data || [];
      const contas = contasRes.data || [];

      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const chartDataMap: Record<string, { mes: string; receita: number; despesa: number; sortKey: number }> = {};
      
      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const monthLabel = months[d.getMonth()];
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        chartDataMap[key] = { mes: monthLabel, receita: 0, despesa: 0, sortKey: d.getTime() };
      }

      contas.forEach(c => {
        const d = new Date(c.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (chartDataMap[key]) {
          if (c.tipo === "receber" && c.status === "recebido") {
            chartDataMap[key].receita += Number(c.valor);
          } else if (c.tipo === "pagar" && c.status === "pago") {
            chartDataMap[key].despesa += Number(c.valor);
          }
        }
      });

      const chartData = Object.values(chartDataMap)
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(({ mes, receita, despesa }) => ({ mes, receita, despesa }));

      const faturamentoMes = contas
        .filter(c => c.created_at >= firstDayOfMonth && c.tipo === "receber" && c.status === "recebido")
        .reduce((s, c) => s + Number(c.valor), 0);

      return {
        osAbertas: os.filter(o => o.status === "aberto").length,
        osAndamento: os.filter(o => ["em_analise", "em_manutencao", "aguardando_aprovacao"].includes(o.status)).length,
        osFinalizadas: os.filter(o => o.status === "finalizado" || o.status === "entregue").length,
        orcPendentes: orc.filter(o => o.status === "pendente").length,
        faturamentoMes,
        aReceber: contas.filter(c => c.tipo === "receber" && (c.status === "pendente" || c.status === "vencido")).reduce((s, c) => s + Number(c.valor), 0),
        aPagar: contas.filter(c => c.tipo === "pagar" && (c.status === "pendente" || c.status === "vencido")).reduce((s, c) => s + Number(c.valor), 0),
        recentOS: os.slice(0, 10),
        chartData,
      };
    },
  });

  if (isLoading || !stats) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="OS Abertas" value={stats.osAbertas} icon={ClipboardList} />
        <StatCard title="Em Andamento" value={stats.osAndamento} icon={Clock} />
        <StatCard title="Finalizadas" value={stats.osFinalizadas} icon={CheckCircle} />
        <StatCard title="Orçamentos Pendentes" value={stats.orcPendentes} icon={FileText} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Faturamento do Mês" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.faturamentoMes)} icon={DollarSign} />
        <StatCard title="Contas a Receber" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.aReceber)} icon={TrendingUp} />
        <StatCard title="Contas a Pagar" value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.aPagar)} icon={TrendingDown} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Financeiro Mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Receita" />
                <Bar dataKey="despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesa" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader><CardTitle className="text-base">Últimas Ordens de Serviço</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OS</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentOS.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Nenhuma OS registrada</TableCell></TableRow>
                ) : stats.recentOS.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-primary">{order.numero}</TableCell>
                    <TableCell>{(order.clientes as any)?.nome || "—"}</TableCell>
                    <TableCell><StatusBadge status={statusMap[order.status] || order.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
