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
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

const statusOptions = ["Aberto", "Em análise", "Aguardando aprovação", "Em manutenção", "Finalizado", "Entregue"];

interface OS {
  id: string; numero: string; data: string; cliente: string; equipamento: string; problema: string;
  diagnostico: string; servicos: string; pecas: string; valorMaoObra: number; valorPecas: number;
  status: string; tecnico: string; dataEntrega: string;
}

const initial: OS[] = [
  { id: "1", numero: "OS-001", data: "2026-03-22", cliente: "João Silva", equipamento: "Notebook Dell Inspiron 15", problema: "Não liga", diagnostico: "Placa mãe com defeito", servicos: "Troca de placa mãe", pecas: "Placa mãe Dell", valorMaoObra: 150, valorPecas: 450, status: "Em manutenção", tecnico: "Carlos", dataEntrega: "" },
  { id: "2", numero: "OS-002", data: "2026-03-21", cliente: "Maria Santos", equipamento: "PC Gamer i7", problema: "Tela azul constante", diagnostico: "Memória RAM com defeito", servicos: "Teste e troca de memória", pecas: "Memória DDR4 16GB", valorMaoObra: 80, valorPecas: 320, status: "Aberto", tecnico: "André", dataEntrega: "" },
  { id: "3", numero: "OS-003", data: "2026-03-20", cliente: "Carlos Oliveira", equipamento: "Impressora HP LaserJet", problema: "Não imprime", diagnostico: "Cabeça de impressão obstruída", servicos: "Limpeza e manutenção", pecas: "", valorMaoObra: 120, valorPecas: 0, status: "Finalizado", tecnico: "Carlos", dataEntrega: "2026-03-22" },
  { id: "4", numero: "OS-004", data: "2026-03-19", cliente: "Ana Costa", equipamento: "Monitor LG 24\"", problema: "Manchas na tela", diagnostico: "Backlight com defeito", servicos: "Troca de backlight", pecas: "LED backlight", valorMaoObra: 100, valorPecas: 80, status: "Aguardando aprovação", tecnico: "André", dataEntrega: "" },
];

export default function OrdensServico() {
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewing, setViewing] = useState<OS | null>(null);

  const filtered = items.filter(o => {
    const matchSearch = o.numero.toLowerCase().includes(search.toLowerCase()) || o.cliente.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Ordens de Serviço" description="Gerencie todas as ordens de serviço">
        <Button><Plus className="w-4 h-4 mr-2" />Nova OS</Button>
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
                {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº OS</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Equipamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Valor Total</TableHead>
                  <TableHead className="hidden lg:table-cell">Técnico</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium text-primary">{o.numero}</TableCell>
                    <TableCell>{o.cliente}</TableCell>
                    <TableCell className="hidden md:table-cell">{o.equipamento}</TableCell>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell className="hidden sm:table-cell font-medium">R$ {(o.valorMaoObra + o.valorPecas).toFixed(2)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{o.tecnico}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Dialog>
                          <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => setViewing(o)}><Eye className="w-4 h-4" /></Button></DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader><DialogTitle>Detalhes da {o.numero}</DialogTitle></DialogHeader>
                            <div className="grid gap-3 text-sm">
                              <div className="grid grid-cols-2 gap-3">
                                <div><span className="text-muted-foreground">Data:</span> <span className="font-medium">{o.data}</span></div>
                                <div><span className="text-muted-foreground">Técnico:</span> <span className="font-medium">{o.tecnico}</span></div>
                              </div>
                              <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{o.cliente}</span></div>
                              <div><span className="text-muted-foreground">Equipamento:</span> <span className="font-medium">{o.equipamento}</span></div>
                              <div><span className="text-muted-foreground">Problema:</span> <p>{o.problema}</p></div>
                              <div><span className="text-muted-foreground">Diagnóstico:</span> <p>{o.diagnostico}</p></div>
                              <div><span className="text-muted-foreground">Serviços:</span> <p>{o.servicos}</p></div>
                              {o.pecas && <div><span className="text-muted-foreground">Peças:</span> <p>{o.pecas}</p></div>}
                              <div className="border-t pt-3 grid grid-cols-3 gap-3">
                                <div><span className="text-muted-foreground text-xs">Mão de obra</span><p className="font-medium">R$ {o.valorMaoObra.toFixed(2)}</p></div>
                                <div><span className="text-muted-foreground text-xs">Peças</span><p className="font-medium">R$ {o.valorPecas.toFixed(2)}</p></div>
                                <div><span className="text-muted-foreground text-xs">Total</span><p className="font-bold text-primary">R$ {(o.valorMaoObra + o.valorPecas).toFixed(2)}</p></div>
                              </div>
                              <div className="flex items-center gap-2"><span className="text-muted-foreground">Status:</span> <StatusBadge status={o.status} /></div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setItems(prev => prev.filter(i => i.id !== o.id)); toast.success("OS removida!"); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
