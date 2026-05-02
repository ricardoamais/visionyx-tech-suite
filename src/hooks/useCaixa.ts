import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";

export function useCaixaAberto() {
  const { empresaId } = useEmpresa();
  return useQuery({
    queryKey: ["caixa_aberto", empresaId],
    enabled: !!empresaId,
    staleTime: 10000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caixas")
        .select("*")
        .eq("status", "aberto")
        .order("data_abertura", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCaixas() {
  const { empresaId } = useEmpresa();
  return useQuery({
    queryKey: ["caixas", empresaId],
    enabled: !!empresaId,
    staleTime: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caixas")
        .select("*")
        .order("data_abertura", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAbrirCaixa() {
  const qc = useQueryClient();
  const { empresaId } = useEmpresa();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { valor_abertura: number; observacoes?: string }) => {
      if (!empresaId || !user) throw new Error("Sessão inválida");
      const { data, error } = await supabase
        .from("caixas")
        .insert({
          empresa_id: empresaId,
          user_id: user.id,
          valor_abertura: input.valor_abertura,
          observacoes: input.observacoes ?? null,
          status: "aberto",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caixa_aberto"] });
      qc.invalidateQueries({ queryKey: ["caixas"] });
      toast.success("Caixa aberto!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useFecharCaixa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; valor_fechamento: number; observacoes?: string }) => {
      const { error } = await supabase
        .from("caixas")
        .update({
          status: "fechado",
          valor_fechamento: input.valor_fechamento,
          data_fechamento: new Date().toISOString(),
          observacoes: input.observacoes ?? null,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["caixa_aberto"] });
      qc.invalidateQueries({ queryKey: ["caixas"] });
      toast.success("Caixa fechado!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useVendasCaixa(caixaId: string | null | undefined) {
  return useQuery({
    queryKey: ["vendas_caixa", caixaId],
    enabled: !!caixaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendas")
        .select("*, venda_itens(*, pecas(nome))")
        .eq("caixa_id", caixaId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateVenda() {
  const qc = useQueryClient();
  const { empresaId } = useEmpresa();
  return useMutation({
    mutationFn: async (input: {
      caixa_id: string;
      cliente_id?: string | null;
      forma_pagamento: "dinheiro" | "cartao_credito" | "cartao_debito" | "pix";
      observacoes?: string;
      itens: { peca_id: string; quantidade: number; valor_unitario: number }[];
    }) => {
      if (!empresaId) throw new Error("Empresa não definida");
      if (!input.itens.length) throw new Error("Adicione ao menos um item");
      const valor_total = input.itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);

      const { data: venda, error: e1 } = await supabase
        .from("vendas")
        .insert({
          empresa_id: empresaId,
          caixa_id: input.caixa_id,
          cliente_id: input.cliente_id || null,
          forma_pagamento: input.forma_pagamento,
          observacoes: input.observacoes ?? null,
          valor_total,
        })
        .select()
        .single();
      if (e1) throw e1;

      const { error: e2 } = await supabase.from("venda_itens").insert(
        input.itens.map((i) => ({
          empresa_id: empresaId,
          venda_id: venda.id,
          peca_id: i.peca_id,
          quantidade: i.quantidade,
          valor_unitario: i.valor_unitario,
        }))
      );
      if (e2) throw e2;
      // Buscar itens com nome da peça para impressão
      const { data: itensFull } = await supabase
        .from("venda_itens")
        .select("*, pecas(nome)")
        .eq("venda_id", venda.id);
      return { ...venda, venda_itens: itensFull ?? [] };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendas_caixa"] });
      qc.invalidateQueries({ queryKey: ["pecas"] });
      toast.success("Venda registrada!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}
