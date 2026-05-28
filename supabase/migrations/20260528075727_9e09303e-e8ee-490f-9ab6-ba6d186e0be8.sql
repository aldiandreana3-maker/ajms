ALTER TABLE public.system_activation 
ADD COLUMN IF NOT EXISTS monthly_notification_enabled boolean NOT NULL DEFAULT true;