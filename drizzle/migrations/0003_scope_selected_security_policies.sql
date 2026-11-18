ALTER POLICY "Penghuni can insert own keluhan" ON public.keluhan TO authenticated WITH CHECK (created_by = (SELECT auth.uid()));
ALTER POLICY "Penghuni can insert own access cards" ON public.access_cards TO authenticated WITH CHECK (created_by = (SELECT auth.uid()));
ALTER POLICY "Penghuni can insert own work permits" ON public.work_permits TO authenticated WITH CHECK (created_by = (SELECT auth.uid()));
ALTER POLICY "Penghuni can insert own parking subscriptions" ON public.parking_subscriptions TO authenticated WITH CHECK (created_by = (SELECT auth.uid()));

ALTER POLICY "Users can read system notifications" ON public.system_notifications TO authenticated USING (public.is_admin_or_above(auth.uid()) OR EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role::text = ANY(target_roles)));
ALTER POLICY "Users can update own read status" ON public.system_notifications TO authenticated USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role::text = ANY(target_roles))) WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role::text = ANY(target_roles)));
CREATE OR REPLACE FUNCTION public.protect_notification_read_update() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF public.is_admin_or_above(auth.uid()) THEN RETURN NEW; END IF;
 IF auth.uid() IS NULL OR (to_jsonb(NEW) - 'is_read_by' - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'is_read_by' - 'updated_at') OR (NEW.is_read_by - auth.uid()::text) IS DISTINCT FROM (OLD.is_read_by - auth.uid()::text) OR jsonb_typeof(NEW.is_read_by) <> 'object' THEN
  RAISE EXCEPTION 'Perubahan notifikasi tidak diizinkan' USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER protect_notification_read_update BEFORE UPDATE ON public.system_notifications FOR EACH ROW EXECUTE FUNCTION public.protect_notification_read_update();

ALTER POLICY "Anyone authenticated view shifts" ON public.shift_definitions TO authenticated USING (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'staff_hrd_ga') OR EXISTS (SELECT 1 FROM public.employee_shift_schedules s WHERE s.user_id=auth.uid() AND s.shift_id=shift_definitions.id));
ALTER POLICY "Anyone authenticated can insert queue" ON public.cashier_queues TO authenticated WITH CHECK (created_by = auth.uid() AND status='waiting' AND queue_date=(now() AT TIME ZONE 'Asia/Jakarta')::date AND called_at IS NULL AND completed_at IS NULL);
ALTER POLICY "Anyone authenticated can view queues" ON public.cashier_queues TO authenticated USING (created_by=auth.uid());
CREATE OR REPLACE FUNCTION public.public_queue_status() RETURNS TABLE(id uuid,queue_number text,queue_date date,status text,called_at timestamptz,completed_at timestamptz,created_by uuid,created_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT q.id,q.queue_number,q.queue_date,q.status,q.called_at,q.completed_at,NULL::uuid,q.created_at FROM public.cashier_queues q WHERE q.queue_date=(now() AT TIME ZONE 'Asia/Jakarta')::date ORDER BY q.created_at,q.id;
$$;
REVOKE ALL ON FUNCTION public.public_queue_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_queue_status() TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.take_queue_number() RETURNS TABLE(id uuid,queue_number text,queue_date date,status text,called_at timestamptz,completed_at timestamptz,created_by uuid,created_at timestamptz) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE d date := (now() AT TIME ZONE 'Asia/Jakarta')::date; n integer; q public.cashier_queues;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('cashier_queue_'||d::text));
 SELECT coalesce(max(substring(c.queue_number from '^A([0-9]+)$')::integer),0)+1 INTO n FROM public.cashier_queues c WHERE c.queue_date=d;
 INSERT INTO public.cashier_queues(queue_number,queue_date,status,created_by) VALUES ('A'||lpad(n::text,greatest(3,length(n::text)),'0'),d,'waiting',auth.uid()) RETURNING * INTO q;
 RETURN QUERY SELECT q.id,q.queue_number,q.queue_date,q.status,q.called_at,q.completed_at,NULL::uuid,q.created_at;
