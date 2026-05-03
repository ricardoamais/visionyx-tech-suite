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
       <Card className="border-border/40 shadow-xl shadow-primary/5 overflow-hidden">
         <div className="bg-muted/30 p-4 border-b border-border/40 flex justify-end">
            <Button size="sm" onClick={() => openNew(tipo)}><Plus className="w-4 h-4 mr-2" />Nova Conta</Button>
         </div>
         <div className="overflow-x-auto">
           {list.length === 0 ? (
             <p className="text-center text-muted-foreground py-20 font-medium">Nenhuma conta cadastrada</p>
           ) : (
             <table className="enterprise-table">
               <thead>
                 <tr>
                   <th>Descrição</th>
                   <th>Valor</th>
                   <th className="hidden sm:table-cell">Vencimento</th>
                   <th className="hidden md:table-cell">Categoria</th>
                   <th>Status</th>
                   <th className="text-right">Ações</th>
                 </tr>
               </thead>
               <tbody>
                 {list.map(c => (
                   <tr key={c.id}>
                     <td><span className="font-bold text-[13px] text-foreground/80">{c.descricao}</span></td>
                     <td>
                       <span className={`font-black monospace tracking-tight ${tipo === "pagar" ? "text-rose-500" : "text-emerald-500"}`}>
                         R$ {Number(c.valor).toFixed(2)}
                       </span>
                     </td>
                     <td className="hidden sm:table-cell">
                       <span className="text-[12px] font-bold text-muted-foreground">{c.vencimento ? format(new Date(c.vencimento), "dd/MM/yyyy") : "-"}</span>
                     </td>
                     <td className="hidden md:table-cell text-xs opacity-70 font-medium">{c.categoria || "-"}</td>
                     <td>
                       <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                         c.status === "pago" || c.status === "recebido"
                           ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                           : c.status === "vencido"
                           ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                           : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                       }`}>
                         {statusLabels[c.status] || c.status}
                       </span>
                     </td>
                     <td>
                       <div className="flex justify-end gap-1">
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50 transition-colors" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-500/10 hover:text-rose-500 transition-colors" onClick={() => deleteConta.mutate(c.id)}><Trash2 className="w-4 h-4" /></Button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
         </div>
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
