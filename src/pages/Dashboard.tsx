import {
  ClipboardList, Clock, CheckCircle, FileText, DollarSign,
  TrendingUp, TrendingDown, AlertCircle
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const chartData = [
  { mes: "Jan", receita: 4200, despesa: 2100 },
  { mes: "Fev", receita: 5800, despesa: 2400 },
  { mes: "Mar", receita: 3900, despesa: 1900 },
  { mes: "Abr", receita: 6100, despesa: 2800 },
  { mes: "Mai", receita: 7200, despesa: 3100 },
  { mes: "Jun", receita: 5500, despesa: 2600 },
];

const recentOrders = [
  { id: "OS-001", cliente: "João Silva", equipamento: "Notebook Dell", status: "Em manutenção", data: "22/03/2026" },
  { id: "OS-002", cliente: "Maria Santos", equipamento: "PC Gamer", status: "Aberto", data: "21/03/2026" },
  { id: "OS-003", cliente: "Carlos Oliveira", equipamento: "Impressora HP", status: "Finalizado", data: "20/03/2026" },
  { id: "OS-004", cliente: "Ana Costa", equipamento: "Monitor LG", status: "Aguardando aprovação", data: "19/03/2026" },
  { id: "OS-005", cliente: "Pedro Lima", equipamento: "Notebook Lenovo", status: "Entregue", data: "18/03/2026" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="OS Abertas" value={12} icon={ClipboardList} trend="3 novas hoje" trendUp />
        <StatCard title="Em Andamento" value={8} icon={Clock} />
        <StatCard title="Finalizadas (mês)" value={34} icon={CheckCircle} trend="+12% vs mês anterior" trendUp />
        <StatCard title="Orçamentos Pendentes" value={5} icon={FileText} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Faturamento do Mês" value="R$ 7.200" icon={DollarSign} trend="+18%" trendUp />
        <StatCard title="Contas a Receber" value="R$ 3.450" icon={TrendingUp} />
        <StatCard title="Contas a Pagar" value="R$ 1.890" icon={TrendingDown} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Financeiro Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Receita" />
                <Bar dataKey="despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Despesa" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Últimas Ordens de Serviço</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OS</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Equipamento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-primary">{order.id}</TableCell>
                    <TableCell>{order.cliente}</TableCell>
                    <TableCell className="hidden md:table-cell">{order.equipamento}</TableCell>
                    <TableCell><StatusBadge status={order.status} /></TableCell>
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
