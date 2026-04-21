import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";

export interface ServicoCatalogo {
  id: string;
  nome: string;
  categoria: string | null;
  valor_padrao: number;
  descricao: string | null;
  ativo: boolean;
}

type ServicoInput = {
  nome: string;
  categoria?: string | null;
  valor_padrao?: number;
  descricao?: string | null;
  ativo?: boolean;
};

export function useServicosCatalogo(onlyAtivos = false) {
  const { empresaId } = useEmpresa();
  return useQuery({
    queryKey: ["servicos_catalogo", empresaId, onlyAtivos],
    enabled: !!empresaId,
    queryFn: async () => {
      let q = supabase.from("servicos_catalogo").select("*").order("nome");
      if (onlyAtivos) q = q.eq("ativo", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as ServicoCatalogo[];
    },
  });
}

export function useCreateServico() {
  const qc = useQueryClient();
  const { empresaId } = useEmpresa();
  return useMutation({
    mutationFn: async (input: ServicoInput) => {
      if (!empresaId) throw new Error("Empresa não definida");
      const { data, error } = await supabase
        .from("servicos_catalogo")
        .insert({ ...input, empresa_id: empresaId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos_catalogo"] });
      toast.success("Serviço cadastrado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<ServicoInput>) => {
      const { data, error } = await supabase
        .from("servicos_catalogo")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos_catalogo"] });
      toast.success("Serviço atualizado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("servicos_catalogo").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos_catalogo"] });
      toast.success("Serviço removido!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}