
CREATE TABLE public.data_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_number TEXT NOT NULL,
  tower TEXT NOT NULL,
  floor INTEGER NOT NULL,
  unit_no INTEGER NOT NULL,
  kwh_id TEXT,
  sisa_kwh NUMERIC DEFAULT 0,
  tanggal_bypass DATE,
  tanggal_normalisasi DATE,
  status TEXT NOT NULL DEFAULT 'normalisasi',
  catatan TEXT,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(unit_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_tokens TO authenticated;
GRANT ALL ON public.data_tokens TO service_role;

ALTER TABLE public.data_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage data_tokens" ON public.data_tokens
  FOR ALL TO authenticated
  USING (public.is_admin_or_above(auth.uid()))
  WITH CHECK (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Staff view data_tokens" ON public.data_tokens
  FOR SELECT TO authenticated
  USING (public.is_staff_or_above(auth.uid()));

CREATE TRIGGER update_data_tokens_updated_at
  BEFORE UPDATE ON public.data_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.data_token_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_token_id UUID REFERENCES public.data_tokens(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  old_catatan TEXT,
  new_catatan TEXT,
  changed_by UUID,
  changed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.data_token_history TO authenticated;
GRANT ALL ON public.data_token_history TO service_role;

ALTER TABLE public.data_token_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view history" ON public.data_token_history
  FOR SELECT TO authenticated
  USING (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Authenticated insert history" ON public.data_token_history
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_above(auth.uid()));

CREATE INDEX idx_data_tokens_unit ON public.data_tokens(unit_number);
CREATE INDEX idx_data_tokens_tower ON public.data_tokens(tower);
CREATE INDEX idx_data_tokens_status ON public.data_tokens(status);
CREATE INDEX idx_data_token_history_token ON public.data_token_history(data_token_id);
