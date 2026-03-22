import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type ClienteRow = {
  id: string; nome: string; cpf_cnpj: string | null; telefone: string | null;
  whatsapp: string | null; email: string | null; endereco: string | null;
  observacoes: string | null; user_id: string; created_at: string; updated_at: string;
};

export function useClientes() {
  return useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*").order("nome");
      if (error) throw error;
      return data as ClienteRow[];
    },
  });
}

export function useCreateCliente() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { nome: string; cpf_cnpj?: string; telefone?: string; whatsapp?: string; email?: string; endereco?: string; observacoes?: string }) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.from("clientes").insert({ ...input, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clientes"] }); toast.success("Cliente cadastrado!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; nome?: string; cpf_cnpj?: string; telefone?: string; whatsapp?: string; email?: string; endereco?: string; observacoes?: string }) => {
      const { data, error } = await supabase.from("clientes").update(input).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clientes"] }); toast.success("Cliente atualizado!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clientes"] }); toast.success("Cliente removido!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}
