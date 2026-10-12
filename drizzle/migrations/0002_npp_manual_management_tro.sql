DROP POLICY IF EXISTS "Admins manage NPP datasets" ON public.npp_election_datasets;
CREATE POLICY "NPP admins and TRO" ON public.npp_election_datasets FOR ALL TO authenticated USING (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'staff_tro')) WITH CHECK (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'staff_tro'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.npp_election_datasets TO authenticated;
GRANT ALL ON public.npp_election_datasets TO service_role;
CREATE OR REPLACE FUNCTION public.manage_npp_unit(_dataset_id uuid, _action text, _original jsonb DEFAULT NULL, _record jsonb DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE d public.npp_election_datasets; next_records jsonb; next_id uuid; next_record jsonb; found_count int;
BEGIN
 IF NOT (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'staff_tro')) THEN RAISE EXCEPTION 'Akses NPP ditolak' USING ERRCODE='42501'; END IF;
 IF _action NOT IN ('add','edit','delete') THEN RAISE EXCEPTION 'Tindakan tidak valid'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('npp_manual_management'));
 SELECT * INTO d FROM public.npp_election_datasets ORDER BY created_at DESC,id ASC LIMIT 1;
 IF d.id IS DISTINCT FROM _dataset_id THEN RAISE EXCEPTION 'Data telah berubah. Muat ulang sebelum menyimpan.'; END IF;
 IF _action IN ('edit','delete') THEN
  SELECT count(*) INTO found_count FROM jsonb_array_elements(d.records) r WHERE r = _original;
  IF found_count <> 1 THEN RAISE EXCEPTION 'Unit telah berubah. Muat ulang sebelum menyimpan.'; END IF;
 END IF;
 IF _action IN ('add','edit') THEN
  IF jsonb_typeof(_record) <> 'object' OR coalesce(trim(_record->>'unit'),'') = '' OR length(_record->>'unit') > 50 OR coalesce(trim(_record->>'owner'),'') = '' OR length(_record->>'owner') > 300 THEN RAISE EXCEPTION 'Nomor unit dan nama pemilik wajib diisi'; END IF;
  IF (_record->>'npp') IS NOT NULL AND (jsonb_typeof(_record->'npp') <> 'number' OR (_record->>'npp')::numeric < 0) THEN RAISE EXCEPTION 'NPP harus angka tidak negatif'; END IF;
  IF (_record->>'area') IS NOT NULL AND (jsonb_typeof(_record->'area') <> 'number' OR (_record->>'area')::numeric < 0) THEN RAISE EXCEPTION 'Luas harus angka tidak negatif'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(d.records) r WHERE upper(trim(r->>'unit')) = upper(trim(_record->>'unit')) AND (_action='add' OR r <> _original)) THEN RAISE EXCEPTION 'Nomor unit sudah tercatat'; END IF;
  next_record := _record;
  IF _action='add' THEN next_record := jsonb_set(next_record,'{row}',to_jsonb((SELECT coalesce(max((r->>'row')::int),0)+1 FROM jsonb_array_elements(coalesce(d.records,'[]')) r))); END IF;
 END IF;
 SELECT coalesce(jsonb_agg(CASE WHEN _action='edit' AND r = _original THEN next_record ELSE r END ORDER BY ord),'[]'::jsonb) INTO next_records FROM jsonb_array_elements(coalesce(d.records,'[]')) WITH ORDINALITY AS x(r,ord) WHERE NOT (_action='delete' AND r = _original);
 IF _action='add' THEN next_records := next_records || jsonb_build_array(next_record); END IF;
 INSERT INTO public.npp_election_datasets(source_name,records,owner_aliases,created_by) VALUES (coalesce(d.source_name,'Input manual NPP'),next_records,coalesce(d.owner_aliases,'{}'),auth.uid()) RETURNING id INTO next_id;
 RETURN next_id;
END;
$$;
REVOKE ALL ON FUNCTION public.manage_npp_unit(uuid,text,jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manage_npp_unit(uuid,text,jsonb,jsonb) TO authenticated;