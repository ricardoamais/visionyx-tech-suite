import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";

export function useServicosCatalogo() {
  const { empresaId } = useEmpresa();
  return useQuery({
    queryKey: ["servicos_catalogo", empresaId],
    enabled: !!empresaId,
    staleTime: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos_catalogo")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateServicoCatalogo() {
  const qc = useQueryClient();
  const { empresaId } = useEmpresa();
  return useMutation({
    mutationFn: async (input: { nome: string; valor_padrao?: number; descricao?: string; categoria?: string }) => {
      if (!empresaId) throw new Error("Empresa não definida");
      const { data, error } = await supabase.from("servicos_catalogo").insert({ ...input, empresa_id: empresaId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["servicos_catalogo"] }); toast.success("Serviço cadastrado!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}