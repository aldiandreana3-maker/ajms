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

    // Load active knowledge base
    const { data: kb } = await supabase
      .from("chat_knowledge_base")
      .select("id, question, answer, keywords")
      .eq("is_active", true);

    const lower = String(message).toLowerCase();
    let answer: string | null = null;
    let matchedItem: any = null;

    // 1) Keyword match (free, no AI)
    if (kb && kb.length) {
      // Score-based: count matching keywords
      const scored = kb
        .map((it: any) => {
          const kws: string[] = it.keywords || [];
          const score = kws.reduce((acc, k) => (k && lower.includes(k.toLowerCase()) ? acc + 1 : acc), 0);
          return { it, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      if (scored.length) {
        matchedItem = scored[0].it;
        answer = matchedItem.answer;
      }
      // Question text fallback
      if (!answer) {
        for (const item of kb) {
          if (item.question && lower.includes(item.question.toLowerCase().slice(0, 20))) {
            matchedItem = item;
            answer = item.answer;
            break;
          }
        }
      }
    }

    // 2) AI paraphrase from KB (constrained, no invention)
    if (kb && kb.length) {
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (apiKey) {
        const kbText = kb
          .map((i: any, idx: number) => `[${idx + 1}] Q: ${i.question}\n   A: ${i.answer}`)
          .join("\n\n");

        // If we have a keyword match → ask AI to paraphrase that material into a friendly reply.
        // If no match → ask AI to attempt a strict-from-KB answer; if not possible, return NO_MATCH.
        const sys = matchedItem
          ? `Anda adalah asisten chat yang ramah. Susun ulang materi berikut menjadi jawaban yang ringkas, sopan, dan jelas dalam Bahasa Indonesia. DILARANG menambah informasi di luar materi. Maksimal 4 kalimat.\n\nMateri:\n${matchedItem.answer}`
          : `Anda adalah asisten chat yang HANYA boleh menjawab berdasarkan knowledge base berikut. Anda BOLEH memparafrase agar lebih ramah, tapi DILARANG menambah info di luar materi. Jika tidak ada materi yang relevan sama sekali, balas persis: "NO_MATCH".\n\nKnowledge base:\n${kbText}`;

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

    // 3) Tidak ketemu → tawarkan 2-3 saran pertanyaan terkait dari KB
    let suggestions: string[] = [];
    if (kb && kb.length) {
      // Skor sederhana berdasarkan kemiripan kata (overlap token)
      const tokens = new Set(
        lower.replace(/[^a-z0-9\s]/gi, " ").split(/\s+/).filter((t) => t.length >= 3)
      );
      const scored = kb.map((it: any) => {
        const text = `${it.question} ${(it.keywords || []).join(" ")}`.toLowerCase();
        let score = 0;
        tokens.forEach((t) => {
          if (text.includes(t)) score++;
        });
        return { q: it.question, score };
      });
      suggestions = scored
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 3)
        .filter((x: any) => x.score > 0 || true) // even if zero score, show top by recency
        .map((x: any) => x.q);
      // Jika tidak ada token yang cocok, ambil 3 pertanyaan teratas
      if (suggestions.every((_, idx) => scored[idx]?.score === 0)) {
        suggestions = kb.slice(0, 3).map((it: any) => it.question);
      }
    }

    const fallbackText = suggestions.length
      ? `Maaf, saya belum menemukan jawaban untuk pertanyaan tersebut. Mungkin yang Anda maksud:\n\n${suggestions
          .map((s, i) => `${i + 1}. ${s}`)
          .join("\n")}\n\nJika bukan, pertanyaan Anda akan diteruskan ke admin.`
      : "Pertanyaan Anda akan diteruskan ke admin.";

    await supabase.from("chat_messages").insert({
      conversation_id,
      sender_name: "Asisten AJMS",
      sender_role: "system",
      content: fallbackText,
      message_type: "system",
    });
    await supabase
      .from("chat_conversations")
      .update({
        status: "menunggu_admin",
        last_message: fallbackText,
        last_message_at: new Date().toISOString(),
        unread_admin_count: 1,
      })
      .eq("id", conversation_id);

    return new Response(JSON.stringify({ matched: false, suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
