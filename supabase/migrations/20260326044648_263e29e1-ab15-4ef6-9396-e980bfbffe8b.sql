
CREATE TABLE public.bicycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  brand text NOT NULL,
  photo_url text,
  owner_name text,
  unit_number text,
  unit_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bicycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view bicycles" ON public.bicycles FOR SELECT TO authenticated USING (is_staff_or_above(auth.uid()));
CREATE POLICY "Admin can manage bicycles" ON public.bicycles FOR ALL TO authenticated USING (is_admin_or_above(auth.uid())) WITH CHECK (is_admin_or_above(auth.uid()));
CREATE POLICY "Staff can insert bicycles" ON public.bicycles FOR INSERT TO authenticated WITH CHECK (is_staff_or_above(auth.uid()));
CREATE POLICY "Staff can update bicycles" ON public.bicycles FOR UPDATE TO authenticated USING (is_staff_or_above(auth.uid())) WITH CHECK (is_staff_or_above(auth.uid()));
