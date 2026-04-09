import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useOrcamentos() {
  return useQuery({
    queryKey: ["orcamentos"],
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
  return useMutation({
    mutationFn: async (input: {
      cliente_id: string;
      observacoes?: string;
      status?: string;
      itens: { descricao: string; quantidade: number; valor_unitario: number }[];
    }) => {
      const { itens, ...orcData } = input;
      const valor_total = itens.reduce((sum, i) => sum + i.quantidade * i.valor_unitario, 0);
      const { data, error } = await supabase
        .from("orcamentos")
        .insert({ ...orcData, valor_total } as any)
        .select("*, clientes(nome)")
        .single();
      if (error) throw error;

      if (itens.length > 0) {
        const { error: itensError } = await supabase
          .from("orcamento_itens")
          .insert(itens.map(i => ({ ...i, orcamento_id: data.id })));
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
      const { data, error } = await supabase.from("orcamentos").update(input).eq("id", id).select().single();
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
