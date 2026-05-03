 import { useState } from "react";
 import { useMaintenanceContracts, useDeleteContract } from "@/hooks/useMaintenanceContracts";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { 
   Building, Plus, Search, MoreVertical, Eye, Edit, Trash, 
   TrendingUp, Calendar, AlertCircle, Clock 
 } from "lucide-react";
 import { format, isAfter, isBefore, addDays, startOfMonth, endOfMonth } from "date-fns";
 import { ContractForm } from "@/components/contracts/ContractForm";
 import { ContractDetails } from "@/components/contracts/ContractDetails";
 import { 
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from "@/components/ui/alert-dialog";
 
 export default function Contratos() {
   const { data: contracts, isLoading } = useMaintenanceContracts();
   const deleteContract = useDeleteContract();
   const [search, setSearch] = useState("");
   const [formOpen, setFormOpen] = useState(false);
   const [detailsOpen, setDetailsOpen] = useState(false);
   const [selectedContract, setSelectedContract] = useState<any>(null);
   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
 
   const filteredContracts = contracts?.filter(c => 
     c.empresa_nome.toLowerCase().includes(search.toLowerCase()) ||
     c.cnpj?.includes(search)
   );
 
   const stats = {
     total: contracts?.filter(c => c.status === 'Ativo').length || 0,
     revenue: contracts?.filter(c => c.status === 'Ativo').reduce((acc, c) => acc + Number(c.valor_mensal), 0) || 0,
     expired: 0, // Simplified logic: would need to check last payment
     upcoming: contracts?.filter(c => {
       if (c.status !== 'Ativo') return false;
       const today = new Date();
       const vencimentoDia = c.dia_vencimento;
       const vencimentoEsteMes = new Date(today.getFullYear(), today.getMonth(), vencimentoDia);
       const diff = Math.ceil((vencimentoEsteMes.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
       return diff >= 0 && diff <= 7;
     }).length || 0,
   };
 
   const handleDelete = async () => {
     if (selectedContract) {
       await deleteContract.mutateAsync(selectedContract.id);
       setDeleteDialogOpen(false);
       setSelectedContract(null);
     }
   };
 
   const getStatusBadge = (status: string) => {
     switch (status) {
       case 'Ativo': return <Badge variant="success">Ativo</Badge>;
       case 'Inativo': return <Badge variant="secondary">Inativo</Badge>;
       case 'Encerrado': return <Badge variant="destructive">Encerrado</Badge>;
       default: return <Badge variant="outline">{status}</Badge>;
     }
   };
 
   return (
     <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
           <h1 className="text-3xl font-bold tracking-tight">Contratos de Manutenção</h1>
           <p className="text-muted-foreground text-sm">Gerencie seus contratos mensais de TI e serviços.</p>
         </div>
         <Button onClick={() => { setSelectedContract(null); setFormOpen(true); }} className="gap-2">
           <Plus className="w-4 h-4" /> Novo Contrato
         </Button>
       </div>
 
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <Card>
           <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
             <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
             <Building className="w-4 h-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{stats.total}</div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
             <CardTitle className="text-sm font-medium">Receita Mensal (MRR)</CardTitle>
             <TrendingUp className="w-4 h-4 text-emerald-500" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-emerald-600">
               R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
             </div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
             <CardTitle className="text-sm font-medium">Vencidos (Mês)</CardTitle>
             <AlertCircle className="w-4 h-4 text-destructive" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">0</div>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
             <CardTitle className="text-sm font-medium">A vencer (7 dias)</CardTitle>
             <Clock className="w-4 h-4 text-amber-500" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{stats.upcoming}</div>
           </CardContent>
         </Card>
       </div>
 
       <Card>
         <CardHeader>
           <div className="flex items-center gap-4">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input 
                 placeholder="Buscar por empresa ou CNPJ..." 
                 className="pl-9" 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
             </div>
           </div>
         </CardHeader>
         <CardContent>
           <div className="rounded-md border overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Empresa</TableHead>
                   <TableHead>Valor Mensal</TableHead>
                   <TableHead>Vencimento</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead className="text-right">Ações</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {isLoading ? (
                   <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
                 ) : filteredContracts?.length === 0 ? (
                   <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum contrato encontrado</TableCell></TableRow>
                 ) : (
                   filteredContracts?.map((contract) => (
                     <TableRow key={contract.id}>
                       <TableCell>
                         <div className="font-medium">{contract.empresa_nome}</div>
                         <div className="text-xs text-muted-foreground">{contract.cnpj || "Sem CNPJ"}</div>
                       </TableCell>
                       <TableCell>R$ {Number(contract.valor_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                       <TableCell>Dia {contract.dia_vencimento}</TableCell>
                       <TableCell>{getStatusBadge(contract.status)}</TableCell>
                       <TableCell className="text-right">
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem onClick={() => { setSelectedContract(contract); setDetailsOpen(true); }}>
                               <Eye className="w-4 h-4 mr-2" /> Detalhes
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => { setSelectedContract(contract); setFormOpen(true); }}>
                               <Edit className="w-4 h-4 mr-2" /> Editar
                             </DropdownMenuItem>
                             <DropdownMenuItem 
                               className="text-destructive"
                               onClick={() => { setSelectedContract(contract); setDeleteDialogOpen(true); }}
                             >
                               <Trash className="w-4 h-4 mr-2" /> Excluir
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           </div>
         </CardContent>
       </Card>
 
       <ContractForm 
         open={formOpen} 
         onOpenChange={setFormOpen} 
         contract={selectedContract} 
       />
 
       <ContractDetails 
         open={detailsOpen} 
         onOpenChange={setDetailsOpen} 
         contract={selectedContract} 
       />
 
       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Excluir Contrato?</AlertDialogTitle>
             <AlertDialogDescription>
               Deseja realmente excluir o contrato da empresa <strong>{selectedContract?.empresa_nome}</strong>? 
               Isso não removerá os pagamentos já registrados no financeiro.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancelar</AlertDialogCancel>
             <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
               Confirmar Exclusão
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 }