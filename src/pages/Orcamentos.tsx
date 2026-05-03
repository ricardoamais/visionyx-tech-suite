 import { useState, useCallback } from "react";
 import { useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Edit, Trash2, Loader2, Printer, ArrowRight, CheckCircle } from "lucide-react";
  import { useOrcamentos, useCreateOrcamento, useUpdateOrcamento } from "@/hooks/useOrcamentos";
  import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
 import { ModalRecebimento } from "@/components/ModalRecebimento";
import { useCreateOS } from "@/hooks/useOrdensServico";
import { useClientes } from "@/hooks/useClientes";
import { useCreateConta } from "@/hooks/useContas";
import { useEmpresaConfig } from "@/hooks/useEmpresaConfig";
import { printOrcamento } from "@/components/PrintOS";
  import { toast } from "sonner";
  import { supabase } from "@/integrations/supabase/client";
 import { QuickAddCliente } from "@/components/QuickAddCliente";

const statusMap: Record<string, string> = { pendente: "Pendente", aprovado: "Aprovado", reprovado: "Reprovado" };

const emptyItem = { descricao: "", quantidade: 1, valor_unitario: 0 };

const orcamentoSchema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente"),
  observacoes: z.string().optional(),
  status: z.enum(["pendente", "aprovado", "reprovado"]),
  itens: z.array(z.object({
    descricao: z.string().min(1, "Descrição obrigatória"),
    quantidade: z.number().min(1),
    valor_unitario: z.number().min(0),
  })).min(1, "Adicione pelo menos um item"),
});

type OrcamentoFormValues = z.infer<typeof orcamentoSchema>;

