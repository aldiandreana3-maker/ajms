-- Add photo columns to parking_subscriptions
ALTER TABLE public.parking_subscriptions
ADD COLUMN IF NOT EXISTS ktp_photo_url TEXT,
ADD COLUMN IF NOT EXISTS stnk_photo_url TEXT,
ADD COLUMN IF NOT EXISTS rental_agreement_url TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Add photo columns to access_cards
ALTER TABLE public.access_cards
ADD COLUMN IF NOT EXISTS ktp_photo_url TEXT,
ADD COLUMN IF NOT EXISTS surat_kuasa_url TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Add photo column to goods_movement for KTP
ALTER TABLE public.goods_movement
ADD COLUMN IF NOT EXISTS ktp_photo_url TEXT;