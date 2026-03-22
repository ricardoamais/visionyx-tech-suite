import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Peca {
  id: string; nome: string; quantidade: number; valorCompra: number; valorVenda: number; minimo: number;
}

const initial: Peca[] = [
  { id: "1", nome: "SSD 240GB Kingston", quantidade: 15, valorCompra: 120, valorVenda: 189, minimo: 5 },
  { id: "2", nome: "Memória DDR4 8GB", quantidade: 8, valorCompra: 150, valorVenda: 220, minimo: 3 },
  { id: "3", nome: "Fonte 500W", quantidade: 2, valorCompra: 180, valorVenda: 280, minimo: 3 },
  { id: "4", nome: "Pasta Térmica", quantidade: 25, valorCompra: 8, valorVenda: 15, minimo: 10 },
  { id: "5", nome: "Teclado USB", quantidade: 12, valorCompra: 25, valorVenda: 45, minimo: 5 },
  { id: "6", nome: "Mouse Óptico", quantidade: 1, valorCompra: 15, valorVenda: 30, minimo: 5 },
];

export default function Estoque() {
  const [items, setItems] = useState(initial);
  const [search, setSearch] = useState("");

  const filtered = items.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));
  const totalEstoque = items.reduce((acc, p) => acc + p.quantidade * p.valorVenda, 0);
  const baixoEstoque = items.filter(p => p.quantidade <= p.minimo).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Estoque de Peças" description={`${items.length} itens | Valor total: R$ ${totalEstoque.toFixed(2)}`}>
        <Button><Plus className="w-4 h-4 mr-2" />Nova Peça</Button>
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
                {filtered.map(p => (
                  <TableRow key={p.id} className={p.quantidade <= p.minimo ? "bg-warning/5" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {p.quantidade <= p.minimo && <AlertTriangle className="w-3 h-3 text-warning" />}
                        {p.nome}
                      </div>
                    </TableCell>
                    <TableCell className={p.quantidade <= p.minimo ? "text-warning font-bold" : ""}>{p.quantidade}</TableCell>
                    <TableCell className="hidden sm:table-cell">R$ {p.valorCompra.toFixed(2)}</TableCell>
                    <TableCell>R$ {p.valorVenda.toFixed(2)}</TableCell>
                    <TableCell className="hidden md:table-cell text-success">{((p.valorVenda - p.valorCompra) / p.valorCompra * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setItems(prev => prev.filter(i => i.id !== p.id)); toast.success("Removido!"); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
