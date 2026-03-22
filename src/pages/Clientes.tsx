import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Phone, Mail, Loader2 } from "lucide-react";
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente } from "@/hooks/useClientes";

export default function Clientes() {
  const { data: clientes = [], isLoading } = useClientes();
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();
  const deleteMutation = useDeleteCliente();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", cpf_cnpj: "", telefone: "", whatsapp: "", email: "", endereco: "", observacoes: "" });

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.cpf_cnpj || "").includes(search) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

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

  const handleEdit = (c: typeof clientes[0]) => {
    setEditingId(c.id);
    setForm({ nome: c.nome, cpf_cnpj: c.cpf_cnpj || "", telefone: c.telefone || "", whatsapp: c.whatsapp || "", email: c.email || "", endereco: c.endereco || "", observacoes: c.observacoes || "" });
    setDialogOpen(true);
  };

  const resetForm = () => { setForm({ nome: "", cpf_cnpj: "", telefone: "", whatsapp: "", email: "", endereco: "", observacoes: "" }); setEditingId(null); };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Gerencie seus clientes">
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Cliente</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2"><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>CPF/CNPJ</Label><Input value={form.cpf_cnpj} onChange={e => setForm(f => ({ ...f, cpf_cnpj: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Endereço</Label><Input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingId ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, CPF/CNPJ ou email..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">CPF/CNPJ</TableHead>
                    <TableHead className="hidden sm:table-cell">Contato</TableHead>
                    <TableHead className="hidden lg:table-cell">Email</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</TableCell></TableRow>
                  ) : filtered.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell className="hidden md:table-cell">{c.cpf_cnpj}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {c.telefone && <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-muted-foreground" />{c.telefone}</div>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {c.email && <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-muted-foreground" />{c.email}</div>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
