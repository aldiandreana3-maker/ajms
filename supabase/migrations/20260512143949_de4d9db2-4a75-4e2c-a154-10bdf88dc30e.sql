
-- Enable extensions for cron worker
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Campaigns table
CREATE TABLE public.wa_blast_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  message_template text NOT NULL,
  media_url text,
  media_filename text,
  daily_cap integer NOT NULL DEFAULT 50,
  send_hour_start smallint NOT NULL DEFAULT 8,
  send_hour_end smallint NOT NULL DEFAULT 21,
  min_delay_seconds integer NOT NULL DEFAULT 30,
  max_delay_seconds integer NOT NULL DEFAULT 90,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'active',
  total_contacts integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_by_name text,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_campaigns_status ON public.wa_blast_campaigns(status);
CREATE INDEX idx_wa_campaigns_created_at ON public.wa_blast_campaigns(created_at DESC);

ALTER TABLE public.wa_blast_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage campaigns" ON public.wa_blast_campaigns
  FOR ALL TO authenticated
  USING (is_admin_or_above(auth.uid()))
  WITH CHECK (is_admin_or_above(auth.uid()));

CREATE TRIGGER wa_blast_campaigns_updated_at
  BEFORE UPDATE ON public.wa_blast_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Queue table
CREATE TABLE public.wa_blast_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.wa_blast_campaigns(id) ON DELETE CASCADE,
  contact_name text,
  contact_unit text,
  contact_phone text NOT NULL,
  scheduled_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_queue_campaign ON public.wa_blast_queue(campaign_id);
CREATE INDEX idx_wa_queue_status_date ON public.wa_blast_queue(status, scheduled_date);

ALTER TABLE public.wa_blast_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage queue" ON public.wa_blast_queue
  FOR ALL TO authenticated
  USING (is_admin_or_above(auth.uid()))
  WITH CHECK (is_admin_or_above(auth.uid()));

CREATE TRIGGER wa_blast_queue_updated_at
  BEFORE UPDATE ON public.wa_blast_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
