 import { useState } from "react";
 import {
   Drawer,
   DrawerContent,
   DrawerHeader,
   DrawerTitle,
   DrawerDescription,
 } from "@/components/ui/drawer";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { format } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { useContractPayments, useRegisterContractPayment } from "@/hooks/useMaintenanceContracts";
 import { useCaixaAberto } from "@/hooks/useCaixa";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 
 export function ContractDetails({ open, onOpenChange, contract }: { open: boolean, onOpenChange: (open: boolean) => void, contract: any }) {
   const { data: payments, isLoading } = useContractPayments(contract?.id);
   const { data: caixaAberto } = useCaixaAberto();
   const registerPayment = useRegisterContractPayment();
   const [paymentModalOpen, setPaymentModalOpen] = useState(false);
   const [paymentData, setPaymentData] = useState({
     mes_referencia: format(new Date(), "MMMM/yyyy", { locale: ptBR }),
     valor: 0,
     vencimento: "",
     forma_pagamento: "pix",
     data_pagamento: format(new Date(), "yyyy-MM-dd"),
   });
 
   const handleOpenPaymentModal = () => {
     const today = new Date();
     const vencimento = new Date(today.getFullYear(), today.getMonth(), contract.dia_vencimento);
     setPaymentData({
       mes_referencia: format(today, "MMMM/yyyy", { locale: ptBR }),
       valor: Number(contract.valor_mensal),
       vencimento: format(vencimento, "yyyy-MM-dd"),
       forma_pagamento: "pix",
       data_pagamento: format(today, "yyyy-MM-dd"),
     });
     setPaymentModalOpen(true);
   };
 
   const handleRegisterPayment = async () => {
     await registerPayment.mutateAsync({
       contrato_id: contract.id,
       empresa_nome: contract.empresa_nome,
       ...paymentData,
       caixa_id: caixaAberto?.id,
     });
     setPaymentModalOpen(false);
   };
 
   if (!contract) return null;
 
   return (
     <>
       <Drawer open={open} onOpenChange={onOpenChange}>
         <DrawerContent className="max-h-[90vh]">
           <div className="mx-auto w-full max-w-4xl overflow-y-auto p-6">
             <DrawerHeader className="px-0">
               <div className="flex justify-between items-start">
                 <div>
                   <DrawerTitle className="text-2xl font-bold">{contract.empresa_nome}</DrawerTitle>
                   <DrawerDescription>CNPJ: {contract.cnpj || "Não informado"}</DrawerDescription>
                 </div>
                 <div className="flex gap-2">
                   <Badge variant={contract.status === 'Ativo' ? 'success' : 'secondary'}>
                     {contract.status}
                   </Badge>
                   <Button onClick={handleOpenPaymentModal} size="sm">Registrar Pagamento</Button>
                 </div>
               </div>
             </DrawerHeader>
 
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
               <div className="space-y-4">
                 <h3 className="font-semibold border-b pb-2">Dados do Contrato</h3>
                 <div className="grid grid-cols-2 gap-2 text-sm">
                   <span className="text-muted-foreground">Valor Mensal:</span>
                   <span className="font-medium">R$ {Number(contract.valor_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                   <span className="text-muted-foreground">Dia Vencimento:</span>
                   <span className="font-medium">{contract.dia_vencimento}</span>
                   <span className="text-muted-foreground">Data Início:</span>
                   <span className="font-medium">{contract.data_inicio ? format(new Date(contract.data_inicio), 'dd/MM/yyyy') : '-'}</span>
                   <span className="text-muted-foreground">Data Fim:</span>
                   <span className="font-medium">{contract.data_fim ? format(new Date(contract.data_fim), 'dd/MM/yyyy') : 'Indeterminado'}</span>
                 </div>
 
                 <h3 className="font-semibold border-b pb-2 mt-6">Contato</h3>
                 <div className="grid grid-cols-2 gap-2 text-sm">
                   <span className="text-muted-foreground">Nome:</span>
                   <span className="font-medium">{contract.contato_nome || "-"}</span>
                   <span className="text-muted-foreground">Telefone:</span>
                   <span className="font-medium">{contract.contato_telefone || "-"}</span>
                   <span className="text-muted-foreground">Email:</span>
                   <span className="font-medium">{contract.contato_email || "-"}</span>
                   <span className="text-muted-foreground">Endereço:</span>
                   <span className="font-medium">{contract.endereco || "-"}</span>
                 </div>
               </div>
 
               <div className="space-y-4">
                 <h3 className="font-semibold border-b pb-2">Histórico de Pagamentos</h3>
                 <div className="max-h-[300px] overflow-y-auto border rounded-md">
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Mês</TableHead>
                         <TableHead>Valor</TableHead>
                         <TableHead>Status</TableHead>
                         <TableHead>Data Pgto</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {payments?.length === 0 ? (
                         <TableRow>
                           <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Nenhum pagamento registrado</TableCell>
                         </TableRow>
                       ) : (
                         payments?.map((pgto: any) => (
                           <TableRow key={pgto.id}>
                             <TableCell className="font-medium capitalize">{pgto.mes_referencia}</TableCell>
                             <TableCell>R$ {Number(pgto.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                             <TableCell><Badge variant="success">Pago</Badge></TableCell>
                             <TableCell>{pgto.data_pagamento ? format(new Date(pgto.data_pagamento), 'dd/MM/yyyy') : '-'}</TableCell>
                           </TableRow>
                         ))
                       )}
                     </TableBody>
                   </Table>
                 </div>
               </div>
             </div>
 
             {contract.descricao_servicos && (
               <div className="mt-8">
                 <h3 className="font-semibold border-b pb-2">Serviços Incluídos</h3>
                 <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{contract.descricao_servicos}</p>
               </div>
             )}
 
             {contract.observacoes && (
               <div className="mt-6 pb-12">
                 <h3 className="font-semibold border-b pb-2">Observações</h3>
                 <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{contract.observacoes}</p>
               </div>
             )}
           </div>
         </DrawerContent>
       </Drawer>
 
       <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Registrar Pagamento do Mês</DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label>Mês de Referência</Label>
               <Input 
                 value={paymentData.mes_referencia} 
                 onChange={e => setPaymentData({...paymentData, mes_referencia: e.target.value})}
               />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Valor</Label>
                 <Input 
                   type="number" 
                   step="0.01"
                   value={paymentData.valor} 
                   onChange={e => setPaymentData({...paymentData, valor: Number(e.target.value)})}
                 />
               </div>
               <div className="space-y-2">
                 <Label>Vencimento</Label>
                 <Input 
                   type="date" 
                   value={paymentData.vencimento} 
                   onChange={e => setPaymentData({...paymentData, vencimento: e.target.value})}
                 />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Forma de Pagamento</Label>
                 <Select 
                   value={paymentData.forma_pagamento} 
                   onValueChange={v => setPaymentData({...paymentData, forma_pagamento: v})}
                 >
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="dinheiro">Dinheiro</SelectItem>
                     <SelectItem value="pix">PIX</SelectItem>
                     <SelectItem value="cartao">Cartão</SelectItem>
                     <SelectItem value="transferencia">Transferência</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Data do Pagamento</Label>
                 <Input 
                   type="date" 
                   value={paymentData.data_pagamento} 
                   onChange={e => setPaymentData({...paymentData, data_pagamento: e.target.value})}
                 />
               </div>
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>Cancelar</Button>
             <Button onClick={handleRegisterPayment} disabled={registerPayment.isPending}>Confirmar Pagamento</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </>
   );
 }