 import { useState, useMemo, useEffect } from "react";
 import { toast } from "sonner";
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
 import { DollarSign, Plus, Trash2, Lock, Unlock, ShoppingCart, Printer, Search, FileText, Wrench, CheckCircle2 } from "lucide-react";
  import { useCaixaAberto, useAbrirCaixa, useFecharCaixa, useMovimentosCaixa, useCreateVenda, useVendasCaixa, useRegistrarRecebimentoAvulso } from "@/hooks/useCaixa";
 import { useOrcamentos } from "@/hooks/useOrcamentos";
 import { useOrdensServico } from "@/hooks/useOrdensServico";
 import { printRecibo } from "@/components/caixa/PrintRecibo";
 import { useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
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
   const { data: caixaAberto, isLoading: loadingCaixa } = useCaixaAberto();
   const { data: movimentos = [], isLoading: loadingMov, refetch: refetchMov } = useMovimentosCaixa(caixaAberto?.id);
   const { data: todasVendas = [] } = useVendasCaixa(caixaAberto?.id);
  const { data: pecas = [] } = usePecas();
  const { data: clientes = [] } = useClientes();
  const { data: empresa } = useEmpresaConfig();
  const abrir = useAbrirCaixa();
  const fechar = useFecharCaixa();
  const criarVenda = useCreateVenda();

  const [openAbrir, setOpenAbrir] = useState(false);
  const [openFechar, setOpenFechar] = useState(false);
   const [openVenda, setOpenVenda] = useState(false);
   const [openSucesso, setOpenSucesso] = useState(false);
   const [dadosSucesso, setDadosSucesso] = useState<any>(null);
 
   const [buscaTermo, setBuscaTermo] = useState("");
   const [itemSelecionado, setItemSelecionado] = useState<any>(null);
   const { data: orcamentos = [] } = useOrcamentos();
   const { data: ordensServico = [] } = useOrdensServico();
   const qc = useQueryClient();
 
   const resultadosBusca = useMemo(() => {
     if (buscaTermo.length < 3) return { orcamentos: [], os: [] };
     const termo = buscaTermo.toLowerCase();
     
     const orcFiltrados = orcamentos.filter((o: any) => 
       o.status === 'aprovado' && 
       o.clientes?.nome?.toLowerCase().includes(termo)
     );
 
     const osFiltradas = ordensServico.filter((os: any) => 
       (os.status === 'finalizado' || os.status === 'entregue') && 
       os.clientes?.nome?.toLowerCase().includes(termo)
     );
 
     return { orcamentos: orcFiltrados, os: osFiltradas };
   }, [buscaTermo, orcamentos, ordensServico]);
 
   function handleSelecionarItem(item: any, tipo: 'orcamento' | 'os') {
     const desc = tipo === 'orcamento' ? `ORC-${item.id.slice(0,4)} - ${item.clientes?.nome}` : `OS-${item.id.slice(0,4)} - ${item.clientes?.nome}`;
     setItemSelecionado({
       id: item.id,
       tipo,
       cliente: item.clientes?.nome,
       cliente_id: item.cliente_id,
       valor: Number(item.valor_total || (Number(item.valor_mao_obra || 0) + Number(item.valor_pecas || 0))),
       descricao: desc,
       numero: tipo === 'orcamento' ? `ORC-${item.id.slice(0,4)}` : `OS-${item.id.slice(0,4)}`
     });
     setBuscaTermo("");
   }
 
   async function handleConfirmarRecebimento() {
     if (!caixaAberto || !itemSelecionado) return;
     
     try {
       const { id, tipo, valor, descricao, forma_pagamento, numero, cliente } = {
         ...itemSelecionado,
         forma_pagamento: formaPagamento
       };
 
       // 1. Inserir movimento no caixa
       const { error: errorMov } = await supabase.from('caixa_movimentos').insert({
         company_id: caixaAberto.company_id,
         caixa_id: caixaAberto.id,
         tipo: 'entrada',
         valor: valor,
         descricao: descricao,
         forma_pagamento: forma_pagamento,
         origem: tipo,
         origem_id: id,
       });
       if (errorMov) throw errorMov;
 
       // 2. Atualizar conta para recebido
       const { error: errorConta } = await supabase.from('contas')
         .update({
           status: 'recebido',
           forma_pagamento: forma_pagamento,
           data_pagamento: new Date().toISOString().split('T')[0],
         })
         .eq(tipo === 'orcamento' ? 'orcamento_id' : 'ordem_servico_id', id);
       // errorConta is fine if it doesn't exist yet, but should exist for approved orc/finalized os
 
       // 3. Atualizar status do documento original
       if (tipo === 'os') {
         await supabase.from('ordens_servico').update({ status: 'entregue' }).eq('id', id);
       } else {
         await supabase.from('orcamentos').update({ status: 'pago' }).eq('id', id);
       }
 
       // 4. Imprimir recibo
       printRecibo({
         numero,
         cliente,
         descricao,
         valor,
         formaPagamento: forma_pagamento,
         empresa
       });
 
       // 5. Feedback Visual
       setDadosSucesso({ valor, forma_pagamento });
       setOpenSucesso(true);
       setOpenVenda(false);
       setItemSelecionado(null);
       resetVenda();
 
       // 6. Invalidar queries
       qc.invalidateQueries({ queryKey: ['movimentos_caixa'] });
       qc.invalidateQueries({ queryKey: ['contas'] });
       qc.invalidateQueries({ queryKey: ['ordens_servico'] });
       qc.invalidateQueries({ queryKey: ['orcamentos'] });
       qc.invalidateQueries({ queryKey: ['dashboard'] });
       qc.invalidateQueries({ queryKey: ['relatorios'] });
 
       setTimeout(() => setOpenSucesso(false), 3000);
     } catch (error: any) {
       toast.error("Erro ao registrar recebimento: " + error.message);
     }
   }
 

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
     movimentos.forEach((m: any) => {
       if (m.tipo === 'entrada') {
         t[m.forma_pagamento as keyof typeof t] += Number(m.valor);
         t.total += Number(m.valor);
       } else if (m.tipo === 'saida') {
         t[m.forma_pagamento as keyof typeof t] -= Number(m.valor);
         t.total -= Number(m.valor);
       }
     });
     return t;
   }, [movimentos]);

   const totalEsperado = (Number(caixaAberto?.valor_abertura) || 0) + (totais.dinheiro || 0);

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

   if (loadingCaixa || loadingMov) {
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
             <CardHeader><CardTitle className="text-base">Movimentações do Caixa ({movimentos.length})</CardTitle></CardHeader>
             <CardContent>
               {movimentos.length === 0 ? (
                 <p className="text-center text-muted-foreground py-8">Nenhuma movimentação ainda</p>
               ) : (
                 <Table>
                   <TableHeader>
                     <TableRow>
                        <TableHead>Hora / Origem</TableHead>
                        <TableHead>Descrição</TableHead>
                       <TableHead>Pagamento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-12"></TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                      {movimentos.map((m: any) => {
                        const isOS = m.origem === 'os';
                        const isOrc = m.origem === 'orcamento' || m.origem === 'orc';
                        const isPDV = m.origem === 'pdv' || !m.origem;
                        const isContrato = m.origem === 'contrato';
                        
                        let badgeColor = "bg-muted text-muted-foreground";
                        let label = "Venda";
                        
                        if (isOS) { badgeColor = "bg-blue-100 text-blue-700"; label = "OS"; }
                        if (isPDV) { badgeColor = "bg-green-100 text-green-700"; label = "PDV"; }
                        if (isContrato) { badgeColor = "bg-purple-100 text-purple-700"; label = "Contrato"; }
                        if (isOrc) { badgeColor = "bg-orange-100 text-orange-700"; label = "ORC"; }

                        return (
                       <TableRow key={m.id}>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span>{format(new Date(m.created_at), "HH:mm")}</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${badgeColor}`}>
                                {label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {m.descricao}
                         </TableCell>
                         <TableCell className="text-sm">{pagamentoLabels[m.forma_pagamento] || m.forma_pagamento}</TableCell>
                          <TableCell className={`text-right font-medium ${m.tipo === 'saida' ? 'text-destructive' : 'text-green-600'}`}>
                            {m.tipo === 'saida' ? '-' : '+'} R$ {Number(m.valor).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {m.origem === 'pdv' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const venda = todasVendas.find((v: any) => v.id === m.origem_id);
                                  if (venda) {
                                    const cliente = venda.cliente_id ? clientesValidos.find((c: any) => c.id === venda.cliente_id) : null;
                                    imprimirCupom({ empresa, venda, cliente });
                                  } else {
                                    toast.error("Venda não encontrada para impressão");
                                  }
                                }}
                                title="Imprimir cupom"
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                       </TableRow>
                        );
                      })}
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
             {!itemSelecionado ? (
               <>
                 <div className="relative">
                   <Label>Pesquisar Cliente, Orçamento ou OS</Label>
                   <div className="relative mt-1">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input 
                       placeholder="Digite o nome do cliente (mín. 3 caracteres)..." 
                       className="pl-9"
                       value={buscaTermo}
                       onChange={(e) => setBuscaTermo(e.target.value)}
                     />
                   </div>
                   
                   {(resultadosBusca.orcamentos.length > 0 || resultadosBusca.os.length > 0) && (
                     <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                       {resultadosBusca.orcamentos.length > 0 && (
                         <div className="p-2">
                           <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 flex items-center gap-1">
                             <FileText className="w-3 h-3" /> Orçamentos Aprovados
                           </div>
                           {resultadosBusca.orcamentos.map((orc: any) => (
                             <button
                               key={orc.id}
                               className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm flex justify-between items-center"
                               onClick={() => handleSelecionarItem(orc, 'orcamento')}
                             >
                               <span>ORC-{orc.id.slice(0,4)} — {orc.clientes?.nome}</span>
                               <span className="font-semibold">R$ {Number(orc.valor_total).toFixed(2)}</span>
                             </button>
                           ))}
                         </div>
                       )}
                       {resultadosBusca.os.length > 0 && (
                         <div className="p-2 border-t">
                           <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 flex items-center gap-1">
                             <Wrench className="w-3 h-3" /> Ordens de Serviço
                           </div>
                           {resultadosBusca.os.map((os: any) => (
                             <button
                               key={os.id}
                               className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm flex justify-between items-center"
                               onClick={() => handleSelecionarItem(os, 'os')}
                             >
                               <span>OS-{os.id.slice(0,4)} — {os.clientes?.nome}</span>
                               <span className="font-semibold">R$ {(Number(os.valor_mao_obra || 0) + Number(os.valor_pecas || 0)).toFixed(2)}</span>
                             </button>
                           ))}
                         </div>
                       )}
                     </div>
                   )}
                 </div>
 
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
               </>
             ) : (
               <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                 <div className="flex justify-between items-start">
                   <div>
                     <h3 className="font-bold text-lg">{itemSelecionado.numero} — {itemSelecionado.cliente}</h3>
                     <p className="text-sm text-muted-foreground">{itemSelecionado.tipo === 'orcamento' ? 'Orçamento Aprovado' : 'Ordem de Serviço Finalizada'}</p>
                   </div>
                   <Button variant="ghost" size="sm" onClick={() => setItemSelecionado(null)}>Trocar</Button>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label>Valor Total</Label>
                     <Input 
                       type="number" 
                       step="0.01" 
                       value={itemSelecionado.valor} 
                       onChange={(e) => setItemSelecionado({...itemSelecionado, valor: parseFloat(e.target.value) || 0})} 
                     />
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
               </div>
             )}
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
             <Button variant="outline" onClick={() => { setOpenVenda(false); setItemSelecionado(null); }}>Cancelar</Button>
             {itemSelecionado ? (
               <Button onClick={handleConfirmarRecebimento}>Confirmar Recebimento</Button>
             ) : (
               <Button onClick={handleVenda} disabled={criarVenda.isPending || itens.length === 0}>Registrar Venda</Button>
             )}
           </DialogFooter>
       {/* Sucesso Feedback */}
       <Dialog open={openSucesso} onOpenChange={setOpenSucesso}>
         <DialogContent className="sm:max-w-md">
           <div className="flex flex-col items-center justify-center py-6 space-y-4">
             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
               <CheckCircle2 className="w-10 h-10 text-green-600" />
             </div>
             <div className="text-center">
               <h3 className="text-xl font-bold text-green-700">Pagamento registrado!</h3>
               <p className="text-muted-foreground">O recebimento foi processado com sucesso.</p>
             </div>
             {dadosSucesso && (
               <div className="w-full p-4 bg-muted rounded-lg text-center">
                 <p className="text-sm text-muted-foreground">Valor Recebido</p>
                 <p className="text-2xl font-bold">R$ {Number(dadosSucesso.valor).toFixed(2)}</p>
                 <p className="text-xs mt-1 uppercase font-semibold text-muted-foreground">
                   {pagamentoLabels[dadosSucesso.forma_pagamento] || dadosSucesso.forma_pagamento}
                 </p>
               </div>
             )}
           </div>
         </DialogContent>
       </Dialog>
        </DialogContent>
      </Dialog>
    </div>
  );
}
