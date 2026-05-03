 import { useState, useCallback, useEffect } from "react";
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
import { Plus, Search, Eye, Edit, Trash2, Loader2, Printer, CheckCircle } from "lucide-react";
  import { useOrdensServico, useCreateOS, useUpdateOS } from "@/hooks/useOrdensServico";
  import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
 import { ModalRecebimento } from "@/components/ModalRecebimento";
import { usePecas } from "@/hooks/usePecas";
import { useServicosCatalogo } from "@/hooks/useServicosCatalogo";
import { useCreateConta } from "@/hooks/useContas";
import { useAuth } from "@/contexts/AuthContext";
const osSchema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente"),
  equipamento_id: z.string().optional().nullable(),
  problema_relatado: z.string().optional(),
  diagnostico: z.string().optional(),
  servicos_realizados: z.string().optional(),
  valor_mao_obra: z.number().min(0),
  valor_pecas: z.number().min(0),
  status: z.string(),
  observacoes: z.string().optional(),
  pecas: z.array(z.object({
    peca_id: z.string(),
    quantidade: z.number().min(1),
    valor_unitario: z.number().min(0),
  })).default([]),
  servicos: z.array(z.object({
    descricao: z.string().min(1),
    quantidade: z.number().min(1),
    valor_unitario: z.number().min(0),
    servico_catalogo_id: z.string().optional(),
  })).default([]),
});

type OSFormValues = z.infer<typeof osSchema>;

import { useClientes } from "@/hooks/useClientes";

import { useEmpresaConfig } from "@/hooks/useEmpresaConfig";
import { printOS } from "@/components/PrintOS";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
 import { useOSFotos, useAddOSFoto, useDeleteOSFoto, fetchOSFotos } from "@/hooks/useOSFotos";
 import { QuickAddCliente } from "@/components/QuickAddCliente";

const statusOptions = [
  { value: "aberto", label: "Aberto" },
  { value: "em_analise", label: "Em análise" },
  { value: "aguardando_aprovacao", label: "Aguardando aprovação" },
  { value: "em_manutencao", label: "Em manutenção" },
  { value: "finalizado", label: "Finalizado" },
  { value: "entregue", label: "Entregue" },
];

const statusLabel = (val: string) => statusOptions.find(s => s.value === val)?.label ?? val;

const emptyForm = {
  cliente_id: "", problema_relatado: "", diagnostico: "", servicos_realizados: "",
  valor_mao_obra: 0, valor_pecas: 0, status: "aberto" as string, observacoes: "",
  foto_url: "" as string,
};

