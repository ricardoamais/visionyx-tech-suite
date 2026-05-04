import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

 export function useServicosCatalogo() {
   return useQuery({
     queryKey: ["servicos_catalogo"],
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
   return useMutation({
     mutationFn: async (input: { nome: string; valor_padrao?: number; descricao?: string; categoria?: string }) => {
       const { data, error } = await supabase.from("servicos_catalogo").insert(input).select().single();
       if (error) throw error;
       return data;
     },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["servicos_catalogo"] }); toast.success("Serviço cadastrado!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}