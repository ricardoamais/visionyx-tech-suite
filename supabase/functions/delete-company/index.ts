import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { companyId } = await req.json();

    if (!companyId) {
      throw new Error("ID da empresa é obrigatório");
    }

    console.log(`Iniciando exclusão da empresa: ${companyId}`);

    // 1. Coletar todos os user_ids da empresa antes de deletar os profiles
    const { data: profiles, error: profilesFetchError } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("company_id", companyId);

    if (profilesFetchError) throw profilesFetchError;

    // 2. Deletar dados vinculados (Ordem inversa de dependência)
    const tablesToDelete = [
      "venda_itens", "vendas", "caixas", 
      "os_fotos", "os_pecas", "os_servicos", "ordens_servico",
      "orcamento_itens", "orcamentos", "contas",
      "pecas", "servicos_catalogo", "equipamentos", "clientes",
      "user_roles", "profiles"
    ];

    for (const table of tablesToDelete) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq("company_id", companyId);
      
      if (error) {
        console.error(`Erro ao deletar da tabela ${table}:`, error);
      }
    }

    // 3. Deletar usuários do Auth
    if (profiles && profiles.length > 0) {
      for (const profile of profiles) {
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(profile.user_id);
        if (authDeleteError) {
          console.error(`Erro ao deletar usuário Auth ${profile.user_id}:`, authDeleteError.message);
        }
      }
    }

    // 4. Deletar a empresa
    const { error: companyDeleteError } = await supabaseAdmin
      .from("companies")
      .delete()
      .eq("id", companyId);

    if (companyDeleteError) throw companyDeleteError;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Erro na exclusão da empresa:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
