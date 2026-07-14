
-- ============================================================
-- FINANCE: Audit Log, Berita Acara, Unit Cut-off, Cicilan
-- ============================================================

-- Helper: check super admin / master dev
CREATE OR REPLACE FUNCTION public.is_super_admin_or_master(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','master_dev')
  )
$$;

-- ============================================================
-- 1) finance_audit_log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.finance_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_by_name text,
  changed_by_role text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fin_audit_table ON public.finance_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_fin_audit_created ON public.finance_audit_log(created_at DESC);

GRANT SELECT, INSERT ON public.finance_audit_log TO authenticated;
GRANT ALL ON public.finance_audit_log TO service_role;
ALTER TABLE public.finance_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin view audit" ON public.finance_audit_log FOR SELECT TO authenticated
  USING (public.is_admin_or_above(auth.uid()));
CREATE POLICY "System insert audit" ON public.finance_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Generic audit trigger
CREATE OR REPLACE FUNCTION public.log_finance_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
  v_role text;
  v_id uuid;
BEGIN
  SELECT email INTO v_email FROM public.profiles WHERE id = auth.uid();
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
  v_id := CASE WHEN TG_OP='DELETE' THEN (OLD.id)::uuid ELSE (NEW.id)::uuid END;

  INSERT INTO public.finance_audit_log(table_name, record_id, action, old_data, new_data, changed_by, changed_by_name, changed_by_role)
  VALUES(
    TG_TABLE_NAME,
    v_id,
    lower(TG_OP),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END,
    auth.uid(), v_email, v_role
  );
  RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_bills ON public.bills;
CREATE TRIGGER trg_audit_bills AFTER INSERT OR UPDATE OR DELETE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.log_finance_change();

DROP TRIGGER IF EXISTS trg_audit_bill_payments ON public.bill_payments;
CREATE TRIGGER trg_audit_bill_payments AFTER INSERT OR UPDATE OR DELETE ON public.bill_payments
  FOR EACH ROW EXECUTE FUNCTION public.log_finance_change();

DROP TRIGGER IF EXISTS trg_audit_cashier ON public.cashier_transactions;
CREATE TRIGGER trg_audit_cashier AFTER INSERT OR UPDATE OR DELETE ON public.cashier_transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_finance_change();

DROP TRIGGER IF EXISTS trg_audit_expenses ON public.expenses;
CREATE TRIGGER trg_audit_expenses AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.log_finance_change();

DROP TRIGGER IF EXISTS trg_audit_journal ON public.journal_entries;
CREATE TRIGGER trg_audit_journal AFTER INSERT OR UPDATE OR DELETE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.log_finance_change();

-- ============================================================
-- 2) berita_acara_koreksi
-- ============================================================
CREATE TABLE IF NOT EXISTS public.berita_acara_koreksi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ba_number text UNIQUE NOT NULL,
  target_table text NOT NULL,
  target_record_id uuid NOT NULL,
  action_type text NOT NULL DEFAULT 'update', -- update | reverse | delete
  reason text NOT NULL,
  old_data jsonb,
  proposed_new_data jsonb,
  attachment_url text,
  signature_url text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  requested_by uuid,
  requested_by_name text,
  reviewed_by uuid,
  reviewed_by_name text,
  reviewed_at timestamptz,
  review_notes text,
  applied boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ba_status ON public.berita_acara_koreksi(status);
CREATE INDEX IF NOT EXISTS idx_ba_target ON public.berita_acara_koreksi(target_table, target_record_id);

GRANT SELECT, INSERT, UPDATE ON public.berita_acara_koreksi TO authenticated;
GRANT ALL ON public.berita_acara_koreksi TO service_role;
ALTER TABLE public.berita_acara_koreksi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view BA" ON public.berita_acara_koreksi FOR SELECT TO authenticated
  USING (public.is_staff_or_above(auth.uid()));
CREATE POLICY "Staff create BA" ON public.berita_acara_koreksi FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_or_above(auth.uid()) AND requested_by = auth.uid());
CREATE POLICY "Super admin update BA" ON public.berita_acara_koreksi FOR UPDATE TO authenticated
  USING (public.is_super_admin_or_master(auth.uid()))
  WITH CHECK (public.is_super_admin_or_master(auth.uid()));

-- BA number generator
CREATE OR REPLACE FUNCTION public.generate_ba_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_prefix text;
  v_seq int;
