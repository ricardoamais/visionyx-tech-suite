import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";

export function useOrcamentos() {
  const { companyId } = useEmpresa();
  return useQuery({
    queryKey: ["orcamentos", companyId],
    enabled: !!companyId,
    staleTime: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*, clientes(nome), orcamento_itens(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateOrcamento() {
  const qc = useQueryClient();
  const { companyId } = useEmpresa();
  return useMutation({
    mutationFn: async (input: {
      cliente_id: string;
      observacoes?: string;
      status?: string;
      itens: { descricao: string; quantidade: number; valor_unitario: number }[];
    }) => {
       if (!companyId) throw new Error("Empresa não definida");
       const { itens, ...orcData } = input;
       const valor_total = itens.reduce((sum, i) => sum + i.quantidade * i.valor_unitario, 0);
 
       const sanitized = {
         ...orcData,
         valor_total,
         company_id: companyId,
         cliente_id: orcData.cliente_id || null,
       };
 
       const { data, error } = await supabase
         .from("orcamentos")
         .insert(sanitized as any)
         .select("*, clientes(nome)")
         .single();
       if (error) throw error;

      if (itens.length > 0) {
        const { error: itensError } = await supabase
          .from("orcamento_itens")
          .insert(itens.map(i => ({ ...i, orcamento_id: data.id, company_id: companyId })));
        if (itensError) throw itensError;
      }
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orcamentos"] }); toast.success("Orçamento criado!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateOrcamento() {
  const qc = useQueryClient();
  return useMutation({
     mutationFn: async ({ id, ...input }: { id: string; cliente_id?: string; observacoes?: string | null; status?: "pendente" | "aprovado" | "reprovado"; valor_total?: number }) => {
       const sanitized = {
         ...input,
         cliente_id: input.cliente_id || null,
       };
 
       const { data, error } = await supabase.from("orcamentos").update(sanitized as any).eq("id", id).select().single();
       if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orcamentos"] }); toast.success("Orçamento atualizado!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteOrcamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orcamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orcamentos"] }); toast.success("Orçamento removido!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}
