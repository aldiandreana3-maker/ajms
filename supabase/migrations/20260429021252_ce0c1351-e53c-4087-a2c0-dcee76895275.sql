ALTER TABLE public.parking_subscriptions
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS receipt_photo_url text;