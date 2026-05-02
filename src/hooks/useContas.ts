import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ContaTipo = Database["public"]["Enums"]["conta_tipo"];
type ContaStatus = Database["public"]["Enums"]["conta_status"];

export function useContas() {
  const { companyId } = useEmpresa();
  return useQuery({
    queryKey: ["contas", companyId],
    enabled: !!companyId,
    staleTime: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas")
        .select("*")
        .order("vencimento", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateConta() {
  const qc = useQueryClient();
  const { companyId } = useEmpresa();
  return useMutation({
    mutationFn: async (input: {
      descricao: string;
      valor: number;
      vencimento: string;
      tipo: ContaTipo;
      categoria?: string;
      forma_pagamento?: string;
      status?: ContaStatus;
    }) => {
      if (!companyId) throw new Error("Empresa não definida");
      const { data, error } = await supabase.from("contas").insert({ ...input, company_id: companyId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contas"] }); toast.success("Conta criada!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateConta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; descricao?: string; valor?: number; vencimento?: string; tipo?: "pagar" | "receber"; categoria?: string | null; forma_pagamento?: string | null; status?: "pendente" | "pago" | "recebido" | "vencido" }) => {
      const { data, error } = await supabase.from("contas").update(input).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contas"] }); toast.success("Conta atualizada!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteConta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contas"] }); toast.success("Conta removida!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}
