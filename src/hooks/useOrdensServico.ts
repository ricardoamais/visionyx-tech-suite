import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

 export function useOrdensServico() {
   return useQuery({
     queryKey: ["ordens_servico"],
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
   return useMutation({
     mutationFn: async (input: {
       cliente_id: string; equipamento_id?: string; tecnico_id?: string;
       problema_relatado?: string; diagnostico?: string; servicos_realizados?: string;
       valor_mao_obra?: number; valor_pecas?: number; status?: string; observacoes?: string; foto_url?: string | null;
       pecas?: { peca_id: string; quantidade: number; valor_unitario: number }[];
       servicos?: { descricao: string; quantidade: number; valor_unitario: number; servico_catalogo_id?: string }[];
     }) => {
        const { pecas, servicos, ...osData } = input;
  
        const sanitized = {
          ...osData,
          equipamento_id: osData.equipamento_id || null,
          tecnico_id: osData.tecnico_id || null,
          cliente_id: osData.cliente_id || null,
        };
  
        const { data, error } = await supabase.from("ordens_servico").insert(sanitized as any).select().single();
        if (error) throw error;
 
       if (pecas && pecas.length > 0) {
         const { error: pecasErr } = await supabase.from("os_pecas").insert(pecas.map(p => ({ ...p, ordem_servico_id: data.id })));
         if (pecasErr) throw pecasErr;
       }
 
       if (servicos && servicos.length > 0) {
         const { error: servicosErr } = await supabase.from("os_servicos").insert(servicos.map(s => ({ ...s, ordem_servico_id: data.id })));
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
       const sanitized = {
         ...input,
         equipamento_id: input.equipamento_id || null,
         tecnico_id: input.tecnico_id || null,
         cliente_id: input.cliente_id || null,
       };
 
       const { data, error } = await supabase.from("ordens_servico").update(sanitized as any).eq("id", id).select().single();
       if (error) throw error;

      // Simple approach: delete existing and re-insert
      if (pecas) {
        await supabase.from("os_pecas").delete().eq("ordem_servico_id", id);
        if (pecas.length > 0) {
         const { error: pecasErr } = await supabase.from("os_pecas").insert(pecas.map(p => ({ ...p, ordem_servico_id: id })));
          if (pecasErr) throw pecasErr;
        }
      }

      if (servicos) {
        await supabase.from("os_servicos").delete().eq("ordem_servico_id", id);
        if (servicos.length > 0) {
           const { error: servicosErr } = await supabase.from("os_servicos").insert(servicos.map(s => ({ ...s, ordem_servico_id: id })));
          if (servicosErr) throw servicosErr;
        }
      }

      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ordens_servico"] }); toast.success("OS atualizada!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}