export default function Orcamentos() {
   const queryClient = useQueryClient();
   const { data: orcamentos, isLoading } = useOrcamentos();
   const { data: clientes, refetch: refetchClientes } = useClientes();
   const createOrc = useCreateOrcamento();
   const updateOrc = useUpdateOrcamento();
 
   const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; numero: string }>({ open: false, id: "", numero: "" });
   const [isDeleting, setIsDeleting] = useState(false);
 
   const handleDelete = async (id: string, numero: string) => {
     try {
       setIsDeleting(true);
       const { error } = await supabase.functions.invoke('delete-orcamento', {
         body: { orcId: id }
       });
       
       if (error) throw error;
 
       toast.success(`Orçamento ${numero} excluído com sucesso`);
       queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
       queryClient.invalidateQueries({ queryKey: ['contas'] });
       queryClient.invalidateQueries({ queryKey: ['vendas_caixa'] });
       queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
       queryClient.invalidateQueries({ queryKey: ['relatorios'] });
       setDeleteModal({ open: false, id: "", numero: "" });
     } catch (err: any) {
       console.error(err);
       toast.error('Erro ao excluir orçamento: ' + (err.message || 'Erro desconhecido'));
     } finally {
       setIsDeleting(false);
     }
   };
  const createOS = useCreateOS();
  const createConta = useCreateConta();
  const { data: empresa } = useEmpresaConfig();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
   const [viewing, setViewing] = useState<any>(null);
   const [editing, setEditing] = useState<any>(null);
   const [recebimentoData, setRecebimentoData] = useState<any>(null);

  const form = useForm<OrcamentoFormValues>({
    resolver: zodResolver(orcamentoSchema),
    defaultValues: { cliente_id: "", observacoes: "", status: "pendente", itens: [{ descricao: "", quantidade: 1, valor_unitario: 0 }] },
  });

  const { fields: itensFields, append, remove } = useFieldArray({ control: form.control, name: "itens" });
  const watchItens = form.watch("itens");
  const valorTotal = watchItens?.reduce((s, i) => s + (i.quantidade || 0) * (i.valor_unitario || 0), 0) || 0;

  const filtered = (orcamentos ?? []).filter(o =>
    o.numero?.toLowerCase().includes(search.toLowerCase()) || (o as any).clientes?.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = useCallback(() => {
    form.reset({ cliente_id: "", observacoes: "", status: "pendente", itens: [{ descricao: "", quantidade: 1, valor_unitario: 0 }] });
    setEditing(null);
  }, [form]);

  const handlePrint = (o: any) => {
    const items = (o.orcamento_itens ?? []).map((i: any) => ({ descricao: i.descricao, quantidade: i.quantidade, valor_unitario: i.valor_unitario }));
    printOrcamento({
      numero: o.numero, data: o.created_at, cliente: o.clientes?.nome ?? "—",
      itens: items, valorTotal: Number(o.valor_total), status: statusMap[o.status] ?? o.status,
      observacoes: o.observacoes, empresa,
    });
  };

  const handleGenerateOS = (o: any) => {
    if (o.status !== "aprovado") { toast.error("Apenas orçamentos aprovados podem gerar OS."); return; }
    createOS.mutate({
      cliente_id: o.cliente_id, problema_relatado: "Gerado a partir do Orçamento " + o.numero,
      observacoes: o.observacoes, status: "aberto", valor_mao_obra: Number(o.valor_total), valor_pecas: 0,
      servicos: (o.orcamento_itens || []).map((i: any) => ({ descricao: i.descricao, quantidade: i.quantidade, valor_unitario: i.valor_unitario })),
    } as any, { onSuccess: () => toast.success("Ordem de Serviço gerada com sucesso!") });
  };

  const handleSave = form.handleSubmit((values) => {
    if (editing) {
      if (editing.status === "aprovado") { toast.error("Orçamentos aprovados não podem ser editados."); return; }
      updateOrc.mutate({ id: editing.id, ...values, valor_total: valorTotal } as any, { onSuccess: () => { setDialogOpen(false); resetForm(); } });
    } else {
      createOrc.mutate(values as any, {
        onSuccess: (data) => {
          setDialogOpen(false);
          const clienteNome = clientes?.find(c => c.id === values.cliente_id)?.nome ?? "";
          printOrcamento({
            numero: data.numero, data: data.created_at, cliente: clienteNome,
            itens: values.itens as any, valorTotal, status: statusMap[data.status] ?? data.status,
            observacoes: data.observacoes ?? undefined, empresa,
          });
          resetForm();
        },
      });
    }
  });

   const handleMarcarRecebido = (o: any) => {
     const valorTotal = Number(o.valor_total);
     if (valorTotal <= 0) { toast.error("Orçamento sem valor para registrar"); return; }
     
     setRecebimentoData({
       id: o.id,
       numero: o.numero,
       cliente_id: o.cliente_id,
       cliente_nome: (o as any).clientes?.nome || "Cliente",
       valor_mao_obra: valorTotal, // No orçamento simplificado, usamos o total como mao de obra no modal
       valor_pecas: 0,
       tipo: 'orcamento',
       items: (o as any).orcamento_itens || []
     });
   };

  const handleEdit = (o: any) => {
    if (o.status === "aprovado") { toast.error("Orçamentos aprovados não podem ser editados."); return; }
    setEditing(null);
    requestAnimationFrame(() => {
      setEditing(o);
      form.reset({ cliente_id: o.cliente_id, observacoes: o.observacoes ?? "", status: o.status, itens: (o.orcamento_itens || []).map((i: any) => ({ descricao: i.descricao, quantidade: i.quantidade, valor_unitario: i.valor_unitario })) });
      refetchClientes();
      setDialogOpen(true);
    });
  };

  const isSaving = createOrc.isPending || updateOrc.isPending;

   return (
     <div className="space-y-6">
       {recebimentoData && (
         <ModalRecebimento 
           isOpen={!!recebimentoData}
           onClose={() => setRecebimentoData(null)}
           onSuccess={() => {
             setRecebimentoData(null);
             // Opcional: fechar outros dialogs ou recarregar
           }}
           data={recebimentoData}
         />
       )}
      <PageHeader title="Orçamentos" description="Gerencie orçamentos para clientes">
        <Button onClick={() => { resetForm(); refetchClientes(); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Novo Orçamento
        </Button>
      </PageHeader>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={handleSave} className="grid gap-4 py-2">
               <FormField control={form.control} name="cliente_id" render={({ field }) => (
                 <FormItem>
                   <FormLabel>Cliente *</FormLabel>
                   <div className="flex gap-2">
                     <Select onValueChange={field.onChange} value={field.value}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue placeholder="Selecione o cliente" />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         {(clientes ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                       </SelectContent>
                     </Select>
                     <QuickAddCliente onSuccess={(id) => field.onChange(id)} />
                   </div>
                   <FormMessage />
                 </FormItem>
               )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="reprovado">Reprovado</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <div className="space-y-3">
                <div className="flex items-center justify-between"><Label>Itens</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ descricao: "", quantidade: 1, valor_unitario: 0 })}><Plus className="w-3 h-3 mr-1" />Adicionar</Button>
                </div>
                {itensFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_60px_80px_30px] gap-2 items-end">
                    <Input placeholder="Descrição" {...form.register(`itens.${index}.descricao`)} />
                    <Input type="number" placeholder="Qtd" {...form.register(`itens.${index}.quantidade`, { valueAsNumber: true })} />
                    <Input type="number" placeholder="R$" {...form.register(`itens.${index}.valor_unitario`, { valueAsNumber: true })} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                ))}
                <p className="text-sm font-medium text-right">Total: R$ {valorTotal.toFixed(2)}</p>
              </div>
              <FormField control={form.control} name="observacoes" render={({ field }) => (
                <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? "Salvar" : "Criar e Imprimir"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por número ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
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
                      <TableCell>{(o as any).clientes?.nome ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[250px] truncate">
                        {(o as any).orcamento_itens?.map((i: any) => i.descricao).join(", ") || "—"}
                      </TableCell>
                      <TableCell className="font-medium">R$ {Number(o.valor_total).toFixed(2)}</TableCell>
                      <TableCell><StatusBadge status={statusMap[o.status] ?? o.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {o.status === "aprovado" && (
                            <Button variant="ghost" size="icon" title="Marcar como Recebido" onClick={() => handleMarcarRecebido(o)}>
                              <CheckCircle className="w-4 h-4 text-success" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Imprimir" onClick={() => handlePrint(o)}><Printer className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(o)}><Edit className="w-4 h-4" /></Button>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             onClick={() => setDeleteModal({ open: true, id: o.id, numero: o.numero })}
                           >
                             <Trash2 className="w-4 h-4 text-destructive" />
                           </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum orçamento encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes do {viewing?.numero}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="grid gap-3 text-sm">
              <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{viewing.clientes?.nome}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={statusMap[viewing.status] ?? viewing.status} /></div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={() => handlePrint(viewing)}>
                  <Printer className="w-4 h-4 mr-2" />Imprimir Orçamento
                </Button>
                {viewing.status === "aprovado" && (
                  <>
                    <Button onClick={() => { handleMarcarRecebido(viewing); setViewDialog(false); }}>
                      <CheckCircle className="w-4 h-4 mr-2" />Marcar Recebido
                    </Button>
                    <Button variant="secondary" onClick={() => { handleGenerateOS(viewing); setViewDialog(false); }}>
                      <ArrowRight className="w-4 h-4 mr-2" />Gerar OS
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
       </Dialog>
 
       <DeleteConfirmationModal
         isOpen={deleteModal.open}
         onClose={() => setDeleteModal({ ...deleteModal, open: false })}
         onConfirm={() => handleDelete(deleteModal.id, deleteModal.numero)}
         title={`⚠️ Excluir Orçamento ${deleteModal.numero}?`}
         description="Essa ação é irreversível. Todos os dados vinculados serão excluídos permanentemente: pagamentos, movimentos de caixa, itens e registros financeiros."
         isLoading={isDeleting}
       />
    </div>
  );
}
