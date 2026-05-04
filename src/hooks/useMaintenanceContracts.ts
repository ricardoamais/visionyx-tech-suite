 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 import { format } from "date-fns";
 
 export function useMaintenanceContracts() {
   return useQuery({
     queryKey: ["contratos"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("contratos")
         .select("*")
         .order("empresa_nome", { ascending: true });
       if (error) throw error;
       return data;
     },
   });
 }
 
 export function useCreateContract() {
   const qc = useQueryClient();
   return useMutation({
     mutationFn: async (input: any) => {
       const { data, error } = await supabase
         .from("contratos")
         .insert(input)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       qc.invalidateQueries({ queryKey: ["contratos"] });
       toast.success("Contrato criado com sucesso!");
     },
     onError: (e: any) => toast.error("Erro ao criar contrato: " + e.message),
   });
 }
 
 export function useUpdateContract() {
   const qc = useQueryClient();
   return useMutation({
     mutationFn: async ({ id, ...input }: any) => {
       const { data, error } = await supabase
         .from("contratos")
         .update(input)
         .eq("id", id)
         .select()
         .single();
       if (error) throw error;
       return data;
     },
     onSuccess: () => {
       qc.invalidateQueries({ queryKey: ["contratos"] });
       toast.success("Contrato atualizado!");
     },
     onError: (e: any) => toast.error("Erro ao atualizar: " + e.message),
   });
 }
 
 export function useDeleteContract() {
   const qc = useQueryClient();
   return useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase.from("contratos").delete().eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       qc.invalidateQueries({ queryKey: ["contratos"] });
       toast.success("Contrato excluído!");
     },
     onError: (e: any) => toast.error("Erro ao excluir: " + e.message),
   });
 }
 
 export function useContractPayments(contractId: string | undefined) {
   return useQuery({
     queryKey: ["contrato_pagamentos", contractId],
     enabled: !!contractId,
     queryFn: async () => {
       const { data, error } = await supabase
         .from("contrato_pagamentos")
         .select("*")
         .eq("contrato_id", contractId!)
         .order("vencimento", { ascending: false });
       if (error) throw error;
       return data;
     },
   });
 }
 
 export function useRegisterContractPayment() {
   const qc = useQueryClient();
   return useMutation({
     mutationFn: async (input: {
       contrato_id: string;
       empresa_nome: string;
       mes_referencia: string;
       valor: number;
       vencimento: string;
       forma_pagamento: string;
       data_pagamento: string;
       observacoes?: string;
       caixa_id?: string;
     }) => {
       // 1. Inserir em contrato_pagamentos
       const { data: pgto, error: e1 } = await supabase
         .from("contrato_pagamentos")
         .insert({
           contrato_id: input.contrato_id,
           mes_referencia: input.mes_referencia,
           valor: input.valor,
           vencimento: input.vencimento,
           status: "pago",
           data_pagamento: input.data_pagamento,
           forma_pagamento: input.forma_pagamento,
           observacoes: input.observacoes,
         })
         .select()
         .single();
       if (e1) throw e1;
 
       // 2. Inserir em contas
       const { error: e2 } = await supabase.from("contas").insert({
         tipo: "receber",
         status: "recebido",
         categoria: "Contratos",
         descricao: `Contrato ${input.empresa_nome} - ${input.mes_referencia}`,
         valor: input.valor,
         vencimento: input.vencimento,
         forma_pagamento: input.forma_pagamento,
       });
       if (e2) throw e2;
 
       // 3. Inserir em caixa_movimentos
        const { error: e3 } = await supabase.from("caixa_movimentos").insert({
          caixa_id: input.caixa_id || null,
          tipo: "entrada",
          descricao: `Contrato ${input.empresa_nome} - ${input.mes_referencia}`,
          valor: input.valor,
          forma_pagamento: input.forma_pagamento,
          data_movimento: new Date().toISOString(),
          origem: 'contrato',
          origem_id: pgto.id
        });
       if (e3) throw e3;
 
       return pgto;
     },
     onSuccess: () => {
       qc.invalidateQueries({ queryKey: ["contratos"] });
       qc.invalidateQueries({ queryKey: ["contrato_pagamentos"] });
       qc.invalidateQueries({ queryKey: ["contas"] });
       qc.invalidateQueries({ queryKey: ["caixa"] });
       qc.invalidateQueries({ queryKey: ["dashboard"] });
       qc.invalidateQueries({ queryKey: ["relatorios"] });
       toast.success("Pagamento registrado com sucesso!");
     },
     onError: (e: any) => toast.error("Erro ao registrar pagamento: " + e.message),
   });
 }