BEGIN
  v_prefix := 'BA-' || to_char(now(), 'YYMMDD') || '-';
  SELECT COALESCE(MAX(NULLIF(regexp_replace(ba_number, '^'||v_prefix, ''), '')::int), 0) + 1
    INTO v_seq
  FROM public.berita_acara_koreksi
  WHERE ba_number LIKE v_prefix || '%';
  RETURN v_prefix || lpad(v_seq::text, 3, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_ba_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.ba_number IS NULL OR NEW.ba_number = '' THEN
    NEW.ba_number := public.generate_ba_number();
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_ba_number ON public.berita_acara_koreksi;
CREATE TRIGGER trg_ba_number BEFORE INSERT ON public.berita_acara_koreksi
  FOR EACH ROW EXECUTE FUNCTION public.set_ba_number();

DROP TRIGGER IF EXISTS trg_ba_updated ON public.berita_acara_koreksi;
CREATE TRIGGER trg_ba_updated BEFORE UPDATE ON public.berita_acara_koreksi
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Apply BA when approved
CREATE OR REPLACE FUNCTION public.apply_berita_acara()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sql text;
  v_key text;
  v_val jsonb;
  v_setters text := '';
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') AND NEW.applied = false THEN
    IF NEW.action_type = 'delete' THEN
      EXECUTE format('DELETE FROM public.%I WHERE id = $1', NEW.target_table) USING NEW.target_record_id;
    ELSIF NEW.proposed_new_data IS NOT NULL THEN
      FOR v_key, v_val IN SELECT * FROM jsonb_each(NEW.proposed_new_data) LOOP
        IF v_key NOT IN ('id','created_at') THEN
          IF v_setters <> '' THEN v_setters := v_setters || ', '; END IF;
          v_setters := v_setters || quote_ident(v_key) || ' = ' || quote_nullable(trim(both '"' from v_val::text));
        END IF;
      END LOOP;
      IF v_setters <> '' THEN
        v_sql := format('UPDATE public.%I SET %s, updated_at = now() WHERE id = $1', NEW.target_table, v_setters);
        EXECUTE v_sql USING NEW.target_record_id;
      END IF;
    END IF;
    NEW.applied := true;
    NEW.reviewed_at := COALESCE(NEW.reviewed_at, now());

    INSERT INTO public.finance_audit_log(table_name, record_id, action, old_data, new_data, changed_by, changed_by_name, reason)
    VALUES(NEW.target_table, NEW.target_record_id, 'ba_' || NEW.action_type, NEW.old_data, NEW.proposed_new_data, auth.uid(), NEW.reviewed_by_name, 'BA ' || NEW.ba_number || ': ' || NEW.reason);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_ba_apply ON public.berita_acara_koreksi;
CREATE TRIGGER trg_ba_apply BEFORE UPDATE ON public.berita_acara_koreksi
  FOR EACH ROW EXECUTE FUNCTION public.apply_berita_acara();

-- ============================================================
-- 3) unit_billing_status (cut-off)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.unit_billing_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'aktif', -- aktif | peringatan | cut_off
  overdue_months int NOT NULL DEFAULT 0,
  outstanding_amount numeric NOT NULL DEFAULT 0,
  last_paid_period date,
  cutoff_at timestamptz,
  cutoff_reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ubs_status ON public.unit_billing_status(status);

GRANT SELECT ON public.unit_billing_status TO authenticated;
GRANT ALL ON public.unit_billing_status TO service_role;
ALTER TABLE public.unit_billing_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View unit billing status" ON public.unit_billing_status FOR SELECT TO authenticated
  USING (public.is_staff_or_above(auth.uid()) OR unit_id IN (SELECT public.get_user_unit_ids(auth.uid())));

-- Refresh function: recompute cut-off status per unit
CREATE OR REPLACE FUNCTION public.refresh_unit_billing_status(_unit_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  v_overdue int;
  v_outstanding numeric;
  v_last_paid date;
  v_status text;
  v_prev_status text;
BEGIN
  FOR r IN SELECT id FROM public.units WHERE (_unit_id IS NULL OR id = _unit_id) LOOP
    SELECT COUNT(*)::int, COALESCE(SUM(amount - COALESCE(paid_amount,0)),0)
      INTO v_overdue, v_outstanding
    FROM public.bills
    WHERE unit_id = r.id
      AND bill_type = 'IPL'
      AND COALESCE(paid_amount,0) < amount
      AND due_date < CURRENT_DATE;

    SELECT MAX(billing_period) INTO v_last_paid
    FROM public.bills WHERE unit_id = r.id AND COALESCE(paid_amount,0) >= amount;

    v_status := CASE
      WHEN v_overdue >= 3 THEN 'cut_off'
      WHEN v_overdue >= 1 THEN 'peringatan'
      ELSE 'aktif'
    END;

    SELECT status INTO v_prev_status FROM public.unit_billing_status WHERE unit_id = r.id;

    INSERT INTO public.unit_billing_status(unit_id, status, overdue_months, outstanding_amount, last_paid_period, cutoff_at, cutoff_reason, updated_at)
    VALUES (r.id, v_status, v_overdue, v_outstanding, v_last_paid,
      CASE WHEN v_status='cut_off' THEN now() END,
      CASE WHEN v_status='cut_off' THEN 'Tunggakan '||v_overdue||' bulan' END,
      now())
    ON CONFLICT (unit_id) DO UPDATE SET
      status = EXCLUDED.status,
      overdue_months = EXCLUDED.overdue_months,
      outstanding_amount = EXCLUDED.outstanding_amount,
      last_paid_period = EXCLUDED.last_paid_period,
      cutoff_at = CASE WHEN EXCLUDED.status='cut_off' AND unit_billing_status.status <> 'cut_off' THEN now() ELSE unit_billing_status.cutoff_at END,
      cutoff_reason = CASE WHEN EXCLUDED.status='cut_off' THEN EXCLUDED.cutoff_reason ELSE NULL END,
      updated_at = now();
  END LOOP;
END;
$$;

-- ============================================================
-- 4) bills payment_status auto sync (cicilan)
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_bill_payment_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.paid_amount IS NULL THEN NEW.paid_amount := 0; END IF;
  IF NEW.paid_amount = 0 THEN
    NEW.payment_status := 'belum_bayar';
    NEW.paid_at := NULL;
  ELSIF NEW.paid_amount < NEW.amount THEN
    NEW.payment_status := 'cicilan';
  ELSE
    NEW.payment_status := 'lunas';
    IF NEW.paid_at IS NULL THEN NEW.paid_at := now(); END IF;
  END IF;
  PERFORM public.refresh_unit_billing_status(NEW.unit_id);
  RETURN NEW;
END;
$$;

-- Ensure enum has 'cicilan'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='payment_status' AND e.enumlabel='cicilan') THEN
    ALTER TYPE public.payment_status ADD VALUE 'cicilan';
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_sync_bill_status ON public.bills;
CREATE TRIGGER trg_sync_bill_status BEFORE INSERT OR UPDATE OF paid_amount, amount ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.sync_bill_payment_status();
