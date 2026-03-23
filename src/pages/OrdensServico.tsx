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
import { Plus, Search, Eye, Edit, Trash2, Loader2, Printer } from "lucide-react";
import { useOrdensServico, useCreateOS, useUpdateOS, useDeleteOS } from "@/hooks/useOrdensServico";
import { useClientes } from "@/hooks/useClientes";
import { printOS } from "@/components/PrintOS";

const statusOptions = [
  { value: "aberto", label: "Aberto" },
  { value: "em_analise", label: "Em análise" },
  { value: "aguardando_aprovacao", label: "Aguardando aprovação" },
  { value: "em_manutencao", label: "Em manutenção" },
  { value: "finalizado", label: "Finalizado" },
  { value: "entregue", label: "Entregue" },
];

const statusLabel = (val: string) => statusOptions.find(s => s.value === val)?.label ?? val;

const emptyForm = {
  cliente_id: "", problema_relatado: "", diagnostico: "", servicos_realizados: "",
  valor_mao_obra: 0, valor_pecas: 0, status: "aberto" as string, observacoes: "",
};

export default function OrdensServico() {
  const { data: ordens, isLoading } = useOrdensServico();
  const { data: clientes } = useClientes();
  const createOS = useCreateOS();
  const updateOS = useUpdateOS();
  const deleteOS = useDeleteOS();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = (ordens ?? []).filter(o => {
    const matchSearch =
      o.numero?.toLowerCase().includes(search.toLowerCase()) ||
      (o as any).clientes?.nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const resetForm = () => { setForm(emptyForm); setEditing(null); };

  const handlePrint = (o: any) => {
    printOS({
      numero: o.numero, data: o.data_entrada, cliente: o.clientes?.nome ?? "—",
      problema: o.problema_relatado, diagnostico: o.diagnostico,
      servicos: o.servicos_realizados, valorMaoObra: Number(o.valor_mao_obra),
      valorPecas: Number(o.valor_pecas), status: statusLabel(o.status), observacoes: o.observacoes,
    });
  };

  const handleSave = () => {
    if (!form.cliente_id) return;
    if (editing) {
      updateOS.mutate({ id: editing.id, ...form, valor_mao_obra: Number(form.valor_mao_obra), valor_pecas: Number(form.valor_pecas) }, {
        onSuccess: () => { setDialogOpen(false); resetForm(); },
      });
    } else {
      createOS.mutate({ ...form, valor_mao_obra: Number(form.valor_mao_obra), valor_pecas: Number(form.valor_pecas) }, {
        onSuccess: (data) => {
          setDialogOpen(false); resetForm();
          // After creating, find it in the list and offer print
          if (data) {
            const clienteNome = clientes?.find(c => c.id === form.cliente_id)?.nome ?? "";
            printOS({
              numero: data.numero, data: data.data_entrada, cliente: clienteNome,
              problema: data.problema_relatado ?? undefined, diagnostico: data.diagnostico ?? undefined,
              servicos: data.servicos_realizados ?? undefined, valorMaoObra: Number(data.valor_mao_obra),
              valorPecas: Number(data.valor_pecas), status: statusLabel(data.status), observacoes: data.observacoes ?? undefined,
            });
          }
        },
      });
    }
  };

  const handleEdit = (o: any) => {
    setEditing(o);
    setForm({
      cliente_id: o.cliente_id, problema_relatado: o.problema_relatado ?? "",
      diagnostico: o.diagnostico ?? "", servicos_realizados: o.servicos_realizados ?? "",
      valor_mao_obra: o.valor_mao_obra ?? 0, valor_pecas: o.valor_pecas ?? 0,
      status: o.status ?? "aberto", observacoes: o.observacoes ?? "",
    });
    setDialogOpen(true);
  };

  const isSaving = createOS.isPending || updateOS.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Ordens de Serviço" description="Gerencie todas as ordens de serviço">
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova OS</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar OS" : "Nova Ordem de Serviço"}</DialogTitle></DialogHeader>
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
                  <SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Problema Relatado</Label><Textarea value={form.problema_relatado} onChange={e => setForm(f => ({ ...f, problema_relatado: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Diagnóstico</Label><Textarea value={form.diagnostico} onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Serviços Realizados</Label><Textarea value={form.servicos_realizados} onChange={e => setForm(f => ({ ...f, servicos_realizados: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Mão de Obra (R$)</Label><Input type="number" value={form.valor_mao_obra} onChange={e => setForm(f => ({ ...f, valor_mao_obra: Number(e.target.value) }))} /></div>
                <div className="grid gap-2"><Label>Peças (R$)</Label><Input type="number" value={form.valor_pecas} onChange={e => setForm(f => ({ ...f, valor_pecas: Number(e.target.value) }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? "Salvar" : "Criar e Imprimir OS"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por número ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº OS</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Problema</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Valor Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium text-primary">{o.numero}</TableCell>
                      <TableCell>{(o as any).clientes?.nome ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">{o.problema_relatado ?? "—"}</TableCell>
                      <TableCell><StatusBadge status={statusLabel(o.status)} /></TableCell>
                      <TableCell className="hidden sm:table-cell font-medium">R$ {(Number(o.valor_mao_obra) + Number(o.valor_pecas)).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Imprimir" onClick={() => handlePrint(o)}><Printer className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setViewing(o); setViewDialog(true); }}><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(o)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteOS.mutate(o.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma OS encontrada</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes da {viewing?.numero}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Data:</span> <span className="font-medium">{new Date(viewing.data_entrada).toLocaleDateString("pt-BR")}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={statusLabel(viewing.status)} /></div>
              </div>
              <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{viewing.clientes?.nome}</span></div>
              {viewing.problema_relatado && <div><span className="text-muted-foreground">Problema:</span> <p>{viewing.problema_relatado}</p></div>}
              {viewing.diagnostico && <div><span className="text-muted-foreground">Diagnóstico:</span> <p>{viewing.diagnostico}</p></div>}
              {viewing.servicos_realizados && <div><span className="text-muted-foreground">Serviços:</span> <p>{viewing.servicos_realizados}</p></div>}
              <div className="border-t pt-3 grid grid-cols-3 gap-3">
                <div><span className="text-muted-foreground text-xs">Mão de obra</span><p className="font-medium">R$ {Number(viewing.valor_mao_obra).toFixed(2)}</p></div>
                <div><span className="text-muted-foreground text-xs">Peças</span><p className="font-medium">R$ {Number(viewing.valor_pecas).toFixed(2)}</p></div>
                <div><span className="text-muted-foreground text-xs">Total</span><p className="font-bold text-primary">R$ {(Number(viewing.valor_mao_obra) + Number(viewing.valor_pecas)).toFixed(2)}</p></div>
              </div>
              {viewing.observacoes && <div><span className="text-muted-foreground">Observações:</span> <p>{viewing.observacoes}</p></div>}
              <Button variant="outline" className="mt-2" onClick={() => handlePrint(viewing)}>
                <Printer className="w-4 h-4 mr-2" />Imprimir OS
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
