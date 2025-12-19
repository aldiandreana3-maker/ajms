-- Add verification status and rental_status to parking_subscriptions
ALTER TABLE public.parking_subscriptions
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'proses' CHECK (verification_status IN ('proses', 'terverifikasi')),
ADD COLUMN IF NOT EXISTS rental_status TEXT DEFAULT 'pemilik' CHECK (rental_status IN ('pemilik', 'sewa'));

-- Add penghuni_name to foreign_guest_reports if not exists
ALTER TABLE public.foreign_guest_reports
ADD COLUMN IF NOT EXISTS penghuni_name TEXT;