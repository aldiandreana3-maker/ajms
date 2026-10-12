CREATE TABLE public.service_print_archives (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 service_key text NOT NULL,
 unit_number text NOT NULL,
 title text NOT NULL DEFAULT '',
 header_text text NOT NULL DEFAULT '',
 body_text text NOT NULL DEFAULT '',
 footer_text text NOT NULL DEFAULT '',
 orientation text NOT NULL DEFAULT 'portrait' CHECK (orientation IN ('portrait','landscape')),
 updated_by uuid,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(service_key, unit_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_print_archives TO authenticated;
GRANT ALL ON public.service_print_archives TO service_role;
ALTER TABLE public.service_print_archives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage print archives" ON public.service_print_archives FOR ALL TO authenticated USING (public.is_admin_or_above(auth.uid())) WITH CHECK (public.is_admin_or_above(auth.uid()));