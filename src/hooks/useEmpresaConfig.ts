import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";

export function useEmpresaConfig() {
  const { companyId } = useEmpresa();
  return useQuery({
    queryKey: ["company_config", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    retry: 2,
  });
}

export function useUpdateEmpresaConfig() {
  const qc = useQueryClient();
  const { companyId } = useEmpresa();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      document?: string | null;
      phone?: string | null;
      email?: string | null;
      endereco?: string | null;
      whatsapp?: string | null;
      logo_url?: string | null;
    }) => {
      const { id, ...rest } = input;
      const { data, error } = await supabase
        .from("companies")
        .update(rest)
        .eq("id", id)
        .select("*");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Falha ao atualizar dados da empresa");
      return data[0];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresa_config"] });
      toast.success("Dados da empresa salvos!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
