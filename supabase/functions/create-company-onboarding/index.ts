import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { name, document, email, password, owner_name } = await req.json();

    if (!name || !email || !password || !owner_name) {
      throw new Error("Dados obrigatórios ausentes");
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === email);

    if (existing) {
      // Check if it has a profile already (fully onboarded)
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("company_id")
        .eq("user_id", existing.id)
        .maybeSingle();

      if (existingProfile?.company_id) {
        return new Response(
          JSON.stringify({ error: "Este email já possui uma empresa cadastrada. Faça login." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // User exists but onboarding was incomplete - finish it
      const { data: companyData, error: companyError } = await supabaseAdmin
        .from("companies")
        .insert({ name, document: document || null, email, plan: "free", is_active: true })
        .select()
        .single();
      if (companyError) throw companyError;

      await supabaseAdmin.from("profiles").insert({
        user_id: existing.id, nome: owner_name, company_id: companyData.id,
      });
      await supabaseAdmin.from("user_roles").insert({
        user_id: existing.id, role: "admin", company_id: companyData.id,
      });

      // Reset the password to the one provided in case the user forgot
      await supabaseAdmin.auth.admin.updateUserById(existing.id, { password });

      return new Response(JSON.stringify({ success: true, userId: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    // New user flow
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, user_metadata: { nome: owner_name }, email_confirm: true,
    });
    if (authError) throw authError;
    if (!authData.user) throw new Error("Erro ao criar usuário");

    const { data: companyData, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({ name, document: document || null, email, plan: "free", is_active: true })
      .select()
      .single();
    if (companyError) throw companyError;

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      user_id: authData.user.id, nome: owner_name, company_id: companyData.id,
    });
    if (profileError) throw profileError;

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: authData.user.id, role: "admin", company_id: companyData.id,
    });
    if (roleError) throw roleError;

    return new Response(JSON.stringify({ success: true, userId: authData.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
    });
  }
});
