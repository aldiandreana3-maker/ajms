CREATE TABLE public.penghuni_updates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_number text NOT NULL,
  full_name text NOT NULL,
  tower text,
  penghuni_status text,
  owner_agent_name text,
  lama_tinggal text,
  phone text,
  email text,
  emergency_name text,
  emergency_phone text,
  emergency_relation text,
  special_conditions text[] NOT NULL DEFAULT '{}',
  lansia_name text,
  balita_name text,
  ibu_hamil_name text,
  health_name text,
  health_note text,
  other_condition_note text,
  declaration_accepted boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'belum_diperbarui',
  last_updated_at timestamptz,
  updated_by uuid,
  updated_by_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX penghuni_updates_unit_name_key
  ON public.penghuni_updates (upper(unit_number), lower(full_name));
CREATE INDEX penghuni_updates_status_idx ON public.penghuni_updates (status);
CREATE INDEX penghuni_updates_updated_by_idx ON public.penghuni_updates (updated_by);

GRANT SELECT, INSERT, UPDATE ON public.penghuni_updates TO authenticated;
GRANT ALL ON public.penghuni_updates TO service_role;

ALTER TABLE public.penghuni_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all penghuni updates"
  ON public.penghuni_updates FOR SELECT TO authenticated
  USING (public.is_staff_or_above(auth.uid()));

CREATE POLICY "Users can view their own penghuni updates"
  ON public.penghuni_updates FOR SELECT TO authenticated
  USING (updated_by = auth.uid());

CREATE POLICY "Users can create their own penghuni updates"
  ON public.penghuni_updates FOR INSERT TO authenticated
  WITH CHECK (updated_by = auth.uid() OR public.is_staff_or_above(auth.uid()));

CREATE POLICY "Users can update their own penghuni updates"
  ON public.penghuni_updates FOR UPDATE TO authenticated
  USING (updated_by = auth.uid() OR public.is_staff_or_above(auth.uid()))
  WITH CHECK (updated_by = auth.uid() OR public.is_staff_or_above(auth.uid()));

CREATE TRIGGER trg_penghuni_updates_updated_at
  BEFORE UPDATE ON public.penghuni_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.penghuni_update_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  penghuni_update_id uuid REFERENCES public.penghuni_updates(id) ON DELETE SET NULL,
  unit_number text,
  full_name text,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.penghuni_update_history TO authenticated;
GRANT ALL ON public.penghuni_update_history TO service_role;

ALTER TABLE public.penghuni_update_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view penghuni update history"
  ON public.penghuni_update_history FOR SELECT TO authenticated
  USING (public.is_staff_or_above(auth.uid()));

CREATE OR REPLACE FUNCTION public.log_penghuni_update_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.penghuni_update_history(penghuni_update_id, unit_number, full_name, old_data, new_data, changed_by, changed_by_name)
  VALUES (NEW.id, NEW.unit_number, NEW.full_name,
          CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) END,
          to_jsonb(NEW), auth.uid(), NEW.updated_by_name);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_penghuni_updates_history
  AFTER INSERT OR UPDATE ON public.penghuni_updates
  FOR EACH ROW EXECUTE FUNCTION public.log_penghuni_update_change();