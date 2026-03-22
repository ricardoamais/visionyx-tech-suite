import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Equipamento {
  id: string; tipo: string; marca: string; modelo: string; serie: string; cliente: string; acessorios: string; defeito: string; senha: string; observacoes: string;
}

const tipos = ["Notebook", "PC Desktop", "Impressora", "Monitor", "Tablet", "Celular", "Servidor", "Outro"];

const initial: Equipamento[] = [
  { id: "1", tipo: "Notebook", marca: "Dell", modelo: "Inspiron 15", serie: "DL123456", cliente: "João Silva", acessorios: "Carregador", defeito: "Não liga", senha: "1234", observacoes: "" },
  { id: "2", tipo: "PC Desktop", marca: "Custom", modelo: "Gamer i7", serie: "PC789012", cliente: "Maria Santos", acessorios: "Teclado, Mouse", defeito: "Tela azul", senha: "", observacoes: "Urgente" },
  { id: "3", tipo: "Impressora", marca: "HP", modelo: "LaserJet Pro", serie: "HP345678", cliente: "Tech Solutions LTDA", acessorios: "Cabo USB", defeito: "Não imprime", senha: "", observacoes: "" },
];

export default function Equipamentos() {
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Equipamento | null>(null);
  const [form, setForm] = useState({ tipo: "", marca: "", modelo: "", serie: "", cliente: "", acessorios: "", defeito: "", senha: "", observacoes: "" });

  const filtered = items.filter(e => e.modelo.toLowerCase().includes(search.toLowerCase()) || e.cliente.toLowerCase().includes(search.toLowerCase()) || e.marca.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.tipo || !form.marca) { toast.error("Tipo e marca são obrigatórios"); return; }
    if (editing) {
      setItems(prev => prev.map(e => e.id === editing.id ? { ...form, id: e.id } : e));
      toast.success("Equipamento atualizado!");
    } else {
      setItems(prev => [...prev, { ...form, id: Date.now().toString() }]);
      toast.success("Equipamento cadastrado!");
    }
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => { setForm({ tipo: "", marca: "", modelo: "", serie: "", cliente: "", acessorios: "", defeito: "", senha: "", observacoes: "" }); setEditing(null); };

  return (
    <div className="space-y-6">
      <PageHeader title="Equipamentos" description="Cadastro de equipamentos dos clientes">
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Equipamento</Button></DialogTrigger>
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
                <div className="grid gap-2"><Label>Nº Série</Label><Input value={form.serie} onChange={e => setForm(f => ({ ...f, serie: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Cliente</Label><Input value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Acessórios</Label><Input value={form.acessorios} onChange={e => setForm(f => ({ ...f, acessorios: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Defeito Relatado</Label><Textarea value={form.defeito} onChange={e => setForm(f => ({ ...f, defeito: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Senha do Equipamento</Label><Input value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} /></div>
              <Button onClick={handleSave}>{editing ? "Salvar" : "Cadastrar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
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
                {filtered.map(e => (
                  <TableRow key={e.id}>
                    <TableCell>{e.tipo}</TableCell>
                    <TableCell className="font-medium">{e.marca} {e.modelo}</TableCell>
                    <TableCell className="hidden md:table-cell">{e.serie}</TableCell>
                    <TableCell className="hidden sm:table-cell">{e.cliente}</TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[200px] truncate">{e.defeito}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(e); setForm(e); setDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setItems(prev => prev.filter(i => i.id !== e.id)); toast.success("Removido!"); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
