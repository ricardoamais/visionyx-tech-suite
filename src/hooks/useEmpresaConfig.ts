import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useEmpresaConfig() {
  return useQuery({
    queryKey: ["empresa_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresa_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateEmpresaConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      nome?: string;
      cnpj?: string | null;
      telefone?: string | null;
      email?: string | null;
      endereco?: string | null;
      whatsapp?: string | null;
      logo_url?: string | null;
    }) => {
      const { id, ...rest } = input;
      const { data, error } = await supabase
        .from("empresa_config")
        .update(rest)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao atualizar dados da empresa");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresa_config"] });
      toast.success("Dados da empresa salvos!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}
