 import { useState } from "react";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Label } from "@/components/ui/label";
 import { Input } from "@/components/ui/input";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Textarea } from "@/components/ui/textarea";
 import { useEmpresa } from "@/contexts/EmpresaContext";
 import { supabase } from "@/integrations/supabase/client";
 import { useQueryClient } from "@tanstack/react-query";
 import { toast } from "sonner";
 import { Loader2 } from "lucide-react";
 import { useCaixaAberto } from "@/hooks/useCaixa";
 
 interface ModalRecebimentoProps {
   isOpen: boolean;
   onClose: () => void;
   onSuccess: () => void;
   data: {
     id: string;
     numero: string;
     cliente_id: string;
     cliente_nome: string;
     valor_mao_obra: number;
     valor_pecas: number;
     tipo: 'os' | 'orcamento';
     items?: any[];
   };
 }
 
 export function ModalRecebimento({ isOpen, onClose, onSuccess, data }: ModalRecebimentoProps) {
   const { companyId } = useEmpresa();
   const queryClient = useQueryClient();
   const { data: caixaAberto } = useCaixaAberto();
   
   const [formaPagamento, setFormaPagamento] = useState<string>("");
   const [desconto, setDesconto] = useState<number>(0);
   const [observacao, setObservacao] = useState("");
   const [loading, setLoading] = useState(false);
 
   const totalOriginal = (Number(data.valor_mao_obra) || 0) + (Number(data.valor_pecas) || 0);
   const totalFinal = Math.max(0, totalOriginal - (Number(desconto) || 0));
 
   const handleConfirmar = async (isReceberDepois = false) => {
     if (!isReceberDepois && !formaPagamento) {
       toast.error("Selecione a forma de pagamento");
       return;
     }
 
     setLoading(true);
     try {
       const novoStatus = data.tipo === 'os' ? 'entregue' : 'aprovado';
       const finalFormaPagamento = isReceberDepois ? 'fiado' : formaPagamento;
 
       // 1. Atualizar status da OS/Orçamento
       const table = data.tipo === 'os' ? 'ordens_servico' : 'orcamentos';
       const { error: updateErr } = await supabase
         .from(table)
         .update({ status: novoStatus } as any)
         .eq('id', data.id);
       
       if (updateErr) throw updateErr;
 
       // 2. Inserir em contas
       const { error: contaErr } = await supabase.from('contas').insert({
         company_id: companyId,
         descricao: `${data.numero} - ${data.cliente_nome}`,
         valor: totalFinal,
         vencimento: new Date().toISOString().split('T')[0],
         tipo: 'receber',
         categoria: data.tipo === 'os' ? 'Serviços' : 'Orçamentos',
         status: finalFormaPagamento === 'fiado' ? 'pendente' : 'recebido',
         forma_pagamento: finalFormaPagamento,
       } as any);
 
       if (contaErr) throw contaErr;
 
       // 3. Se não for fiado, lançar na tabela de vendas (que integra com o Caixa)
       if (finalFormaPagamento !== 'fiado') {
         if (!caixaAberto) {
             toast.warning("Pagamento registrado no financeiro, mas o caixa está fechado. A venda não foi lançada no caixa.");
         } else {
             // Criar a venda vinculada ao caixa
             const { data: venda, error: vendaErr } = await supabase.from('vendas').insert({
                 company_id: companyId,
                 caixa_id: caixaAberto.id,
                 cliente_id: data.cliente_id,
                 forma_pagamento: finalFormaPagamento,
                 valor_total: totalFinal,
                 observacoes: observacao || `Recebimento ${data.numero}`,
                 ordem_servico_id: data.tipo === 'os' ? data.id : null,
                 orcamento_id: data.tipo === 'orcamento' ? data.id : null,
                 origem: data.tipo
             } as any).select().single();
 
             if (vendaErr) throw vendaErr;
 
             // Se houver itens, detalhar na venda
             if (data.items && data.items.length > 0) {
                 const vendaItens = data.items.map(item => ({
                     company_id: companyId,
                     venda_id: venda.id,
                     peca_id: item.peca_id,
                     quantidade: item.quantidade,
                     valor_unitario: item.valor_unitario
                 }));
                 await supabase.from('venda_itens').insert(vendaItens);
             }
         }
       }
 
       // 4. Baixa no estoque
       if (data.items) {
           for (const item of data.items) {
               const { data: currentPeca } = await supabase.from('pecas').select('quantidade').eq('id', item.peca_id).single();
               if (currentPeca) {
                   const novaQtd = (currentPeca.quantidade || 0) - (item.quantidade || 0);
                   await supabase.from('pecas').update({ quantidade: novaQtd }).eq('id', item.peca_id);
               }
           }
       }
 
       // 5. Invalidar caches
       queryClient.invalidateQueries({ queryKey: ['ordens_servico'] });
       queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
       queryClient.invalidateQueries({ queryKey: ['contas'] });
       queryClient.invalidateQueries({ queryKey: ['vendas_caixa'] });
       queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
       queryClient.invalidateQueries({ queryKey: ['pecas'] });
 
       toast.success(isReceberDepois ? "OS finalizada e conta a receber gerada!" : "Pagamento recebido com sucesso!");
       onSuccess();
       onClose();
     } catch (err: any) {
       console.error(err);
       toast.error("Erro ao processar recebimento: " + err.message);
     } finally {
       setLoading(false);
     }
   };
 
   return (
     <Dialog open={isOpen} onOpenChange={onClose}>
       <DialogContent className="max-w-md">
         <DialogHeader>
           <DialogTitle>Receber Pagamento</DialogTitle>
         </DialogHeader>
 
         <div className="space-y-4 py-2">
           <div className="bg-muted/50 p-4 rounded-lg space-y-1">
             <div className="flex justify-between text-sm">
               <span className="text-muted-foreground">{data.tipo === 'os' ? 'OS' : 'Orçamento'}:</span>
               <span className="font-medium">{data.numero}</span>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-muted-foreground">Cliente:</span>
               <span className="font-medium">{data.cliente_nome}</span>
             </div>
             <div className="pt-2 mt-2 border-t flex justify-between">
               <span className="text-muted-foreground">Mão de obra:</span>
               <span>R$ {data.valor_mao_obra.toFixed(2)}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-muted-foreground">Peças:</span>
               <span>R$ {data.valor_pecas.toFixed(2)}</span>
             </div>
             <div className="pt-2 mt-2 border-t flex justify-between font-bold text-lg">
               <span>Total:</span>
               <span className="text-primary">R$ {totalFinal.toFixed(2)}</span>
             </div>
           </div>
 
           <div className="space-y-3">
             <div className="space-y-1">
               <Label>Forma de Pagamento *</Label>
               <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione..." />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="dinheiro">Dinheiro</SelectItem>
                   <SelectItem value="pix">PIX</SelectItem>
                   <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                   <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                   <SelectItem value="transferencia">Transferência</SelectItem>
                   <SelectItem value="fiado">Fiado (Receber Depois)</SelectItem>
                 </SelectContent>
               </Select>
             </div>
 
             <div className="space-y-1">
               <Label>Desconto (R$)</Label>
               <Input 
                 type="number" 
                 value={desconto} 
                 onChange={(e) => setDesconto(Number(e.target.value))} 
                 placeholder="0.00"
               />
             </div>
 
             <div className="space-y-1">
               <Label>Observação (opcional)</Label>
               <Textarea 
                 value={observacao} 
                 onChange={(e) => setObservacao(e.target.value)}
                 placeholder="Notas sobre o pagamento..."
                 className="h-20"
               />
             </div>
           </div>
         </div>
 
         <DialogFooter className="flex-col sm:flex-row gap-2">
           <Button 
             variant="outline" 
             className="w-full sm:w-auto"
             onClick={() => handleConfirmar(true)}
             disabled={loading}
           >
             Receber Depois
           </Button>
           <Button 
             className="w-full sm:w-auto"
             onClick={() => handleConfirmar(false)}
             disabled={loading || (!formaPagamento && !loading)}
           >
             {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Confirmar Recebimento"}
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 }