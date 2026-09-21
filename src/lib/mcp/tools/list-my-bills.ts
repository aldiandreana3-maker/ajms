import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_bills",
  title: "Daftar tagihan saya",
  description: "Menampilkan tagihan AJMS yang dapat diakses oleh pengguna yang sedang masuk.",
  inputSchema: {
    status: z.enum(["all", "unpaid", "partial", "paid"]).default("all").describe("Status pembayaran yang dicari."),
    limit: z.number().int().min(1).max(100).default(20).describe("Jumlah maksimal tagihan."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Silakan masuk dengan akun AJMS." }], isError: true };
    }

    let query = supabaseForUser(ctx)
      .from("bills")
      .select("id,unit_number,quarter_label,bill_type,total_amount,due_date,payment_status,paid_amount,paid_at,notes")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status !== "all") query = query.eq("payment_status", status);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: `Gagal membaca tagihan: ${error.message}` }], isError: true };

    const bills = (data ?? []).map((bill) => ({
      id: bill.id,
      unit_number: bill.unit_number,
      period: bill.quarter_label,
      type: bill.bill_type,
      total_amount: bill.total_amount,
      due_date: bill.due_date,
      payment_status: bill.payment_status,
      paid_amount: bill.paid_amount,
      paid_at: bill.paid_at,
      notes: bill.notes,
    }));

    return {
      content: [{ type: "text", text: bills.length ? `Ditemukan ${bills.length} tagihan.` : "Tidak ada tagihan yang ditemukan." }],
      structuredContent: { bills },
    };
  },
});