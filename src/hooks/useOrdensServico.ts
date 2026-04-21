import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";

export function useOrdensServico() {
  const { empresaId } = useEmpresa();
  return useQuery({
    queryKey: ["ordens_servico", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("*, clientes(nome), equipamentos(tipo, marca, modelo)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateOS() {
  const qc = useQueryClient();
  const { empresaId } = useEmpresa();
  return useMutation({
    mutationFn: async (input: {
      cliente_id: string; equipamento_id?: string; tecnico_id?: string;
      problema_relatado?: string; diagnostico?: string; servicos_realizados?: string;
      valor_mao_obra?: number; valor_pecas?: number; status?: string; observacoes?: string;
    }) => {
      if (!empresaId) throw new Error("Empresa não definida");
      const { data, error } = await supabase.from("ordens_servico").insert({ ...input, empresa_id: empresaId } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ordens_servico"] }); toast.success("OS criada!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateOS() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; cliente_id?: string; equipamento_id?: string | null; tecnico_id?: string | null; problema_relatado?: string | null; diagnostico?: string | null; servicos_realizados?: string | null; valor_mao_obra?: number; valor_pecas?: number; status?: string; observacoes?: string | null }) => {
      const { data, error } = await supabase.from("ordens_servico").update(input as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ordens_servico"] }); toast.success("OS atualizada!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteOS() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ordens_servico").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ordens_servico"] }); toast.success("OS removida!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}
