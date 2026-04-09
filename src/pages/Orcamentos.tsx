import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Edit, Trash2, Loader2, Printer, ArrowRight, CheckCircle } from "lucide-react";
import { useOrcamentos, useCreateOrcamento, useUpdateOrcamento, useDeleteOrcamento } from "@/hooks/useOrcamentos";
import { useClientes } from "@/hooks/useClientes";
import { useCreateConta } from "@/hooks/useContas";
import { useEmpresaConfig } from "@/hooks/useEmpresaConfig";
import { printOrcamento } from "@/components/PrintOS";
import { toast } from "sonner";

const statusMap: Record<string, string> = { pendente: "Pendente", aprovado: "Aprovado", reprovado: "Reprovado" };

const emptyItem = { descricao: "", quantidade: 1, valor_unitario: 0 };

export default function Orcamentos() {
  const { data: orcamentos, isLoading } = useOrcamentos();
  const { data: clientes } = useClientes();
  const createOrc = useCreateOrcamento();
  const updateOrc = useUpdateOrcamento();
  const deleteOrc = useDeleteOrcamento();
  const createConta = useCreateConta();
  const { data: empresa } = useEmpresaConfig();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ cliente_id: "", observacoes: "", status: "pendente" });
  const [itens, setItens] = useState([{ ...emptyItem }]);

  const filtered = (orcamentos ?? []).filter(o =>
    o.numero?.toLowerCase().includes(search.toLowerCase()) ||
    (o as any).clientes?.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => { setForm({ cliente_id: "", observacoes: "", status: "pendente" }); setItens([{ ...emptyItem }]); setEditing(null); };

  const valorTotal = itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);

  const handlePrint = (o: any) => {
    const items = (o.orcamento_itens ?? []).map((i: any) => ({
      descricao: i.descricao, quantidade: i.quantidade, valor_unitario: i.valor_unitario,
    }));
    printOrcamento({
      numero: o.numero, data: o.created_at, cliente: o.clientes?.nome ?? "—",
      itens: items, valorTotal: Number(o.valor_total), status: statusMap[o.status] ?? o.status,
      observacoes: o.observacoes,
    });
  };

  const handleMarcarRecebido = (o: any) => {
    const valor = Number(o.valor_total);
    if (valor <= 0) { toast.error("Orçamento sem valor para registrar"); return; }
    const clienteNome = (o as any).clientes?.nome ?? "Cliente";
    createConta.mutate({
      descricao: `${o.numero} - ${clienteNome}`,
      valor,
      vencimento: new Date().toISOString().split("T")[0],
      tipo: "receber",
      categoria: "Orçamentos",
      status: "recebido",
    }, {
      onSuccess: () => {
        toast.success(`R$ ${valor.toFixed(2)} registrado no financeiro como recebido!`);
      },
    });
  };

  const handleSave = () => {
    if (!form.cliente_id || itens.every(i => !i.descricao)) return;
    const validItens = itens.filter(i => i.descricao.trim());
    if (editing) {
      updateOrc.mutate({ id: editing.id, cliente_id: form.cliente_id, observacoes: form.observacoes, status: form.status as "pendente" | "aprovado" | "reprovado", valor_total: valorTotal }, {
        onSuccess: () => { setDialogOpen(false); resetForm(); },
      });
    } else {
      createOrc.mutate({ ...form, itens: validItens }, {
        onSuccess: (data) => {
          setDialogOpen(false);
          const clienteNome = clientes?.find(c => c.id === form.cliente_id)?.nome ?? "";
          printOrcamento({
            numero: data.numero, data: data.created_at, cliente: clienteNome,
            itens: validItens, valorTotal, status: statusMap[data.status] ?? data.status,
            observacoes: data.observacoes ?? undefined,
          });
          resetForm();
        },
      });
    }
  };

  const handleEdit = (o: any) => {
    setEditing(o);
    setForm({ cliente_id: o.cliente_id, observacoes: o.observacoes ?? "", status: o.status });
    setItens((o.orcamento_itens ?? []).map((i: any) => ({ descricao: i.descricao, quantidade: i.quantidade, valor_unitario: i.valor_unitario })));
    setDialogOpen(true);
  };

  const isSaving = createOrc.isPending || updateOrc.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Orçamentos" description="Gerencie orçamentos para clientes">
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Orçamento</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Cliente *</Label>
                <Select value={form.cliente_id} onValueChange={v => setForm(f => ({ ...f, cliente_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>{(clientes ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="reprovado">Reprovado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Itens</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setItens(i => [...i, { ...emptyItem }])}>
                    <Plus className="w-3 h-3 mr-1" />Adicionar
                  </Button>
                </div>
                {itens.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_60px_80px_30px] gap-2 items-end">
                    <Input placeholder="Descrição" value={item.descricao} onChange={e => { const n = [...itens]; n[idx].descricao = e.target.value; setItens(n); }} />
                    <Input type="number" placeholder="Qtd" value={item.quantidade} onChange={e => { const n = [...itens]; n[idx].quantidade = Number(e.target.value); setItens(n); }} />
                    <Input type="number" placeholder="Valor" value={item.valor_unitario} onChange={e => { const n = [...itens]; n[idx].valor_unitario = Number(e.target.value); setItens(n); }} />
                    {itens.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setItens(i => i.filter((_, j) => j !== idx))}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-sm font-medium text-right">Total: R$ {valorTotal.toFixed(2)}</p>
              </div>
              <div className="grid gap-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? "Salvar" : "Criar e Imprimir"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por número ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Itens</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium text-primary">{o.numero}</TableCell>
                      <TableCell>{(o as any).clientes?.nome ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[250px] truncate">
                        {(o as any).orcamento_itens?.map((i: any) => i.descricao).join(", ") || "—"}
                      </TableCell>
                      <TableCell className="font-medium">R$ {Number(o.valor_total).toFixed(2)}</TableCell>
                      <TableCell><StatusBadge status={statusMap[o.status] ?? o.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {o.status === "aprovado" && (
                            <Button variant="ghost" size="icon" title="Marcar como Recebido" onClick={() => handleMarcarRecebido(o)}>
                              <CheckCircle className="w-4 h-4 text-success" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Imprimir" onClick={() => handlePrint(o)}><Printer className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(o)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteOrc.mutate(o.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum orçamento encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes do {viewing?.numero}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="grid gap-3 text-sm">
              <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{viewing.clientes?.nome}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={statusMap[viewing.status] ?? viewing.status} /></div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={() => handlePrint(viewing)}>
                  <Printer className="w-4 h-4 mr-2" />Imprimir Orçamento
                </Button>
                {viewing.status === "aprovado" && (
                  <Button onClick={() => { handleMarcarRecebido(viewing); setViewDialog(false); }}>
                    <CheckCircle className="w-4 h-4 mr-2" />Marcar Recebido
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
