import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_data_token",
  title: "Cari data token listrik",
  description: "Mencari status dan catatan token listrik unit yang dapat diakses pengguna AJMS.",
  inputSchema: {
    unit_number: z.string().trim().min(1).max(20).describe("Nomor unit, misalnya A0202 atau KOA1."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ unit_number }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Silakan masuk dengan akun AJMS." }], isError: true };
    }

    const { data, error } = await supabaseForUser(ctx)
      .from("data_tokens")
      .select("unit_number,tower,floor,kwh_id,sisa_kwh,tanggal_bypass,tanggal_normalisasi,status,catatan,no_wa,atas_nama,updated_at")
      .ilike("unit_number", unit_number)
      .limit(20);

    if (error) return { content: [{ type: "text", text: `Gagal membaca data token: ${error.message}` }], isError: true };

    const tokens = (data ?? []).map((token) => ({
      unit_number: token.unit_number,
      tower: token.tower,
      floor: token.floor,
      kwh_id: token.kwh_id,
      remaining_kwh: token.sisa_kwh,
      bypass_date: token.tanggal_bypass,
      normalization_date: token.tanggal_normalisasi,
      status: token.status,
      notes: token.catatan,
      whatsapp: token.no_wa,
      account_name: token.atas_nama,
      updated_at: token.updated_at,
    }));

    return {
      content: [{ type: "text", text: tokens.length ? `Ditemukan ${tokens.length} data token.` : "Data token unit tidak ditemukan." }],
      structuredContent: { tokens },
    };
  },
});