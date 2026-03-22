import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const cashFlowData = [
  { mes: "Jan", entrada: 4200, saida: 2100 },
  { mes: "Fev", entrada: 5800, saida: 2400 },
  { mes: "Mar", entrada: 3900, saida: 1900 },
  { mes: "Abr", entrada: 6100, saida: 2800 },
  { mes: "Mai", entrada: 7200, saida: 3100 },
  { mes: "Jun", entrada: 5500, saida: 2600 },
];

const contasPagar = [
  { id: "1", descricao: "Aluguel escritório", valor: 1200, vencimento: "05/04/2026", categoria: "Fixo", status: "Pendente" },
  { id: "2", descricao: "Fornecedor de peças", valor: 890, vencimento: "10/04/2026", categoria: "Fornecedores", status: "Pendente" },
  { id: "3", descricao: "Internet", valor: 199, vencimento: "15/04/2026", categoria: "Fixo", status: "Pago" },
];

const contasReceber = [
  { id: "1", descricao: "OS-001 - João Silva", valor: 600, vencimento: "25/03/2026", categoria: "Serviços", status: "Pendente" },
  { id: "2", descricao: "OS-003 - Carlos Oliveira", valor: 120, vencimento: "22/03/2026", categoria: "Serviços", status: "Recebido" },
  { id: "3", descricao: "Contrato mensal - Tech Solutions", valor: 2500, vencimento: "01/04/2026", categoria: "Contratos", status: "Pendente" },
];

export default function Financeiro() {
  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" description="Controle financeiro completo" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Faturamento do Mês" value="R$ 7.200" icon={DollarSign} trend="+18% vs mês anterior" trendUp />
        <StatCard title="Contas a Receber" value="R$ 3.220" icon={TrendingUp} />
        <StatCard title="Contas a Pagar" value="R$ 2.289" icon={TrendingDown} />
      </div>

      <Card className="glass-card">
        <CardHeader><CardTitle className="text-base">Fluxo de Caixa</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
              <Line type="monotone" dataKey="entrada" stroke="hsl(var(--success))" strokeWidth={2} name="Entradas" />
              <Line type="monotone" dataKey="saida" stroke="hsl(var(--destructive))" strokeWidth={2} name="Saídas" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="pagar">
        <TabsList>
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
        </TabsList>
        <TabsContent value="pagar">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex justify-end mb-4"><Button size="sm"><Plus className="w-4 h-4 mr-2" />Nova Conta</Button></div>
              <Table>
                <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead className="hidden sm:table-cell">Vencimento</TableHead><TableHead className="hidden md:table-cell">Categoria</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {contasPagar.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.descricao}</TableCell>
                      <TableCell className="text-destructive font-medium">R$ {c.valor.toFixed(2)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{c.vencimento}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.categoria}</TableCell>
                      <TableCell><span className={`text-xs px-2 py-1 rounded-full ${c.status === "Pago" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{c.status}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="receber">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex justify-end mb-4"><Button size="sm"><Plus className="w-4 h-4 mr-2" />Nova Conta</Button></div>
              <Table>
                <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead className="hidden sm:table-cell">Vencimento</TableHead><TableHead className="hidden md:table-cell">Categoria</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {contasReceber.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.descricao}</TableCell>
                      <TableCell className="text-success font-medium">R$ {c.valor.toFixed(2)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{c.vencimento}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.categoria}</TableCell>
                      <TableCell><span className={`text-xs px-2 py-1 rounded-full ${c.status === "Recebido" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{c.status}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
