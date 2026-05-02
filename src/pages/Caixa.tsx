import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Plus, Trash2, Lock, Unlock, ShoppingCart, Printer } from "lucide-react";
import { useCaixaAberto, useAbrirCaixa, useFecharCaixa, useVendasCaixa, useCreateVenda } from "@/hooks/useCaixa";
import { usePecas } from "@/hooks/usePecas";
import { useClientes } from "@/hooks/useClientes";
 import { useEmpresaConfig } from "@/hooks/useEmpresaConfig";
 import { QuickAddCliente } from "@/components/QuickAddCliente";
import { imprimirCupom } from "@/components/CupomVenda";
import { format } from "date-fns";

const pagamentoLabels: Record<string, string> = {
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão Crédito",
  cartao_debito: "Cartão Débito",
  pix: "PIX",
};

export default function Caixa() {
  const { data: caixaAberto, isLoading } = useCaixaAberto();
  const { data: vendas = [] } = useVendasCaixa(caixaAberto?.id);
  const { data: pecas = [] } = usePecas();
  const { data: clientes = [] } = useClientes();
  const { data: empresa } = useEmpresaConfig();
  const abrir = useAbrirCaixa();
  const fechar = useFecharCaixa();
  const criarVenda = useCreateVenda();

  const [openAbrir, setOpenAbrir] = useState(false);
  const [openFechar, setOpenFechar] = useState(false);
  const [openVenda, setOpenVenda] = useState(false);

  const [valorAbertura, setValorAbertura] = useState("");
  const [obsAbertura, setObsAbertura] = useState("");
  const [valorFechamento, setValorFechamento] = useState("");
  const [obsFechamento, setObsFechamento] = useState("");

  const [clienteId, setClienteId] = useState<string | undefined>(undefined);
  const [formaPagamento, setFormaPagamento] = useState<"dinheiro" | "cartao_credito" | "cartao_debito" | "pix">("dinheiro");
  const [obsVenda, setObsVenda] = useState("");
  const [itens, setItens] = useState<{ peca_id: string; quantidade: number; valor_unitario: number }[]>([]);

  const pecasValidas = useMemo(() => (pecas ?? []).filter((p: any) => p?.id), [pecas]);
  const clientesValidos = useMemo(() => (clientes ?? []).filter((c: any) => c?.id), [clientes]);

  const totais = useMemo(() => {
    const t = { dinheiro: 0, cartao_credito: 0, cartao_debito: 0, pix: 0, total: 0 };
    vendas.forEach((v: any) => {
      t[v.forma_pagamento as keyof typeof t] += Number(v.valor_total);
      t.total += Number(v.valor_total);
    });
    return t;
  }, [vendas]);

  const totalEsperado = (Number(caixaAberto?.valor_abertura) || 0) + totais.dinheiro;

  function addItem() {
    setItens([...itens, { peca_id: "", quantidade: 1, valor_unitario: 0 }]);
  }
  function updateItem(i: number, patch: Partial<{ peca_id: string; quantidade: number; valor_unitario: number }>) {
    const novos = [...itens];
    novos[i] = { ...novos[i], ...patch };
    if (patch.peca_id) {
      const p = pecasValidas.find((x: any) => x.id === patch.peca_id);
      if (p) novos[i].valor_unitario = Number(p.valor_venda);
    }
    setItens(novos);
  }
  function removeItem(i: number) {
    setItens(itens.filter((_, idx) => idx !== i));
  }

  function resetVenda() {
    setItens([]); setClienteId(undefined); setFormaPagamento("dinheiro"); setObsVenda("");
  }

  function handleAbrir() {
    if (!valorAbertura) return;
    abrir.mutate(
      { valor_abertura: parseFloat(valorAbertura), observacoes: obsAbertura || undefined },
      { onSuccess: () => { setOpenAbrir(false); setValorAbertura(""); setObsAbertura(""); } }
    );
  }

  function handleFechar() {
    if (!caixaAberto || !valorFechamento) return;
    fechar.mutate(
      { id: caixaAberto.id, valor_fechamento: parseFloat(valorFechamento), observacoes: obsFechamento || undefined },
      { onSuccess: () => { setOpenFechar(false); setValorFechamento(""); setObsFechamento(""); } }
    );
  }

  function handleVenda() {
    if (!caixaAberto) return;
    const itensValidos = itens.filter((i) => i.peca_id && i.quantidade > 0);
    if (!itensValidos.length) return;
    criarVenda.mutate(
      {
        caixa_id: caixaAberto.id,
        cliente_id: clienteId || null,
        forma_pagamento: formaPagamento,
        observacoes: obsVenda || undefined,
        itens: itensValidos,
      },
      {
        onSuccess: (venda: any) => {
          const cliente = clienteId ? clientesValidos.find((c: any) => c.id === clienteId) : null;
          setOpenVenda(false);
          resetVenda();
          // Pergunta se deseja imprimir cupom
          setTimeout(() => {
            if (window.confirm("Venda registrada! Deseja imprimir o cupom?")) {
              imprimirCupom({ empresa, venda, cliente });
            }
          }, 100);
        },
      }
    );
  }

  const totalVenda = itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Caixa / PDV" description="Controle de caixa e vendas">
        {!caixaAberto ? (
          <Button onClick={() => setOpenAbrir(true)}><Unlock className="w-4 h-4 mr-2" />Abrir Caixa</Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setOpenVenda(true)}><ShoppingCart className="w-4 h-4 mr-2" />Nova Venda</Button>
            <Button variant="outline" onClick={() => setOpenFechar(true)}><Lock className="w-4 h-4 mr-2" />Fechar Caixa</Button>
          </div>
        )}
      </PageHeader>

      {!caixaAberto ? (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum caixa aberto. Clique em "Abrir Caixa" para iniciar.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Abertura" value={`R$ ${Number(caixaAberto.valor_abertura).toFixed(2)}`} icon={DollarSign} />
            <StatCard title="Vendas" value={`R$ ${totais.total.toFixed(2)}`} icon={ShoppingCart} />
            <StatCard title="Em Dinheiro" value={`R$ ${totais.dinheiro.toFixed(2)}`} icon={DollarSign} />
            <StatCard title="Esperado em Caixa" value={`R$ ${totalEsperado.toFixed(2)}`} icon={DollarSign} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Dinheiro</p><p className="text-lg font-semibold">R$ {totais.dinheiro.toFixed(2)}</p></CardContent></Card>
            <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Cartão Crédito</p><p className="text-lg font-semibold">R$ {totais.cartao_credito.toFixed(2)}</p></CardContent></Card>
            <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Cartão Débito</p><p className="text-lg font-semibold">R$ {totais.cartao_debito.toFixed(2)}</p></CardContent></Card>
            <Card className="glass-card"><CardContent className="p-4"><p className="text-xs text-muted-foreground">PIX</p><p className="text-lg font-semibold">R$ {totais.pix.toFixed(2)}</p></CardContent></Card>
          </div>

          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Vendas do Caixa ({vendas.length})</CardTitle></CardHeader>
            <CardContent>
              {vendas.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma venda ainda</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendas.map((v: any) => (
                      <TableRow key={v.id}>
                        <TableCell>{format(new Date(v.created_at), "HH:mm")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {(v.venda_itens ?? []).map((i: any) => `${i.quantidade}x ${i.pecas?.nome ?? "-"}`).join(", ")}
                        </TableCell>
                        <TableCell>{pagamentoLabels[v.forma_pagamento]}</TableCell>
                        <TableCell className="text-right font-medium">R$ {Number(v.valor_total).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const cliente = v.cliente_id ? clientesValidos.find((c: any) => c.id === v.cliente_id) : null;
                              imprimirCupom({ empresa, venda: v, cliente });
                            }}
                            title="Imprimir cupom"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Abrir Caixa */}
      <Dialog open={openAbrir} onOpenChange={setOpenAbrir}>
        <DialogContent>
          <DialogHeader><DialogTitle>Abrir Caixa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Valor de Abertura *</Label><Input type="number" step="0.01" value={valorAbertura} onChange={(e) => setValorAbertura(e.target.value)} /></div>
            <div><Label>Observações</Label><Textarea value={obsAbertura} onChange={(e) => setObsAbertura(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAbrir(false)}>Cancelar</Button>
            <Button onClick={handleAbrir} disabled={abrir.isPending}>Abrir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fechar Caixa */}
      <Dialog open={openFechar} onOpenChange={setOpenFechar}>
        <DialogContent>
          <DialogHeader><DialogTitle>Fechar Caixa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-sm space-y-1 p-3 rounded-md bg-muted/40">
              <div className="flex justify-between"><span>Abertura:</span><span>R$ {Number(caixaAberto?.valor_abertura ?? 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Vendas em dinheiro:</span><span>R$ {totais.dinheiro.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold"><span>Esperado:</span><span>R$ {totalEsperado.toFixed(2)}</span></div>
            </div>
            <div><Label>Valor de Fechamento (contado) *</Label><Input type="number" step="0.01" value={valorFechamento} onChange={(e) => setValorFechamento(e.target.value)} /></div>
            <div><Label>Observações</Label><Textarea value={obsFechamento} onChange={(e) => setObsFechamento(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenFechar(false)}>Cancelar</Button>
            <Button onClick={handleFechar} disabled={fechar.isPending}>Fechar Caixa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nova Venda */}
      <Dialog open={openVenda} onOpenChange={(o) => { setOpenVenda(o); if (!o) resetVenda(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nova Venda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label>Cliente (opcional)</Label>
                 <div className="flex gap-2">
                   <Select value={clienteId || undefined} onValueChange={(v) => setClienteId(v)}>
                     <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                     <SelectContent>
                       {clientesValidos.length === 0 ? (
                         <SelectItem value="__empty" disabled>Nenhum cliente</SelectItem>
                       ) : (
                         clientesValidos.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)
                       )}
                     </SelectContent>
                   </Select>
                   <QuickAddCliente onSuccess={(id) => setClienteId(id)} />
                 </div>
               </div>
              <div>
                <Label>Forma de Pagamento *</Label>
                <Select value={formaPagamento} onValueChange={(v) => setFormaPagamento(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                    <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Itens</Label>
                <Button size="sm" variant="outline" onClick={addItem}><Plus className="w-3 h-3 mr-1" />Adicionar</Button>
              </div>
              {itens.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum item adicionado</p>
              ) : (
                <div className="space-y-2">
                  {itens.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6">
                        <Select value={it.peca_id || undefined} onValueChange={(v) => updateItem(i, { peca_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Peça" /></SelectTrigger>
                          <SelectContent>
                            {pecasValidas.length === 0 ? (
                              <SelectItem value="__empty" disabled>Sem peças</SelectItem>
                            ) : (
                              pecasValidas.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome} (est: {p.quantidade})</SelectItem>)
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2"><Input type="number" min="1" value={it.quantidade} onChange={(e) => updateItem(i, { quantidade: parseInt(e.target.value) || 1 })} /></div>
                      <div className="col-span-3"><Input type="number" step="0.01" value={it.valor_unitario} onChange={(e) => updateItem(i, { valor_unitario: parseFloat(e.target.value) || 0 })} /></div>
                      <div className="col-span-1"><Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div><Label>Observações</Label><Textarea value={obsVenda} onChange={(e) => setObsVenda(e.target.value)} /></div>

            <div className="flex justify-between items-center text-lg font-semibold p-3 rounded-md bg-muted/40">
              <span>Total:</span><span>R$ {totalVenda.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenVenda(false)}>Cancelar</Button>
            <Button onClick={handleVenda} disabled={criarVenda.isPending || itens.length === 0}>Registrar Venda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
