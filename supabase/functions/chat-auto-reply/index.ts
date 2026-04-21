import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { conversation_id, message } = await req.json();
    if (!conversation_id || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load knowledge base
    const { data: kb } = await supabase
      .from("chat_knowledge_base")
      .select("question, answer, keywords")
      .eq("is_active", true);

    const lower = String(message).toLowerCase();
    let answer: string | null = null;

    // 1) Keyword match
    if (kb && kb.length) {
      for (const item of kb) {
        const kws: string[] = item.keywords || [];
        if (kws.some((k) => k && lower.includes(k.toLowerCase()))) {
          answer = item.answer;
          break;
        }
      }
      // Also try matching question text
      if (!answer) {
        for (const item of kb) {
          if (item.question && lower.includes(item.question.toLowerCase().slice(0, 20))) {
            answer = item.answer;
            break;
          }
        }
      }
    }

    // 2) AI fallback (constrained to KB)
    if (!answer && kb && kb.length) {
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (apiKey) {
        const kbText = kb
          .map((i, idx) => `${idx + 1}. Q: ${i.question}\n   A: ${i.answer}`)
          .join("\n\n");
        const sys = `Anda adalah asisten chat yang HANYA boleh menjawab berdasarkan knowledge base berikut. Jika pertanyaan tidak relevan atau tidak ada jawabannya, balas persis: "NO_MATCH". Jangan mengarang.\n\nKnowledge base:\n${kbText}`;
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: sys },
              { role: "user", content: String(message) },
            ],
          }),
        });
        if (aiRes.ok) {
          const data = await aiRes.json();
          const text = data?.choices?.[0]?.message?.content?.trim();
          if (text && !text.includes("NO_MATCH")) answer = text;
        }
      }
    }

    if (answer) {
      await supabase.from("chat_messages").insert({
        conversation_id,
        sender_name: "Asisten AJMS",
        sender_role: "system",
        content: answer,
        message_type: "auto_reply",
      });
      await supabase
        .from("chat_conversations")
        .update({
          status: "auto_reply",
          last_message: answer,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversation_id);
      return new Response(JSON.stringify({ matched: true, answer }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Not found → forward to admin
    const fallback = "Pertanyaan Anda akan diteruskan ke admin.";
    await supabase.from("chat_messages").insert({
      conversation_id,
      sender_name: "Asisten AJMS",
      sender_role: "system",
      content: fallback,
      message_type: "system",
    });
    await supabase
      .from("chat_conversations")
      .update({
        status: "menunggu_admin",
        last_message: fallback,
        last_message_at: new Date().toISOString(),
        unread_admin_count: 1,
      })
      .eq("id", conversation_id);

    return new Response(JSON.stringify({ matched: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
