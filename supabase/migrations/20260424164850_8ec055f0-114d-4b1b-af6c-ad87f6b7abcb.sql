
CREATE TABLE public.wa_blast_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID,
  sender_name TEXT,
  gateway TEXT NOT NULL DEFAULT 'fonnte',
  message TEXT NOT NULL,
  media_url TEXT,
  safety_mode TEXT,
  total_contacts INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  cancelled_count INTEGER NOT NULL DEFAULT 0,
  contacts_snapshot JSONB,
  results JSONB,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wa_blast_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage wa_blast_history"
  ON public.wa_blast_history
  FOR ALL
  TO authenticated
  USING (public.is_admin_or_above(auth.uid()))
  WITH CHECK (public.is_admin_or_above(auth.uid()));

CREATE TRIGGER wa_blast_history_updated_at
  BEFORE UPDATE ON public.wa_blast_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_wa_blast_history_created_at ON public.wa_blast_history(created_at DESC);
CREATE INDEX idx_wa_blast_history_sender ON public.wa_blast_history(sender_id);
