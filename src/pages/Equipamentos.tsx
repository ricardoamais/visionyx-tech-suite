import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useEquipamentos, useCreateEquipamento, useUpdateEquipamento, useDeleteEquipamento } from "@/hooks/useEquipamentos";
import { useClientes } from "@/hooks/useClientes";

const tipos = ["Notebook", "PC Desktop", "Impressora", "Monitor", "Tablet", "Celular", "Servidor", "Outro"];

export default function Equipamentos() {
  const { data: equipamentos = [], isLoading } = useEquipamentos();
  const { data: clientes = [], refetch: refetchClientes } = useClientes();
  const createEquip = useCreateEquipamento();
  const updateEquip = useUpdateEquipamento();
  const deleteEquip = useDeleteEquipamento();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ tipo: "", marca: "", modelo: "", numero_serie: "", cliente_id: "", acessorios: "", defeito_relatado: "", senha_equipamento: "", observacoes: "" });

  const filtered = equipamentos.filter(e =>
    (e.marca?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (e.modelo?.toLowerCase() || "").includes(search.toLowerCase()) ||
    ((e as any).clientes?.nome?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const resetForm = () => {
    setForm({ tipo: "", marca: "", modelo: "", numero_serie: "", cliente_id: "", acessorios: "", defeito_relatado: "", senha_equipamento: "", observacoes: "" });
    setEditing(null);
  };

  const handleSave = () => {
    if (!form.tipo || !form.marca || !form.cliente_id) return;
    const payload = {
      tipo: form.tipo,
      marca: form.marca,
      modelo: form.modelo || null,
      numero_serie: form.numero_serie || null,
      cliente_id: form.cliente_id,
      acessorios: form.acessorios || null,
      defeito_relatado: form.defeito_relatado || null,
      senha_equipamento: form.senha_equipamento || null,
      observacoes: form.observacoes || null,
    };
    if (editing) {
      updateEquip.mutate({ id: editing.id, ...payload }, { onSuccess: () => { setDialogOpen(false); resetForm(); } });
    } else {
      createEquip.mutate(payload, { onSuccess: () => { setDialogOpen(false); resetForm(); } });
    }
  };

  const openEdit = (e: any) => {
    setEditing(e);
    setForm({
      tipo: e.tipo, marca: e.marca, modelo: e.modelo || "", numero_serie: e.numero_serie || "",
      cliente_id: e.cliente_id, acessorios: e.acessorios || "", defeito_relatado: e.defeito_relatado || "",
      senha_equipamento: e.senha_equipamento || "", observacoes: e.observacoes || "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Equipamentos" description="Cadastro de equipamentos dos clientes">
        <Button onClick={() => { resetForm(); refetchClientes(); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Novo Equipamento</Button>
      </PageHeader>

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por marca, modelo ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead className="hidden md:table-cell">Nº Série</TableHead>
                  <TableHead className="hidden sm:table-cell">Cliente</TableHead>
                  <TableHead className="hidden lg:table-cell">Defeito</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum equipamento cadastrado</TableCell></TableRow>
                ) : filtered.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{e.tipo}</TableCell>
                    <TableCell className="font-medium">{e.marca} {e.modelo}</TableCell>
                    <TableCell className="hidden md:table-cell">{e.numero_serie || "-"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{(e as any).clientes?.nome || "-"}</TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[200px] truncate">{e.defeito_relatado || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteEquip.mutate(e.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (o) refetchClientes(); else resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} Equipamento</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Marca *</Label><Input value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Modelo</Label><Input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Nº Série</Label><Input value={form.numero_serie} onChange={e => setForm(f => ({ ...f, numero_serie: e.target.value }))} /></div>
            </div>
            <div className="grid gap-2">
              <Label>Cliente *</Label>
              <Select value={form.cliente_id || undefined} onValueChange={v => setForm(f => ({ ...f, cliente_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.filter(c => c?.id).length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum cliente cadastrado</div>
                  ) : (
                    clientes.filter(c => c?.id).map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Acessórios</Label><Input value={form.acessorios} onChange={e => setForm(f => ({ ...f, acessorios: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Defeito Relatado</Label><Textarea value={form.defeito_relatado} onChange={e => setForm(f => ({ ...f, defeito_relatado: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Senha do Equipamento</Label><Input value={form.senha_equipamento} onChange={e => setForm(f => ({ ...f, senha_equipamento: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createEquip.isPending || updateEquip.isPending}>{editing ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
