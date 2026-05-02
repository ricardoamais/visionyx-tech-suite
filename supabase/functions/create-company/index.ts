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
  let reusedExistingUser = false;

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

    if (authError) {
      // Se o email já existe, tenta recuperar onboarding incompleto
      const msg = (authError.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
        if (listErr) throw listErr;
        const existing = list.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
        if (!existing) throw authError;

        // Verifica se já tem empresa vinculada
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("company_id")
          .eq("user_id", existing.id)
          .maybeSingle();

        if (existingProfile?.company_id) {
          throw new Error("Este e-mail já está cadastrado. Tente fazer login.");
        }

        // Reutiliza usuário órfão e atualiza a senha
        await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
          user_metadata: { name: ownerName }
        });
        createdUserId = existing.id;
        reusedExistingUser = true;
      } else {
        throw authError;
      }
    } else {
      if (!authData.user) throw new Error("Falha ao criar usuário");
      createdUserId = authData.user.id;
    }

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

    // 3. Criar/atualizar o perfil do usuário (upsert por user_id)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        user_id: createdUserId,
        company_id: createdCompanyId,
        nome: ownerName
      }, { onConflict: "user_id" });

    if (profileError) throw profileError;

    // 4. Vincular papel de admin (remove papéis antigos para evitar duplicatas)
    await supabaseAdmin.from("user_roles").delete().eq("user_id", createdUserId);
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
    
    // Rollback manual (não apaga usuários reutilizados)
    if (createdCompanyId) {
      await supabaseAdmin.from("companies").delete().eq("id", createdCompanyId);
    }
    if (createdUserId && !reusedExistingUser) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId);
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
