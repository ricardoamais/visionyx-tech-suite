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

  let createdUserId: string | null = null;
  let createdCompanyId: string | null = null;

  try {
    const { ownerName, companyName, cnpj, email, password } = await req.json();

    if (!ownerName || !companyName || !email || !password) {
      throw new Error("Dados obrigatórios ausentes (nome, empresa, email ou senha)");
    }

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: ownerName }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Falha ao criar usuário");
    createdUserId = authData.user.id;

    // 2. Criar a empresa
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: companyName,
        document: cnpj || null,
        email: email,
        is_active: true,
        plan: 'free'
      })
      .select()
      .single();

    if (companyError) throw companyError;
    createdCompanyId = companyData.id;

    // 3. Criar o perfil do usuário
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: createdUserId,
        company_id: createdCompanyId,
        nome: ownerName
      });

    if (profileError) throw profileError;

    // 4. Vincular papel de admin (user_roles table)
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: createdUserId,
        company_id: createdCompanyId,
        role: 'admin'
      });

    if (roleError) throw roleError;

    return new Response(
      JSON.stringify({ success: true, userId: createdUserId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Erro no onboarding:", error.message);
    
    // Rollback manual
    if (createdUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
    }
    
    if (createdCompanyId) {
      await supabaseAdmin.from("companies").delete().eq("id", createdCompanyId);
    }

    let errorMessage = error.message;
    if (errorMessage.includes("already registered")) {
      errorMessage = "Este e-mail já está cadastrado. Tente fazer login.";
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
