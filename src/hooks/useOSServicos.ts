import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";

export interface OSServico {
  id: string;
  ordem_servico_id: string;
  servico_catalogo_id: string | null;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
}

export function useOSServicos(osId: string | null | undefined) {
  return useQuery({
    queryKey: ["os_servicos", osId],
    enabled: !!osId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("os_servicos")
        .select("*")
        .eq("ordem_servico_id", osId!)
        .order("created_at");
      if (error) throw error;
      return data as OSServico[];
    },
  });
}

export function useAddOSServico() {
  const qc = useQueryClient();
  const { empresaId } = useEmpresa();
  return useMutation({
    mutationFn: async (input: {
      ordem_servico_id: string;
      servico_catalogo_id?: string | null;
      descricao: string;
      quantidade: number;
      valor_unitario: number;
    }) => {
      if (!empresaId) throw new Error("Empresa não definida");
      const { data, error } = await supabase
        .from("os_servicos")
        .insert({ ...input, empresa_id: empresaId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["os_servicos", vars.ordem_servico_id] });
      qc.invalidateQueries({ queryKey: ["ordens_servico"] });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteOSServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; ordem_servico_id: string }) => {
      const { error } = await supabase.from("os_servicos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["os_servicos", vars.ordem_servico_id] });
      qc.invalidateQueries({ queryKey: ["ordens_servico"] });
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}