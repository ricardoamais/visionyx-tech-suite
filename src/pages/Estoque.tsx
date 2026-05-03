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

       <Card className="border-border/40 shadow-xl shadow-primary/5 overflow-hidden">
         <div className="bg-muted/30 p-4 border-b border-border/40 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground/50" />
            <Input placeholder="Buscar peça..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm bg-background border-border/50 h-9" />
         </div>
         <div className="overflow-x-auto">
           {isLoading ? (
             <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" /></div>
           ) : (
             <table className="enterprise-table">
               <thead>
                 <tr>
                   <th>Peça</th>
                   <th>Qtd</th>
                   <th className="hidden sm:table-cell">V. Compra</th>
                   <th>V. Venda</th>
                   <th className="hidden md:table-cell">Margem</th>
                   <th className="text-right">Ações</th>
                 </tr>
               </thead>
               <tbody>
                 {filtered.length === 0 ? (
                   <tr><td colSpan={6} className="text-center py-20 text-muted-foreground font-medium">Nenhuma peça encontrada</td></tr>
                 ) : filtered.map(p => (
                   <tr key={p.id} className={p.quantidade <= p.estoque_minimo ? "bg-amber-500/5" : ""}>
                     <td>
                       <div className="flex items-center gap-2 font-bold text-[13px] text-foreground/80">
                         {p.quantidade <= p.estoque_minimo && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                         {p.nome}
                       </div>
                     </td>
                     <td>
                       <span className={p.quantidade <= p.estoque_minimo ? "text-amber-500 font-black monospace" : "font-bold monospace"}>
                        {p.quantidade}
                       </span>
                     </td>
                     <td className="hidden sm:table-cell text-[12px] font-bold text-muted-foreground">R$ {Number(p.valor_compra).toFixed(2)}</td>
                     <td><span className="font-black text-primary monospace tracking-tight">R$ {Number(p.valor_venda).toFixed(2)}</span></td>
                     <td className="hidden md:table-cell text-xs font-bold text-emerald-500">
                       {p.valor_compra > 0 ? ((Number(p.valor_venda) - Number(p.valor_compra)) / Number(p.valor_compra) * 100).toFixed(0) : 0}%
                     </td>
                     <td>
                       <div className="flex justify-end gap-1">
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50 transition-colors" onClick={() => { setEditingId(p.id); setForm({ nome: p.nome, quantidade: p.quantidade, valor_compra: Number(p.valor_compra), valor_venda: Number(p.valor_venda), estoque_minimo: p.estoque_minimo }); setDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-500/10 hover:text-rose-500 transition-colors" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="w-4 h-4" /></Button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
         </div>
         <div className="bg-muted/10 p-4 border-t border-border/40">
           <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">
             Estoque monitorado em tempo real
           </p>
         </div>
       </Card>
    </div>
  );
}
