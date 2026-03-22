import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function usePecas() {
  return useQuery({
    queryKey: ["pecas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pecas").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePeca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { nome: string; quantidade?: number; valor_compra?: number; valor_venda?: number; estoque_minimo?: number }) => {
      const { data, error } = await supabase.from("pecas").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pecas"] }); toast.success("Peça cadastrada!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useUpdatePeca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; nome?: string; quantidade?: number; valor_compra?: number; valor_venda?: number; estoque_minimo?: number }) => {
      const { data, error } = await supabase.from("pecas").update(input).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pecas"] }); toast.success("Peça atualizada!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useDeletePeca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pecas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pecas"] }); toast.success("Peça removida!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}
