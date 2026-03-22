import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { usePecas, useCreatePeca, useUpdatePeca, useDeletePeca } from "@/hooks/usePecas";

export default function Estoque() {
  const { data: items = [], isLoading } = usePecas();
  const createMutation = useCreatePeca();
  const updateMutation = useUpdatePeca();
  const deleteMutation = useDeletePeca();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", quantidade: 0, valor_compra: 0, valor_venda: 0, estoque_minimo: 3 });

  const filtered = items.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));
  const totalEstoque = items.reduce((acc, p) => acc + p.quantidade * p.valor_venda, 0);
  const baixoEstoque = items.filter(p => p.quantidade <= p.estoque_minimo).length;

  const handleSave = async () => {
    if (!form.nome) return;
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => { setForm({ nome: "", quantidade: 0, valor_compra: 0, valor_venda: 0, estoque_minimo: 3 }); setEditingId(null); };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Estoque de Peças" description={`${items.length} itens | Valor total: R$ ${totalEstoque.toFixed(2)}`}>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova Peça</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Nova"} Peça</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2"><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Quantidade</Label><Input type="number" value={form.quantidade} onChange={e => setForm(f => ({ ...f, quantidade: Number(e.target.value) }))} /></div>
                <div className="grid gap-2"><Label>Estoque Mínimo</Label><Input type="number" value={form.estoque_minimo} onChange={e => setForm(f => ({ ...f, estoque_minimo: Number(e.target.value) }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Valor Compra</Label><Input type="number" step="0.01" value={form.valor_compra} onChange={e => setForm(f => ({ ...f, valor_compra: Number(e.target.value) }))} /></div>
                <div className="grid gap-2"><Label>Valor Venda</Label><Input type="number" step="0.01" value={form.valor_venda} onChange={e => setForm(f => ({ ...f, valor_venda: Number(e.target.value) }))} /></div>
              </div>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {baixoEstoque > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <span className="text-sm"><strong>{baixoEstoque} {baixoEstoque === 1 ? "item" : "itens"}</strong> com estoque baixo!</span>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar peça..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peça</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead className="hidden sm:table-cell">V. Compra</TableHead>
                    <TableHead>V. Venda</TableHead>
                    <TableHead className="hidden md:table-cell">Margem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma peça encontrada</TableCell></TableRow>
                  ) : filtered.map(p => (
                    <TableRow key={p.id} className={p.quantidade <= p.estoque_minimo ? "bg-warning/5" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {p.quantidade <= p.estoque_minimo && <AlertTriangle className="w-3 h-3 text-warning" />}
                          {p.nome}
                        </div>
                      </TableCell>
                      <TableCell className={p.quantidade <= p.estoque_minimo ? "text-warning font-bold" : ""}>{p.quantidade}</TableCell>
                      <TableCell className="hidden sm:table-cell">R$ {Number(p.valor_compra).toFixed(2)}</TableCell>
                      <TableCell>R$ {Number(p.valor_venda).toFixed(2)}</TableCell>
                      <TableCell className="hidden md:table-cell text-success">
                        {p.valor_compra > 0 ? ((Number(p.valor_venda) - Number(p.valor_compra)) / Number(p.valor_compra) * 100).toFixed(0) : 0}%
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingId(p.id); setForm({ nome: p.nome, quantidade: p.quantidade, valor_compra: Number(p.valor_compra), valor_venda: Number(p.valor_venda), estoque_minimo: p.estoque_minimo }); setDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
