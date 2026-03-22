import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  observacoes: string;
}

const initialClientes: Cliente[] = [
  { id: "1", nome: "João Silva", cpfCnpj: "123.456.789-00", telefone: "(11) 3456-7890", whatsapp: "(11) 99876-5432", email: "joao@email.com", endereco: "Rua A, 123 - São Paulo", observacoes: "" },
  { id: "2", nome: "Maria Santos", cpfCnpj: "987.654.321-00", telefone: "(11) 3456-7891", whatsapp: "(11) 99876-5433", email: "maria@email.com", endereco: "Rua B, 456 - São Paulo", observacoes: "Cliente VIP" },
  { id: "3", nome: "Tech Solutions LTDA", cpfCnpj: "12.345.678/0001-90", telefone: "(11) 3456-7892", whatsapp: "(11) 99876-5434", email: "contato@techsolutions.com", endereco: "Av. C, 789 - São Paulo", observacoes: "Contrato mensal" },
];

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [form, setForm] = useState<Omit<Cliente, "id">>({ nome: "", cpfCnpj: "", telefone: "", whatsapp: "", email: "", endereco: "", observacoes: "" });

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cpfCnpj.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    if (editingCliente) {
      setClientes(prev => prev.map(c => c.id === editingCliente.id ? { ...form, id: c.id } : c));
      toast.success("Cliente atualizado!");
    } else {
      setClientes(prev => [...prev, { ...form, id: Date.now().toString() }]);
      toast.success("Cliente cadastrado!");
    }
    setDialogOpen(false);
    setForm({ nome: "", cpfCnpj: "", telefone: "", whatsapp: "", email: "", endereco: "", observacoes: "" });
    setEditingCliente(null);
  };

  const handleEdit = (c: Cliente) => {
    setEditingCliente(c);
    setForm({ nome: c.nome, cpfCnpj: c.cpfCnpj, telefone: c.telefone, whatsapp: c.whatsapp, email: c.email, endereco: c.endereco, observacoes: c.observacoes });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setClientes(prev => prev.filter(c => c.id !== id));
    toast.success("Cliente removido!");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Gerencie seus clientes">
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingCliente(null); setForm({ nome: "", cpfCnpj: "", telefone: "", whatsapp: "", email: "", endereco: "", observacoes: "" }); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2"><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>CPF/CNPJ</Label><Input value={form.cpfCnpj} onChange={e => setForm(f => ({ ...f, cpfCnpj: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Endereço</Label><Input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
              <Button onClick={handleSave}>{editingCliente ? "Salvar" : "Cadastrar"}</Button>
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
                {filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="hidden md:table-cell">{c.cpfCnpj}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3 text-muted-foreground" />{c.telefone}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-muted-foreground" />{c.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
