import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";

export function useEquipamentos() {
  const { empresaId } = useEmpresa();
  return useQuery({
    queryKey: ["equipamentos", empresaId],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipamentos")
        .select("*, clientes(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateEquipamento() {
  const qc = useQueryClient();
  const { empresaId } = useEmpresa();
  return useMutation({
    mutationFn: async (input: {
      tipo: string; marca: string; modelo?: string; numero_serie?: string;
      cliente_id: string; acessorios?: string; defeito_relatado?: string;
      senha_equipamento?: string; observacoes?: string;
    }) => {
      if (!empresaId) throw new Error("Empresa não definida");
      const { data, error } = await supabase.from("equipamentos").insert({ ...input, empresa_id: empresaId }).select("*, clientes(nome)").single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["equipamentos"] }); toast.success("Equipamento cadastrado!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateEquipamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: {
      id: string; tipo?: string; marca?: string; modelo?: string; numero_serie?: string;
      cliente_id?: string; acessorios?: string; defeito_relatado?: string;
      senha_equipamento?: string; observacoes?: string;
    }) => {
      const { data, error } = await supabase.from("equipamentos").update(input).eq("id", id).select("*, clientes(nome)").single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["equipamentos"] }); toast.success("Equipamento atualizado!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteEquipamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["equipamentos"] }); toast.success("Equipamento removido!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}
