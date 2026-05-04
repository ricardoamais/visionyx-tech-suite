import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useOSFotos(osId?: string | null) {
  return useQuery({
    queryKey: ["os_fotos", osId],
    enabled: !!osId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("os_fotos")
        .select("*")
        .eq("ordem_servico_id", osId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddOSFoto() {
  const qc = useQueryClient();
   return useMutation({
     mutationFn: async (input: { ordem_servico_id: string; url: string; legenda?: string }) => {
       const { data, error } = await supabase
         .from("os_fotos")
         .insert(input)
         .select()
         .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: ["os_fotos", d.ordem_servico_id] }); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteOSFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; ordem_servico_id: string }) => {
      const { error } = await supabase.from("os_fotos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ["os_fotos", vars.ordem_servico_id] }); toast.success("Foto removida"); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export async function fetchOSFotos(osId: string) {
  const { data, error } = await supabase
    .from("os_fotos")
    .select("*")
    .eq("ordem_servico_id", osId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}