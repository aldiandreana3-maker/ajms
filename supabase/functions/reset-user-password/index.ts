import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to check their role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user: currentUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !currentUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is super_admin
    const { data: roleData, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .single();

    if (roleError || roleData?.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Only super admin can reset passwords" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body
    const { userId, userEmail } = await req.json();
    if (!userId || !userEmail) {
      return new Response(
        JSON.stringify({ error: "Missing userId or userEmail" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate random password (8 chars: letters + numbers)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let newPassword = "";
    for (let i = 0; i < 8; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Use service role to update user password
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to reset password" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the password reset (without storing the password)
    await adminClient.from("admin_password_resets").insert({
      user_id: userId,
      user_email: userEmail,
      reset_by: currentUser.id,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        newPassword,
        message: "Password berhasil direset" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
