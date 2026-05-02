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

    // Verify the caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) throw new Error("Não autorizado");

    const { data: userData } = await supabaseAdmin
      .from("user_roles")
      .select("role, company_id")
      .eq("user_id", caller.id)
      .maybeSingle();

    if (!userData || (userData.role !== "admin" && userData.role !== "super_admin")) {
      throw new Error("Acesso negado");
    }

    const isSuperAdmin = userData.role === "super_admin";
    const callerCompanyId = userData.company_id;

    const { action, ...params } = await req.json();

    if (action === "list") {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
      if (error) throw error;

      let queryProfiles = supabaseAdmin.from("profiles").select("*");
      let queryRoles = supabaseAdmin.from("user_roles").select("*");

      if (!isSuperAdmin) {
        queryProfiles = queryProfiles.eq("company_id", callerCompanyId);
        queryRoles = queryRoles.eq("company_id", callerCompanyId);
      }

      const { data: profiles } = await queryProfiles;
      const { data: roles } = await queryRoles;

      const result = users
        .filter(u => profiles?.some(p => p.user_id === u.id))
        .map((u) => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          nome: profiles?.find((p) => p.user_id === u.id)?.nome || u.email,
          telefone: profiles?.find((p) => p.user_id === u.id)?.telefone || null,
          role: roles?.find((r) => r.user_id === u.id)?.role || "tecnico",
        }));

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "invite") {
      const { email, nome, role } = params;
      if (!email || !nome || !role) throw new Error("Dados incompletos");

      if (!isSuperAdmin) {
        // Check plan limit for users
        const { data: canAdd } = await supabaseAdmin.rpc("check_plan_limit", { 
          target_company_id: callerCompanyId, 
          feature: 'users_total' 
        });
        if (!canAdd) throw new Error("Limite de usuários do seu plano atingido.");
      }

      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { nome },
        redirectTo: `${req.headers.get("origin") || ""}/login`,
      });

      if (inviteError) throw inviteError;

      // Create profile and role with company_id
      await supabaseAdmin.from("profiles").insert({
        user_id: inviteData.user.id,
        nome,
        company_id: isSuperAdmin ? params.company_id : callerCompanyId,
      });

      await supabaseAdmin.from("user_roles").insert({
        user_id: inviteData.user.id,
        role,
        company_id: isSuperAdmin ? params.company_id : callerCompanyId,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const { userId, nome, telefone, role } = params;
      if (!userId) throw new Error("userId obrigatório");

      // Update profile
      await supabaseAdmin.from("profiles").update({ nome, telefone }).eq("user_id", userId);

      // Update role
      if (role) {
        await supabaseAdmin.from("user_roles").update({ role }).eq("user_id", userId);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_password") {
      const { userId, newPassword } = params;
      if (!userId || !newPassword) throw new Error("userId e newPassword obrigatórios");

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Ação inválida");
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});