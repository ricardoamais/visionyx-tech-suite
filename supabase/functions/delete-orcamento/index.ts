 import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 }
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders })
   }
 
   try {
     const supabaseClient = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
       { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
     )
 
     const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
     if (userError || !user) throw new Error('Não autorizado')
 
     const { data: profile } = await supabaseClient
       .from('profiles')
       .select('company_id')
       .eq('user_id', user.id)
       .single()
 
     if (!profile?.company_id) throw new Error('Empresa não encontrada para o usuário')
 
     const { orcId } = await req.json()
     if (!orcId) throw new Error('ID do Orçamento não informado')
 
     // Verificar se o orçamento pertence à mesma empresa
     const { data: orcamento, error: orcCheckError } = await supabaseClient
       .from('orcamentos')
       .select('numero, company_id')
       .eq('id', orcId)
       .single()
 
     if (orcCheckError || !orcamento) throw new Error('Orçamento não encontrado')
     if (orcamento.company_id !== profile.company_id) throw new Error('Permissão negada para esta empresa')
 
     const adminClient = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
     )
 
     // 1. Vendas e Venda Itens vinculados
     const { data: vendas } = await adminClient.from('vendas').select('id').eq('orcamento_id', orcId)
     if (vendas && vendas.length > 0) {
       const vendaIds = vendas.map(v => v.id)
       await adminClient.from('venda_itens').delete().in('venda_id', vendaIds)
       await adminClient.from('vendas').delete().in('id', vendaIds)
     }
 
     // 2. Contas (por ID ou por descrição contendo o número do orçamento)
     await adminClient.from('contas').delete().eq('company_id', profile.company_id).ilike('descricao', `%${orcamento.numero}%`)
 
     // 3. Itens do Orçamento
     await adminClient.from('orcamento_itens').delete().eq('orcamento_id', orcId)
 
     // 4. O próprio Orçamento
     const { error: deleteError } = await adminClient
       .from('orcamentos')
       .delete()
       .eq('id', orcId)
       .eq('company_id', profile.company_id)
 
     if (deleteError) throw deleteError
 
     return new Response(JSON.stringify({ success: true }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       status: 200,
     })
   } catch (error: any) {
     return new Response(JSON.stringify({ error: error.message }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       status: 400,
     })
   }
 })