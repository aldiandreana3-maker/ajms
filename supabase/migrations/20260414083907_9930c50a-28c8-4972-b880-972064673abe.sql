
-- Add new columns to chart_of_accounts matching Excel format
ALTER TABLE public.chart_of_accounts 
  ADD COLUMN IF NOT EXISTS is_detail boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS up_level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS map_to_neraca text DEFAULT '',
  ADD COLUMN IF NOT EXISTS map_to_cash_flow text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pos_budget text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sumber_dana text DEFAULT '';

-- Create audit log table
CREATE TABLE public.coa_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  action text NOT NULL, -- 'create', 'update', 'delete'
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coa_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admin+ can view audit logs
CREATE POLICY "Admin+ can view COA audit logs"
  ON public.coa_audit_log FOR SELECT TO authenticated
  USING (public.is_admin_or_above(auth.uid()));

-- Admin+ can insert audit logs
CREATE POLICY "Admin+ can insert COA audit logs"
  ON public.coa_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_above(auth.uid()));
