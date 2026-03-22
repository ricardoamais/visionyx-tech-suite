import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Orcamento {
  id: string; numero: string; data: string; cliente: string; itens: string; valorTotal: number; status: string;
}

const initial: Orcamento[] = [
  { id: "1", numero: "ORC-001", data: "2026-03-22", cliente: "João Silva", itens: "Troca de HD SSD + Mão de obra", valorTotal: 380, status: "Pendente" },
  { id: "2", numero: "ORC-002", data: "2026-03-21", cliente: "Maria Santos", itens: "Memória DDR4 16GB + Instalação", valorTotal: 420, status: "Aprovado" },
  { id: "3", numero: "ORC-003", data: "2026-03-20", cliente: "Ana Costa", itens: "Troca de backlight + Mão de obra", valorTotal: 180, status: "Reprovado" },
];

export default function Orcamentos() {
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState("");

  const filtered = items.filter(o => o.numero.toLowerCase().includes(search.toLowerCase()) || o.cliente.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Orçamentos" description="Gerencie orçamentos para clientes">
        <Button><Plus className="w-4 h-4 mr-2" />Novo Orçamento</Button>
      </PageHeader>
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por número ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          </div>
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
                    <TableCell>{o.cliente}</TableCell>
                    <TableCell className="hidden md:table-cell max-w-[250px] truncate">{o.itens}</TableCell>
                    <TableCell className="font-medium">R$ {o.valorTotal.toFixed(2)}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {o.status === "Aprovado" && (
                          <Button variant="ghost" size="icon" title="Converter em OS" onClick={() => toast.success("Convertido em OS!")}><ArrowRight className="w-4 h-4 text-success" /></Button>
                        )}
                        <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setItems(prev => prev.filter(i => i.id !== o.id)); toast.success("Removido!"); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
