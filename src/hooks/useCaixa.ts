import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEmpresa } from "@/contexts/EmpresaContext";
import { toast } from "sonner";

export function useCaixaAberto() {
  const { companyId } = useEmpresa();
  return useQuery({
    queryKey: ["caixa_aberto", companyId],
    enabled: !!companyId,
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
  const { companyId } = useEmpresa();
  return useQuery({
    queryKey: ["caixas", companyId],
    enabled: !!companyId,
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
  const { companyId } = useEmpresa();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { valor_abertura: number; observacoes?: string }) => {
      if (!companyId || !user) throw new Error("Sessão inválida");
      const { data, error } = await supabase
        .from("caixas")
        .insert({
          company_id: companyId,
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

 export function useMovimentosCaixa(caixaId: string | null | undefined) {
   return useQuery({
     queryKey: ["movimentos_caixa", caixaId],
     enabled: !!caixaId,
     queryFn: async () => {
       const { data, error } = await supabase
         .from("caixa_movimentos")
         .select("*")
         .eq("caixa_id", caixaId!)
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data ?? [];
     },
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
  const { companyId } = useEmpresa();
  return useMutation({
    mutationFn: async (input: {
      caixa_id: string;
      cliente_id?: string | null;
      forma_pagamento: "dinheiro" | "cartao_credito" | "cartao_debito" | "pix";
      observacoes?: string;
      itens: { peca_id: string; quantidade: number; valor_unitario: number }[];
    }) => {
      if (!companyId) throw new Error("Empresa não definida");
      if (!input.itens.length) throw new Error("Adicione ao menos um item");
      const valor_total = input.itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);

       // 1. Criar a venda (registro detalhado)
       const { data: venda, error: e1 } = await (supabase.from("vendas") as any)
         .insert({
           company_id: companyId,
           caixa_id: input.caixa_id,
           cliente_id: input.cliente_id || null,
           forma_pagamento: input.forma_pagamento,
           observacoes: input.observacoes ?? null,
           valor_total,
           origem: 'pdv'
         })
         .select()
         .single();
       if (e1) throw e1;

       // 2. Lançar no caixa_movimentos (registro financeiro do caixa)
       const { error: e3 } = await (supabase.from("caixa_movimentos") as any).insert({
         company_id: companyId,
         caixa_id: input.caixa_id,
         tipo: 'entrada',
         valor: valor_total,
        descricao: input.itens.map(i => {
          const peca = (venda.venda_itens as any[])?.find(p => p.peca_id === i.peca_id);
          return `${i.quantidade}x ${peca?.pecas?.nome || 'Peça'}`;
        }).join(", ") || `Venda PDV ${venda.id.slice(0, 8)}`,
         forma_pagamento: input.forma_pagamento,
         origem: 'pdv',
         origem_id: venda.id
       });
       if (e3) throw e3;

      const { error: e2 } = await supabase.from("venda_itens").insert(
        input.itens.map((i) => ({
          company_id: companyId,
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
        qc.invalidateQueries({ queryKey: ["movimentos_caixa"] });
        qc.invalidateQueries({ queryKey: ["pecas"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
        qc.invalidateQueries({ queryKey: ["relatorios"] });
        qc.invalidateQueries({ queryKey: ["caixa"] });
        qc.invalidateQueries({ queryKey: ["contas"] });
        toast.success("Venda registrada!");
      },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}
