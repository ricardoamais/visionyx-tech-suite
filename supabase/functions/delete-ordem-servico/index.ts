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
 
     const { osId } = await req.json()
     if (!osId) throw new Error('ID da OS não informado')
 
     // Verificar se a OS pertence à mesma empresa
     const { data: os, error: osCheckError } = await supabaseClient
       .from('ordens_servico')
       .select('company_id')
       .eq('id', osId)
       .single()
 
     if (osCheckError || !os) throw new Error('Ordem de serviço não encontrada')
     if (os.company_id !== profile.company_id) throw new Error('Permissão negada para esta empresa')
 
     // Iniciar deleções em cascata usando service_role client para garantir que tudo seja removido
     const adminClient = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
     )
 
     // 1. Vendas e Venda Itens
     const { data: vendas } = await adminClient.from('vendas').select('id').eq('ordem_servico_id', osId)
     if (vendas && vendas.length > 0) {
       const vendaIds = vendas.map(v => v.id)
       await adminClient.from('venda_itens').delete().in('venda_id', vendaIds)
       await adminClient.from('vendas').delete().in('id', vendaIds)
     }
 
     // 2. Contas
     await adminClient.from('contas').delete().eq('ordem_servico_id', osId)
 
     // 3. Peças e Serviços da OS
     await adminClient.from('os_pecas').delete().eq('ordem_servico_id', osId)
     await adminClient.from('os_servicos').delete().eq('ordem_servico_id', osId)
 
     // 4. Fotos
     await adminClient.from('os_fotos').delete().eq('ordem_servico_id', osId)
 
     // 5. A própria OS
     const { error: deleteError } = await adminClient
       .from('ordens_servico')
       .delete()
       .eq('id', osId)
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