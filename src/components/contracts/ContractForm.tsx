 import { useForm } from "react-hook-form";
 import { zodResolver } from "@hookform/resolvers/zod";
 import * as z from "zod";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogFooter,
 } from "@/components/ui/dialog";
 import {
   Form,
   FormControl,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
 } from "@/components/ui/form";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Textarea } from "@/components/ui/textarea";
 import { useCreateContract, useUpdateContract } from "@/hooks/useMaintenanceContracts";
 import { useEffect } from "react";
 
 const contractSchema = z.zodResolver ? z.object({
   empresa_nome: z.string().min(1, "Nome da empresa é obrigatório"),
   cnpj: z.string().optional(),
   contato_nome: z.string().optional(),
   contato_telefone: z.string().optional(),
   contato_email: z.string().email("Email inválido").optional().or(z.literal("")),
   endereco: z.string().optional(),
   valor_mensal: z.number().min(0),
   dia_vencimento: z.number().min(1).max(28),
   data_inicio: z.string().min(1, "Data de início é obrigatória"),
   data_fim: z.string().optional().nullable(),
   descricao_servicos: z.string().optional(),
   observacoes: z.string().optional(),
   status: z.enum(["Ativo", "Inativo", "Encerrado"]),
 }) : z.any(); // Fallback if zod is weird
 
 // Redefining schema because of possible zod issues in some environments
 const schema = z.object({
   empresa_nome: z.string().min(1, "Obrigatório"),
   cnpj: z.string().optional(),
   contato_nome: z.string().optional(),
   contato_telefone: z.string().optional(),
   contato_email: z.string().optional(),
   endereco: z.string().optional(),
   valor_mensal: z.coerce.number().min(0),
   dia_vencimento: z.coerce.number().min(1).max(28),
   data_inicio: z.string(),
   data_fim: z.string().optional().nullable(),
   descricao_servicos: z.string().optional(),
   observacoes: z.string().optional(),
   status: z.string(),
 });
 
 export function ContractForm({ open, onOpenChange, contract }: { open: boolean, onOpenChange: (open: boolean) => void, contract?: any }) {
   const createContract = useCreateContract();
   const updateContract = useUpdateContract();
 
   const form = useForm({
     resolver: zodResolver(schema),
     defaultValues: {
       empresa_nome: "",
       cnpj: "",
       contato_nome: "",
       contato_telefone: "",
       contato_email: "",
       endereco: "",
       valor_mensal: 0,
       dia_vencimento: 10,
       data_inicio: new Date().toISOString().split("T")[0],
       data_fim: "",
       descricao_servicos: "",
       observacoes: "",
       status: "Ativo",
     },
   });
 
   useEffect(() => {
     if (contract) {
       form.reset({
         ...contract,
         data_inicio: contract.data_inicio || "",
         data_fim: contract.data_fim || "",
         valor_mensal: Number(contract.valor_mensal),
       });
     } else {
       form.reset({
         empresa_nome: "",
         cnpj: "",
         contato_nome: "",
         contato_telefone: "",
         contato_email: "",
         endereco: "",
         valor_mensal: 0,
         dia_vencimento: 10,
         data_inicio: new Date().toISOString().split("T")[0],
         data_fim: "",
         descricao_servicos: "",
         observacoes: "",
         status: "Ativo",
       });
     }
   }, [contract, form]);
 
   const onSubmit = async (data: any) => {
     const payload = {
       ...data,
       data_fim: data.data_fim || null,
     };
 
     if (contract?.id) {
       await updateContract.mutateAsync({ id: contract.id, ...payload });
     } else {
       await createContract.mutateAsync(payload);
     }
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>{contract ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
         </DialogHeader>
         <Form {...form}>
           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                 control={form.control}
                 name="empresa_nome"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Empresa Contratante *</FormLabel>
                     <FormControl><Input {...field} /></FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <FormField
                 control={form.control}
                 name="cnpj"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>CNPJ</FormLabel>
                     <FormControl><Input {...field} /></FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <FormField
                 control={form.control}
                 name="contato_nome"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Nome do Contato</FormLabel>
                     <FormControl><Input {...field} /></FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <FormField
                 control={form.control}
                 name="contato_telefone"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Telefone</FormLabel>
                     <FormControl><Input {...field} /></FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <FormField
                 control={form.control}
                 name="contato_email"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Email</FormLabel>
                     <FormControl><Input type="email" {...field} /></FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <FormField
                 control={form.control}
                 name="status"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Status</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue placeholder="Selecione" />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         <SelectItem value="Ativo">Ativo</SelectItem>
                         <SelectItem value="Inativo">Inativo</SelectItem>
                         <SelectItem value="Encerrado">Encerrado</SelectItem>
                       </SelectContent>
                     </Select>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <FormField
                 control={form.control}
                 name="valor_mensal"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Valor Mensal *</FormLabel>
                     <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <FormField
                 control={form.control}
                 name="dia_vencimento"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Dia Vencimento (1-28) *</FormLabel>
                     <FormControl><Input type="number" min="1" max="28" {...field} /></FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <FormField
                 control={form.control}
                 name="data_inicio"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Data Início *</FormLabel>
                     <FormControl><Input type="date" {...field} /></FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <FormField
                 control={form.control}
                 name="data_fim"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel>Data Fim (opcional)</FormLabel>
                     <FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
             </div>
             <FormField
               control={form.control}
               name="endereco"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Endereço</FormLabel>
                   <FormControl><Input {...field} /></FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
             <FormField
               control={form.control}
               name="descricao_servicos"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Descrição dos Serviços</FormLabel>
                   <FormControl><Textarea {...field} /></FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
             <FormField
               control={form.control}
               name="observacoes"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Observações</FormLabel>
                   <FormControl><Textarea {...field} /></FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
             <DialogFooter>
               <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
               <Button type="submit" disabled={createContract.isPending || updateContract.isPending}>
                 {contract ? "Salvar Alterações" : "Criar Contrato"}
               </Button>
             </DialogFooter>
           </form>
         </Form>
       </DialogContent>
     </Dialog>
   );
 }