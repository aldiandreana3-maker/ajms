INSERT INTO public.dashboard_settings (setting_key, setting_value, description)
VALUES
  ('total_pendapatan_override', 0, 'Override Total Pendapatan di Laporan Keuangan (0 = pakai data otomatis)'),
  ('total_pengeluaran_override', 0, 'Override Total Pengeluaran di Laporan Keuangan (0 = pakai data otomatis)')
ON CONFLICT (setting_key) DO NOTHING;