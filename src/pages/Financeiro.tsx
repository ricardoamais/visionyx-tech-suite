import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, TrendingDown, Plus, Pencil, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useContas, useCreateConta, useUpdateConta, useDeleteConta } from "@/hooks/useContas";
import { format } from "date-fns";

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  recebido: "Recebido",
  vencido: "Vencido",
};

export default function Financeiro() {
  const { data: contas = [], isLoading } = useContas();
  const createConta = useCreateConta();
  const updateConta = useUpdateConta();
  const deleteConta = useDeleteConta();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [tipoAtual, setTipoAtual] = useState<"pagar" | "receber">("pagar");

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [categoria, setCategoria] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [status, setStatus] = useState("pendente");

  const contasPagar = contas.filter(c => c.tipo === "pagar");
  const contasReceber = contas.filter(c => c.tipo === "receber");

  const totalPagar = contasPagar.filter(c => c.status === "pendente" || c.status === "vencido").reduce((s, c) => s + Number(c.valor), 0);
  const totalReceber = contasReceber.filter(c => c.status === "pendente" || c.status === "vencido").reduce((s, c) => s + Number(c.valor), 0);
  const totalRecebido = contasReceber.filter(c => c.status === "recebido").reduce((s, c) => s + Number(c.valor), 0);

  const cashFlowData = useMemo(() => {
    const months: Record<string, { entrada: number; saida: number }> = {};
    contas.forEach(c => {
      const m = c.vencimento ? format(new Date(c.vencimento), "MMM/yy") : "N/A";
      if (!months[m]) months[m] = { entrada: 0, saida: 0 };
      if (c.tipo === "receber" && (c.status === "recebido")) months[m].entrada += Number(c.valor);
      if (c.tipo === "pagar" && (c.status === "pago")) months[m].saida += Number(c.valor);
    });
    return Object.entries(months).map(([mes, v]) => ({ mes, ...v }));
  }, [contas]);

  function resetForm() {
    setDescricao(""); setValor(""); setVencimento(""); setCategoria(""); setFormaPagamento(""); setStatus("pendente"); setEditing(null);
  }

  function openNew(tipo: "pagar" | "receber") {
    resetForm();
    setTipoAtual(tipo);
    setOpen(true);
  }

  function openEdit(conta: any) {
    setEditing(conta);
    setTipoAtual(conta.tipo);
    setDescricao(conta.descricao);
    setValor(String(conta.valor));
    setVencimento(conta.vencimento);
    setCategoria(conta.categoria || "");
    setFormaPagamento(conta.forma_pagamento || "");
    setStatus(conta.status);
    setOpen(true);
  }

  function handleSave() {
    if (!descricao || !valor || !vencimento) return;
    const payload = {
      descricao,
      valor: parseFloat(valor),
      vencimento,
      tipo: tipoAtual as "pagar" | "receber",
      categoria: categoria || null,
      forma_pagamento: formaPagamento || null,
      status: status as any,
    };
    if (editing) {
      updateConta.mutate({ id: editing.id, ...payload }, { onSuccess: () => { setOpen(false); resetForm(); } });
    } else {
      createConta.mutate(payload, { onSuccess: () => { setOpen(false); resetForm(); } });
    }
  }

  function renderTable(list: any[], tipo: "pagar" | "receber") {
    return (
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => openNew(tipo)}><Plus className="w-4 h-4 mr-2" />Nova Conta</Button>
          </div>
          {list.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma conta cadastrada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                  <TableHead className="hidden md:table-cell">Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.descricao}</TableCell>
                    <TableCell className={`font-medium ${tipo === "pagar" ? "text-destructive" : "text-success"}`}>
                      R$ {Number(c.valor).toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {c.vencimento ? format(new Date(c.vencimento), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{c.categoria || "-"}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        c.status === "pago" || c.status === "recebido"
                          ? "bg-success/15 text-success"
                          : c.status === "vencido"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-warning/15 text-warning"
                      }`}>
                        {statusLabels[c.status] || c.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteConta.mutate(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" description="Controle financeiro completo" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Recebido" value={`R$ ${totalRecebido.toFixed(2)}`} icon={DollarSign} />
        <StatCard title="Contas a Receber" value={`R$ ${totalReceber.toFixed(2)}`} icon={TrendingUp} />
        <StatCard title="Contas a Pagar" value={`R$ ${totalPagar.toFixed(2)}`} icon={TrendingDown} />
      </div>

      {cashFlowData.length > 0 && (
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
      )}

      <Tabs defaultValue="pagar">
        <TabsList>
          <TabsTrigger value="pagar">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
        </TabsList>
        <TabsContent value="pagar">{renderTable(contasPagar, "pagar")}</TabsContent>
        <TabsContent value="receber">{renderTable(contasReceber, "receber")}</TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Nova"} Conta a {tipoAtual === "pagar" ? "Pagar" : "Receber"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Descrição *</Label><Input value={descricao} onChange={e => setDescricao(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Valor *</Label><Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} /></div>
              <div><Label>Vencimento *</Label><Input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Categoria</Label><Input value={categoria} onChange={e => setCategoria(e.target.value)} /></div>
              <div><Label>Forma de Pagamento</Label><Input value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  {tipoAtual === "pagar" ? <SelectItem value="pago">Pago</SelectItem> : <SelectItem value="recebido">Recebido</SelectItem>}
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createConta.isPending || updateConta.isPending}>
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
