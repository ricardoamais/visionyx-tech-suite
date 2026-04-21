import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Edit, Trash2, Loader2, Key } from "lucide-react";
import {
  useServicosCatalogo,
  useCreateServico,
  useUpdateServico,
  useDeleteServico,
} from "@/hooks/useServicosCatalogo";

const empty = { nome: "", categoria: "", valor_padrao: 0, descricao: "", ativo: true };

export default function Servicos() {
  const { data: servicos, isLoading } = useServicosCatalogo();
  const create = useCreateServico();
  const update = useUpdateServico();
  const remove = useDeleteServico();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(empty);

  const filtered = (servicos ?? []).filter(
    (s) =>
      s.nome.toLowerCase().includes(search.toLowerCase()) ||
      (s.categoria ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const reset = () => {
    setForm(empty);
    setEditing(null);
  };

  const handleSave = () => {
    if (!form.nome.trim()) return;
    const payload = {
      nome: form.nome.trim(),
      categoria: form.categoria.trim() || null,
      valor_padrao: Number(form.valor_padrao),
      descricao: form.descricao.trim() || null,
      ativo: form.ativo,
    };
    if (editing) {
      update.mutate(
        { id: editing.id, ...payload },
        { onSuccess: () => { setOpen(false); reset(); } }
      );
    } else {
      create.mutate(payload, { onSuccess: () => { setOpen(false); reset(); } });
    }
  };

  const handleEdit = (s: any) => {
    setEditing(s);
    setForm({
      nome: s.nome,
      categoria: s.categoria ?? "",
      valor_padrao: s.valor_padrao,
      descricao: s.descricao ?? "",
      ativo: s.ativo,
    });
    setOpen(true);
  };

  const saving = create.isPending || update.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Serviços de Chaveiro"
        description="Catálogo de serviços que podem ser vinculados a Ordens de Serviço"
      >
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Serviço</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Cópia de chave Yale"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Input
                  placeholder="Ex: Cópia, Abertura, Fechadura"
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Valor Padrão (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor_padrao}
                  onChange={(e) => setForm((f) => ({ ...f, valor_padrao: Number(e.target.value) }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.ativo}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))}
                />
                <Label>Ativo</Label>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Key className="w-4 h-4 text-primary" />
                        {s.nome}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {s.categoria ?? "—"}
                      </TableCell>
                      <TableCell>R$ {Number(s.valor_padrao).toFixed(2)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            s.ativo
                              ? "text-xs px-2 py-1 rounded-md bg-primary/10 text-primary"
                              : "text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                          }
                        >
                          {s.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Remover este serviço?")) remove.mutate(s.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhum serviço cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}