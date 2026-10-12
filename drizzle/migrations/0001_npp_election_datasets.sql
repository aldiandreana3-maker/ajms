CREATE TABLE public.npp_election_datasets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_name text NOT NULL,
 records jsonb NOT NULL DEFAULT '[]'::jsonb,
 owner_aliases jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_by uuid,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.npp_election_datasets TO authenticated;
GRANT ALL ON public.npp_election_datasets TO service_role;
ALTER TABLE public.npp_election_datasets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage NPP datasets" ON public.npp_election_datasets FOR ALL TO authenticated USING (public.is_admin_or_above(auth.uid())) WITH CHECK (public.is_admin_or_above(auth.uid()));
CREATE INDEX npp_election_datasets_created_idx ON public.npp_election_datasets(created_at DESC, id);
COMMENT ON TABLE public.npp_election_datasets IS 'Versioned election NPP source snapshots. Original records immutable in app; owner aliases are separate manual grouping overrides.';