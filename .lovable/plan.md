
# Rencana Penyempurnaan Finance

Bekerja bertahap. Turn ini fokus pondasi DB + fitur inti. Modul lanjutan (Aging AR & Depresiasi) menyusul setelah fondasi tervalidasi.

## Fase 1 — Database & Backend (migration)

Buat/perkuat tabel:

1. `finance_audit_log` — audit universal untuk semua tabel finance (bills, bill_payments, cashier_transactions, journal_entries, expenses).
   - Fields: table_name, record_id, action (create/update/delete/reverse), old_data (jsonb), new_data (jsonb), changed_by, changed_by_name, changed_by_role, ip_address, created_at.
   - Trigger otomatis di 5 tabel di atas → tulis ke log.

2. `berita_acara_koreksi` — request koreksi/reversal.
   - Fields: ba_number (auto `BA-YYMMDD-XXX`), target_table, target_record_id, requested_by, requested_by_name, reason (text), old_data (jsonb), proposed_new_data (jsonb), attachment_url, signature_url, status (`pending`/`approved`/`rejected`), reviewed_by, reviewed_by_name, reviewed_at, review_notes.
   - Function `generate_ba_number()` untuk penomoran harian.
   - Trigger: saat status → `approved`, otomatis apply perubahan ke record target + log ke `finance_audit_log` (action=`reverse` / `update`).

3. `unit_billing_status` — status cut-off unit.
   - Fields: unit_id (unique), status (`aktif`/`peringatan`/`cut_off`), overdue_months, last_paid_month, cutoff_at, cutoff_reason, updated_at.
   - Function `refresh_unit_billing_status()` — hitung bulan tunggakan berturut-turut dari `bills` (bill_type=IPL, unpaid). Set `cut_off` bila ≥ 3 bulan.

4. Perkuat `bills` untuk cicilan (kolom sudah ada `paid_amount`) — tambah trigger auto-update `payment_status`:
   - `paid_amount = 0` → `belum_bayar`
   - `0 < paid_amount < amount` → `cicilan`
   - `paid_amount ≥ amount` → `lunas`

5. RLS/GRANT lengkap; hanya Super Admin/Master Dev boleh `UPDATE` bills/bill_payments/cashier_transactions langsung. Admin/staff_finance hanya `INSERT`. `DELETE` diblokir kecuali via approved BA.

## Fase 2 — UI Finance

**Halaman baru** `src/pages/kepengelolaan/finance/BeritaAcara.tsx`
- List BA (pending/approved/rejected) dengan filter.
- Tombol "Buat Berita Acara" (Admin/Kasir) — form: pilih transaksi target, alasan, proposed changes, upload lampiran, canvas tanda tangan.
- Tombol "Approve/Reject" (Super Admin only) + WA notifikasi via existing `send-whatsapp-fonnte` edge function.
- Cetak BA sebagai PDF (window.print template).

**Halaman baru** `src/pages/kepengelolaan/finance/AuditLog.tsx`
- Riwayat semua perubahan finance, filter by table/user/date, side-by-side diff old vs new.

**Update** `BillTable`, `CashierTransactions`, kartu invoice:
- Sembunyikan tombol Edit/Delete untuk non-Super-Admin, ganti dengan tombol "Ajukan Koreksi (BA)".
- Tambah dialog "Bayar Sebagian" — input nominal < total, catat ke `bill_payments`, update `paid_amount`, tampilkan sisa tunggakan.

**Update** kartu Finance hub — tambah 2 card: "Berita Acara Koreksi" & "Audit Log".

## Fase 3 — Cut-off Automation

**Edge function** `supabase/functions/check-unit-cutoff/index.ts` (cron harian):
- Panggil `refresh_unit_billing_status()`.
- Unit yang baru masuk status `cut_off` → kirim WA ke penghuni + broadcast ke admin.

**Guard baru** `src/components/shared/CutoffGuard.tsx`:
- Cek `unit_billing_status` user aktif. Bila `cut_off`, blokir submit form di: Keluhan, Paket, Izin Kerja, Kartu Akses, Keluar Masuk Barang (tampilkan banner "Unit Anda cut-off — lunasi tunggakan").
- Tetap boleh view & bayar tagihan.

## Fase 4 — Laporan Lanjutan (turn berikutnya)

- Halaman `AgingAR.tsx` — bucket 0-30 / 31-60 / 61-90 / >90 hari, group per unit, export Excel.
- Halaman `DepresiasiAset.tsx` — tabel aset (nama, tanggal perolehan, harga, umur ekonomis, metode straight-line), auto-post jurnal depresiasi bulanan ke `journal_entries`.

## Fase 5 — Test & Verifikasi

- Playwright: submit cicilan → cek sisa, buat BA → approve sbg super admin → verifikasi record berubah + log tercatat.

---

## Catatan Teknis

- BA approval flow: DB trigger jadi single source of truth agar tak bisa diakali dari client.
- Semua perubahan `bills.amount` / `bill_payments.amount` di luar alur BA akan ditolak trigger (raise exception bila `current_setting('app.bypass_audit', true) IS NULL AND user bukan master_dev`).
- WA menggunakan FONNTE token yang sudah tersedia.
- Notifikasi Super Admin ambil daftar user dari `user_roles` role `super_admin`/`master_dev`.

Fase 1–3 dikerjakan turn ini. Konfirmasi lanjut?
