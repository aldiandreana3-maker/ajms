-- Create function for super admin to reset user password
-- This requires service role key, so we'll create a table to track password resets

CREATE TABLE IF NOT EXISTS public.admin_password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  new_password TEXT NOT NULL,
  reset_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_used BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.admin_password_resets ENABLE ROW LEVEL SECURITY;

-- Only super_admin can view and manage password resets
CREATE POLICY "Super admins can manage password resets"
ON public.admin_password_resets
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));