END; $$;
REVOKE ALL ON FUNCTION public.take_queue_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.take_queue_number() TO anon,authenticated,service_role;

ALTER POLICY "Anyone can view bill rates" ON public.bill_rates TO authenticated USING (is_active = true OR public.is_admin_or_above(auth.uid()));
ALTER POLICY "Anyone authenticated can view water tariff" ON public.water_tariff_settings TO authenticated USING (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(),'staff_engineering') OR public.has_role(auth.uid(),'staff_finance') OR public.has_role(auth.uid(),'staff_kasir') OR public.has_role(auth.uid(),'staff_tro') OR EXISTS (SELECT 1 FROM public.get_user_unit_ids(auth.uid())));
ALTER POLICY "Authenticated can view agents" ON public.agents TO authenticated USING (is_active = true OR public.is_admin_or_above(auth.uid()));
ALTER POLICY "Authenticated can view gallery" ON public.agent_gallery TO authenticated USING (public.is_admin_or_above(auth.uid()) OR EXISTS (SELECT 1 FROM public.agents a WHERE a.id=agent_gallery.agent_id AND a.is_active=true));
ALTER POLICY "Authenticated can view agent_units" ON public.agent_units TO authenticated USING (public.is_admin_or_above(auth.uid()) OR EXISTS (SELECT 1 FROM public.agents a WHERE a.id=agent_units.agent_id AND a.is_active=true));
ALTER POLICY "Authenticated can view data_tokens" ON public.data_tokens TO authenticated USING (public.is_admin_or_above(auth.uid()) OR public.user_owns_unit_number(auth.uid(),unit_number) OR EXISTS (SELECT 1 FROM public.units u WHERE u.id IN (SELECT public.get_user_unit_ids(auth.uid())) AND upper(u.unit_number)=upper(data_tokens.unit_number)));
DROP POLICY "System insert audit" ON public.finance_audit_log;
ALTER POLICY "Authenticated can view user roles" ON public.user_roles TO authenticated USING (user_id=auth.uid());

ALTER POLICY "Anyone can view dashboard settings" ON public.dashboard_settings TO authenticated USING (public.is_admin_or_above(auth.uid()));
CREATE OR REPLACE FUNCTION public.public_dashboard_settings() RETURNS TABLE(setting_key text,setting_value integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT s.setting_key,s.setting_value FROM public.dashboard_settings s WHERE s.setting_key IN ('total_units','penghuni_aktif','data_komersil');
$$;
REVOKE ALL ON FUNCTION public.public_dashboard_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_dashboard_settings() TO anon,authenticated,service_role;
ALTER POLICY "Anyone can view system status" ON public.system_activation TO authenticated USING (public.is_admin_or_above(auth.uid()));
CREATE OR REPLACE FUNCTION public.public_system_status() RETURNS TABLE(system_status text,monthly_status text,monthly_notification_enabled boolean,activated_at timestamptz,deactivated_at timestamptz) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT s.system_status,s.monthly_status,s.monthly_notification_enabled,CASE WHEN public.is_admin_or_above(auth.uid()) THEN s.activated_at END,CASE WHEN public.is_admin_or_above(auth.uid()) THEN s.deactivated_at END FROM public.system_activation s ORDER BY s.created_at,s.id LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.public_system_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_system_status() TO anon,authenticated,service_role;

ALTER POLICY "Authenticated upload news images" ON storage.objects TO authenticated WITH CHECK (bucket_id='news-images' AND owner_id=auth.uid()::text AND public.is_admin_or_above(auth.uid()));
ALTER POLICY "Authenticated delete news images" ON storage.objects TO authenticated USING (bucket_id='news-images' AND public.is_admin_or_above(auth.uid()));
ALTER POLICY "Authenticated update news images" ON storage.objects TO authenticated USING (bucket_id='news-images' AND public.is_admin_or_above(auth.uid())) WITH CHECK (bucket_id='news-images' AND public.is_admin_or_above(auth.uid()));
ALTER POLICY "Authenticated can view package photos" ON storage.objects TO authenticated USING (bucket_id='packages' AND (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(),'staff_tro')));