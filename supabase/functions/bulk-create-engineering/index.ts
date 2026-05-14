import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USERS = [
  ["Uus Sutarno", "uussutarno@gmail.com"],
  ["Rudi S", "rudi.ycwdt11@gmail.com"],
  ["Deny Cahyana", "denicahyana97@gmail.com"],
  ["Cahyadi Sumitro", "cahsumit@yahoo.com"],
  ["Endang Hermawan", "endangher81@gmail.com"],
  ["Dadan Hadiana", "dadanhadiana70@gmail.com"],
  ["Hendi Wahyuda", "hendywayudha@gmail.com"],
  ["Yusup Maoludin", "ysp23mldn@gmail.com"],
  ["Aten Johansyah", "atenjohansyah19@gmail.com"],
  ["Komarudin", "gandoxbelakang@gmai.com"],
  ["Herisa Kuswendi", "herisakuswendi@gmail.com"],
  ["Asep Wildan", "febioabinaya@gmail.com"],
  ["Atep Hamzah", "atephamzah2015@gmail.com"],
  ["Deden Hadian", "dudenkhadi@gmail.com"],
  ["Deni Adim", "deniadim575@gmail.com"],
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const url = Deno.env.get("SUPABASE_URL")!;
  const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, srk);

  const results: any[] = [];
  for (const [name, email] of USERS) {
    try {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: "Eng@26",
        email_confirm: true,
        user_metadata: { full_name: name },
      });
      if (error) {
        results.push({ email, ok: false, error: error.message });
        continue;
      }
      const userId = data.user!.id;
      await admin.from("user_roles").delete().eq("user_id", userId);
      const { error: rErr } = await admin
        .from("user_roles")
        .insert({ user_id: userId, role: "staff_engineering" });
      await admin.from("profiles").update({ is_active: true, full_name: name }).eq("id", userId);
      results.push({ email, ok: !rErr, userId, error: rErr?.message });
    } catch (e) {
      results.push({ email, ok: false, error: (e as Error).message });
    }
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