export default function OrdensServico() {
   const queryClient = useQueryClient();
   const { data: ordens, isLoading } = useOrdensServico();
   const { data: clientes, refetch: refetchClientes } = useClientes();
   const createOS = useCreateOS();
   const updateOS = useUpdateOS();
 
   const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; numero: string }>({ open: false, id: "", numero: "" });
   const [isDeleting, setIsDeleting] = useState(false);
 
   const handleDelete = async (id: string, numero: string) => {
     try {
       setIsDeleting(true);
       const { error } = await supabase.functions.invoke('delete-ordem-servico', {
         body: { osId: id }
       });
       
       if (error) throw error;
 
       toast.success(`OS ${numero} excluída com sucesso`);
       queryClient.invalidateQueries({ queryKey: ['ordens_servico'] });
       queryClient.invalidateQueries({ queryKey: ['contas'] });
       queryClient.invalidateQueries({ queryKey: ['vendas_caixa'] });
       queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
       queryClient.invalidateQueries({ queryKey: ['relatorios'] });
       setDeleteModal({ open: false, id: "", numero: "" });
     } catch (err: any) {
       console.error(err);
       toast.error('Erro ao excluir OS: ' + (err.message || 'Erro desconhecido'));
     } finally {
       setIsDeleting(false);
     }
   };
  const { data: empresa } = useEmpresaConfig();
  const { role } = useAuth();
  const { data: pecasData } = usePecas();
  const { data: servicosCatalogo } = useServicosCatalogo();
  const createConta = useCreateConta();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogMode, setDialogMode] = useState<null | "create" | "edit">(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
   const [editing, setEditing] = useState<any>(null);
   const [uploading, setUploading] = useState(false);
   const [legendaUpload, setLegendaUpload] = useState("");
   const [recebimentoData, setRecebimentoData] = useState<any>(null);

  const form = useForm<OSFormValues>({
    resolver: zodResolver(osSchema),
    defaultValues: {
      cliente_id: "", status: "aberto", valor_mao_obra: 0, valor_pecas: 0,
      pecas: [], servicos: [],
    },
  });

  const { fields: pecasFields, append: appendPeca, remove: removePeca } = useFieldArray({ control: form.control, name: "pecas" });
  const { fields: servicosFields, append: appendServico, remove: removeServico } = useFieldArray({ control: form.control, name: "servicos" });

  const watchPecas = form.watch("pecas");
  const watchServicos = form.watch("servicos");

  useEffect(() => {
    const totalPecas = watchPecas.reduce((acc, p) => acc + (p.quantidade * p.valor_unitario), 0);
    const totalServicos = watchServicos.reduce((acc, s) => acc + (s.quantidade * s.valor_unitario), 0);
    form.setValue("valor_pecas", totalPecas);
    form.setValue("valor_mao_obra", totalServicos);
  }, [watchPecas, watchServicos, form]);

  const { data: fotosEdit } = useOSFotos(editing?.id);
  const { data: fotosView } = useOSFotos(viewing?.id);
  const addFoto = useAddOSFoto();
  const deleteFoto = useDeleteOSFoto();

  const filtered = (ordens ?? []).filter(o => {
    const matchSearch = o.numero?.toLowerCase().includes(search.toLowerCase()) || (o as any).clientes?.nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const resetForm = useCallback(() => {
    form.reset({
      cliente_id: "", status: "aberto", valor_mao_obra: 0, valor_pecas: 0,
      pecas: [], servicos: [], problema_relatado: "", diagnostico: "", servicos_realizados: "", observacoes: "",
    });
    setEditing(null);
  }, [form]);

  const openCreate = useCallback(() => { resetForm(); setDialogMode("create"); refetchClientes(); }, [refetchClientes, resetForm]);
  const closeDialog = useCallback(() => { setDialogMode(null); resetForm(); }, [resetForm]);

  const handlePrint = async (o: any) => {
    let fotos: { url: string; legenda?: string | null }[] = [];
    try { fotos = (await fetchOSFotos(o.id)).map(f => ({ url: f.url, legenda: f.legenda })); } catch {}
    printOS({
      numero: o.numero, data: o.data_entrada, cliente: o.clientes?.nome ?? "—",
      problema: o.problema_relatado, diagnostico: o.diagnostico,
      servicos: o.servicos_realizados, valorMaoObra: Number(o.valor_mao_obra),
      valorPecas: Number(o.valor_pecas), status: statusLabel(o.status), observacoes: o.observacoes,
      empresa, fotoUrl: o.foto_url, fotos,
    });
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("os-fotos").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("os-fotos").getPublicUrl(path);
      if (editing) {
        await addFoto.mutateAsync({ ordem_servico_id: editing.id, url: data.publicUrl, legenda: legendaUpload || undefined });
        setLegendaUpload("");
        toast.success("Foto adicionada!");
      }
    } catch (e: any) { toast.error("Erro ao enviar foto: " + e.message); } finally { setUploading(false); }
  };

  const statusOrder = ["aberto", "em_analise", "aguardando_aprovacao", "em_manutencao", "finalizado", "entregue"];

  const handleSave = form.handleSubmit(async (values) => {
    const currentStatusIdx = editing ? statusOrder.indexOf(editing.status) : -1;
    const newStatusIdx = statusOrder.indexOf(values.status);

    if (editing && role !== "admin" && newStatusIdx < currentStatusIdx) {
      toast.error("Apenas administradores podem retroceder o status.");
      return;
    }

    if (values.status === "finalizado" || values.status === "entregue") {
      if (!values.diagnostico || !values.servicos_realizados) {
        toast.error("Diagnóstico e serviços realizados são obrigatórios para finalizar.");
        return;
      }
    }

     if (editing) {
       const isFinalizing = (values.status === "finalizado" || values.status === "entregue") && 
                            (editing.status !== "finalizado" && editing.status !== "entregue");
       
       if (isFinalizing) {
         setRecebimentoData({
           id: editing.id,
           numero: editing.numero,
           cliente_id: values.cliente_id,
           cliente_nome: clientes?.find(c => c.id === values.cliente_id)?.nome || "Cliente",
           valor_mao_obra: values.valor_mao_obra,
           valor_pecas: values.valor_pecas,
           tipo: 'os',
           items: values.pecas
         });
         return;
       }
 
       updateOS.mutate({ id: editing.id, ...values } as any, {
         onSuccess: () => closeDialog()
       });
     } else {
      const clienteNome = clientes?.find(c => c.id === values.cliente_id)?.nome ?? "";
      closeDialog();
      createOS.mutate(values as any, {
        onSuccess: async (data) => {
          const fotos = (await fetchOSFotos(data.id)).map(f => ({ url: f.url, legenda: f.legenda }));
          printOS({
            numero: data.numero, data: data.data_entrada, cliente: clienteNome,
            problema: data.problema_relatado ?? undefined, diagnostico: data.diagnostico ?? undefined,
            servicos: data.servicos_realizados ?? undefined, valorMaoObra: Number(data.valor_mao_obra),
            valorPecas: Number(data.valor_pecas), status: statusLabel(data.status), observacoes: data.observacoes ?? undefined,
            empresa, fotoUrl: (data as any).foto_url, fotos,
          });
        },
      });
    }
  });

  const handleEdit = useCallback((o: any) => {
    setEditing(null);
    requestAnimationFrame(() => {
      setEditing(o);
      form.reset({
        cliente_id: o.cliente_id, equipamento_id: o.equipamento_id,
        problema_relatado: o.problema_relatado ?? "", diagnostico: o.diagnostico ?? "",
        servicos_realizados: o.servicos_realizados ?? "", valor_mao_obra: o.valor_mao_obra ?? 0,
        valor_pecas: o.valor_pecas ?? 0, status: o.status ?? "aberto", observacoes: o.observacoes ?? "",
        pecas: (o.os_pecas || []).map((p: any) => ({ peca_id: p.peca_id, quantidade: p.quantidade, valor_unitario: p.valor_unitario })),
        servicos: (o.os_servicos || []).map((s: any) => ({ descricao: s.descricao, quantidade: s.quantidade, valor_unitario: s.valor_unitario, servico_catalogo_id: s.servico_catalogo_id })),
      });
      setDialogMode("edit");
      refetchClientes();
    });
  }, [refetchClientes, form]);

  const isSaving = createOS.isPending || updateOS.isPending;

   return (
     <div className="space-y-6">
       {recebimentoData && (
         <ModalRecebimento 
           isOpen={!!recebimentoData}
           onClose={() => setRecebimentoData(null)}
           onSuccess={() => {
             setRecebimentoData(null);
             closeDialog();
           }}
           data={recebimentoData}
         />
       )}
      <PageHeader title="Ordens de Serviço" description="Gerencie todas as ordens de serviço">
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Nova OS</Button>
      </PageHeader>

      <Dialog open={dialogMode !== null} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar OS" : "Nova Ordem de Serviço"}</DialogTitle></DialogHeader>
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
                      <SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="problema_relatado" render={({ field }) => (
                  <FormItem><FormLabel>Problema Relatado</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="diagnostico" render={({ field }) => (
                  <FormItem><FormLabel>Diagnóstico</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="servicos_realizados" render={({ field }) => (
                  <FormItem><FormLabel>Serviços Realizados (Resumo)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="border rounded-md p-3 space-y-3">
                  <div className="flex items-center justify-between"><Label className="text-sm font-bold">Serviços Detalhados</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendServico({ descricao: "", quantidade: 1, valor_unitario: 0 })}><Plus className="w-3 h-3 mr-1" />Adicionar</Button>
                  </div>
                  {servicosFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_60px_80px_30px] gap-2 items-end">
                      <Input placeholder="Descrição" {...form.register(`servicos.${index}.descricao` as const)} />
                      <Input type="number" placeholder="Qtd" {...form.register(`servicos.${index}.quantidade` as const, { valueAsNumber: true })} />
                      <Input type="number" placeholder="R$" {...form.register(`servicos.${index}.valor_unitario` as const, { valueAsNumber: true })} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeServico(index)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                    </div>
                  ))}
                </div>

                <div className="border rounded-md p-3 space-y-3">
                  <div className="flex items-center justify-between"><Label className="text-sm font-bold">Peças Utilizadas</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendPeca({ peca_id: "", quantidade: 1, valor_unitario: 0 })}><Plus className="w-3 h-3 mr-1" />Adicionar</Button>
                  </div>
                  {pecasFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1fr_60px_80px_30px] gap-2 items-end">
                      <Select onValueChange={(v) => {
                        const p = pecasData?.find(item => item.id === v);
                        if (p) {
                          form.setValue(`pecas.${index}.peca_id`, v);
                          form.setValue(`pecas.${index}.valor_unitario`, p.valor_venda);
                        }
                      }} defaultValue={field.peca_id}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Peça" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {(pecasData ?? []).map(p => <SelectItem key={p.id} value={p.id}>{p.nome} (Estoque: {p.quantidade})</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input type="number" placeholder="Qtd" {...form.register(`pecas.${index}.quantidade` as const, { valueAsNumber: true })} />
                      <Input type="number" placeholder="R$" {...form.register(`pecas.${index}.valor_unitario` as const, { valueAsNumber: true })} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePeca(index)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="valor_mao_obra" render={({ field }) => (
                    <FormItem><FormLabel>Mão de Obra (R$)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="valor_pecas" render={({ field }) => (
                    <FormItem><FormLabel>Peças (R$)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="observacoes" render={({ field }) => (
                  <FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="grid gap-2">
                  <Label>Fotos Anexas</Label>
                  {editing && (
                    <div className="flex gap-2">
                      <Input placeholder="Legenda" value={legendaUpload} onChange={e => setLegendaUpload(e.target.value)} className="flex-1" />
                      <Input type="file" accept="image/*" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) { handleUpload(f); e.target.value = ""; } }} className="flex-1" />
                    </div>
                  )}
                  {uploading && <p className="text-xs text-muted-foreground animate-pulse">Enviando...</p>}
                  {editing && fotosEdit && fotosEdit.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {fotosEdit.map(f => (
                        <div key={f.id} className="relative border rounded p-1">
                          <img src={f.url} alt={f.legenda ?? "Foto"} className="w-full h-24 object-cover rounded" />
                          <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => deleteFoto.mutate({ id: f.id, ordem_servico_id: editing.id })}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editing ? "Salvar" : "Criar e Imprimir OS"}
                </Button>
              </form>
            </Form>
        </DialogContent>
      </Dialog>

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
                {statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
               <Table className="enterprise-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº OS</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Problema</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Valor Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium text-primary">{o.numero}</TableCell>
                      <TableCell>{(o as any).clientes?.nome ?? "—"}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">{o.problema_relatado ?? "—"}</TableCell>
                      <TableCell><StatusBadge status={statusLabel(o.status)} /></TableCell>
                      <TableCell className="hidden sm:table-cell font-medium">R$ {(Number(o.valor_mao_obra) + Number(o.valor_pecas)).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Imprimir" onClick={() => handlePrint(o)}><Printer className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setViewing(o); setViewDialog(true); }}><Eye className="w-4 h-4" /></Button>
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
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma OS encontrada</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes da {viewing?.numero}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Data:</span> <span className="font-medium">{new Date(viewing.data_entrada).toLocaleDateString("pt-BR")}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={statusLabel(viewing.status)} /></div>
              </div>
              <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{viewing.clientes?.nome}</span></div>
              {viewing.problema_relatado && <div><span className="text-muted-foreground">Problema:</span> <p>{viewing.problema_relatado}</p></div>}
              {viewing.diagnostico && <div><span className="text-muted-foreground">Diagnóstico:</span> <p>{viewing.diagnostico}</p></div>}
              {viewing.servicos_realizados && <div><span className="text-muted-foreground">Serviços:</span> <p>{viewing.servicos_realizados}</p></div>}
              <div className="border-t pt-3 grid grid-cols-3 gap-3">
                <div><span className="text-muted-foreground text-xs">Mão de obra</span><p className="font-medium">R$ {Number(viewing.valor_mao_obra).toFixed(2)}</p></div>
                <div><span className="text-muted-foreground text-xs">Peças</span><p className="font-medium">R$ {Number(viewing.valor_pecas).toFixed(2)}</p></div>
                <div><span className="text-muted-foreground text-xs">Total</span><p className="font-bold text-primary">R$ {(Number(viewing.valor_mao_obra) + Number(viewing.valor_pecas)).toFixed(2)}</p></div>
              </div>
              {viewing.observacoes && <div><span className="text-muted-foreground">Observações:</span> <p>{viewing.observacoes}</p></div>}
              {((fotosView && fotosView.length > 0) || viewing.foto_url) && (
                <div>
                  <span className="text-muted-foreground">Fotos Anexas:</span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {viewing.foto_url && !fotosView?.some(f => f.url === viewing.foto_url) && (
                      <div className="border rounded p-1">
                        <img src={viewing.foto_url} alt="Foto OS" className="w-full h-32 object-cover rounded" />
                      </div>
                    )}
                    {fotosView?.map(f => (
                      <div key={f.id} className="border rounded p-1">
                        <img src={f.url} alt={f.legenda ?? "Foto"} className="w-full h-32 object-cover rounded" />
                        {f.legenda && <p className="text-xs text-center mt-1 text-muted-foreground">{f.legenda}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={() => handlePrint(viewing)}>
                  <Printer className="w-4 h-4 mr-2" />Imprimir OS
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
       </Dialog>
 
       <DeleteConfirmationModal
         isOpen={deleteModal.open}
         onClose={() => setDeleteModal({ ...deleteModal, open: false })}
         onConfirm={() => handleDelete(deleteModal.id, deleteModal.numero)}
         title={`⚠️ Excluir OS ${deleteModal.numero}?`}
         description="Essa ação é irreversível. Todos os dados vinculados serão excluídos permanentemente: pagamentos, movimentos de caixa, peças utilizadas e registros financeiros."
         isLoading={isDeleting}
       />
    </div>
  );
}
