
-- Add master_dev to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'master_dev';
