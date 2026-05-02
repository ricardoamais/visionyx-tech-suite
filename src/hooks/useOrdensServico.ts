import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";

export function useOrdensServico() {
  const { empresaId } = useEmpresa();
  return useQuery({
    queryKey: ["ordens_servico", empresaId],
    enabled: !!empresaId,
    staleTime: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("*, clientes(nome), equipamentos(tipo, marca, modelo), os_pecas(*, pecas(nome)), os_servicos(*)")
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
      valor_mao_obra?: number; valor_pecas?: number; status?: string; observacoes?: string; foto_url?: string | null;
      pecas?: { peca_id: string; quantidade: number; valor_unitario: number }[];
      servicos?: { descricao: string; quantidade: number; valor_unitario: number; servico_catalogo_id?: string }[];
    }) => {
      if (!empresaId) throw new Error("Empresa não definida");
      const { pecas, servicos, ...osData } = input;
      const { data, error } = await supabase.from("ordens_servico").insert({ ...osData, empresa_id: empresaId } as any).select().single();
      if (error) throw error;

      if (pecas && pecas.length > 0) {
        const { error: pecasErr } = await supabase.from("os_pecas").insert(pecas.map(p => ({ ...p, ordem_servico_id: data.id, empresa_id: empresaId })));
        if (pecasErr) throw pecasErr;
      }

      if (servicos && servicos.length > 0) {
        const { error: servicosErr } = await supabase.from("os_servicos").insert(servicos.map(s => ({ ...s, ordem_servico_id: data.id, empresa_id: empresaId })));
        if (servicosErr) throw servicosErr;
      }
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ordens_servico"] }); toast.success("OS criada!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateOS() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pecas, servicos, ...input }: {
      id: string; cliente_id?: string; equipamento_id?: string | null; tecnico_id?: string | null;
      problema_relatado?: string | null; diagnostico?: string | null; servicos_realizados?: string | null;
      valor_mao_obra?: number; valor_pecas?: number; status?: string; observacoes?: string | null; foto_url?: string | null;
      pecas?: { peca_id: string; quantidade: number; valor_unitario: number }[];
      servicos?: { descricao: string; quantidade: number; valor_unitario: number; servico_catalogo_id?: string }[];
    }) => {
      const { data, error } = await supabase.from("ordens_servico").update(input as any).eq("id", id).select().single();
      if (error) throw error;

      // Simple approach: delete existing and re-insert
      if (pecas) {
        await supabase.from("os_pecas").delete().eq("ordem_servico_id", id);
        if (pecas.length > 0) {
          const { error: pecasErr } = await supabase.from("os_pecas").insert(pecas.map(p => ({ ...p, ordem_servico_id: id, empresa_id: data.empresa_id })));
          if (pecasErr) throw pecasErr;
        }
      }

      if (servicos) {
        await supabase.from("os_servicos").delete().eq("ordem_servico_id", id);
        if (servicos.length > 0) {
          const { error: servicosErr } = await supabase.from("os_servicos").insert(servicos.map(s => ({ ...s, ordem_servico_id: id, empresa_id: data.empresa_id })));
          if (servicosErr) throw servicosErr;
        }
      }

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
