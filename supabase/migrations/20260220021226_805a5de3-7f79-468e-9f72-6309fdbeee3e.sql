
-- Buat tabel notifikasi sistem untuk menampung notifikasi antar pengguna
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success'
  target_roles TEXT[] NOT NULL DEFAULT '{}', -- role yang dituju
  is_read_by JSONB NOT NULL DEFAULT '{}', -- {user_id: timestamp}
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Semua yang login bisa membaca notifikasi yang ditujukan ke role mereka
CREATE POLICY "Users can read system notifications"
ON public.system_notifications
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Hanya super_admin, admin, staff_finance, staff_tro yang bisa insert notifikasi
CREATE POLICY "Admins can insert system notifications"
ON public.system_notifications
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- User bisa update (untuk mark as read)
CREATE POLICY "Users can update notifications they can see"
ON public.system_notifications
FOR UPDATE
USING (auth.uid() IS NOT NULL);
