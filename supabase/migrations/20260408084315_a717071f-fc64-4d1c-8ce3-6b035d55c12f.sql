
-- Chart of Accounts (Daftar Akun)
CREATE TABLE public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_code TEXT NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'aset',
  parent_id UUID REFERENCES public.chart_of_accounts(id) ON DELETE SET NULL,
  normal_balance TEXT NOT NULL DEFAULT 'debit',
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage chart_of_accounts" ON public.chart_of_accounts FOR ALL TO authenticated USING (is_admin_or_above(auth.uid())) WITH CHECK (is_admin_or_above(auth.uid()));
CREATE POLICY "Staff can view chart_of_accounts" ON public.chart_of_accounts FOR SELECT TO authenticated USING (is_staff_or_above(auth.uid()));

-- Journal Entries (Jurnal Transaksi)
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_number TEXT NOT NULL UNIQUE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  reference_number TEXT,
  total_debit NUMERIC NOT NULL DEFAULT 0,
  total_credit NUMERIC NOT NULL DEFAULT 0,
  is_posted BOOLEAN NOT NULL DEFAULT false,
  posted_at TIMESTAMPTZ,
  posted_by UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage journal_entries" ON public.journal_entries FOR ALL TO authenticated USING (is_admin_or_above(auth.uid())) WITH CHECK (is_admin_or_above(auth.uid()));
CREATE POLICY "Staff can view journal_entries" ON public.journal_entries FOR SELECT TO authenticated USING (is_staff_or_above(auth.uid()));

-- Journal Entry Lines (Detail Debit/Kredit)
CREATE TABLE public.journal_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  debit_amount NUMERIC NOT NULL DEFAULT 0,
  credit_amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage journal_entry_lines" ON public.journal_entry_lines FOR ALL TO authenticated USING (is_admin_or_above(auth.uid())) WITH CHECK (is_admin_or_above(auth.uid()));
CREATE POLICY "Staff can view journal_entry_lines" ON public.journal_entry_lines FOR SELECT TO authenticated USING (is_staff_or_above(auth.uid()));

-- Reconciliations (Rekonsiliasi)
CREATE TABLE public.reconciliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  period_label TEXT NOT NULL,
  period_date DATE NOT NULL,
  system_balance NUMERIC NOT NULL DEFAULT 0,
  actual_balance NUMERIC NOT NULL DEFAULT 0,
  difference NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'belum',
  notes TEXT,
  reconciled_by UUID,
  reconciled_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reconciliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage reconciliations" ON public.reconciliations FOR ALL TO authenticated USING (is_admin_or_above(auth.uid())) WITH CHECK (is_admin_or_above(auth.uid()));
CREATE POLICY "Staff can view reconciliations" ON public.reconciliations FOR SELECT TO authenticated USING (is_staff_or_above(auth.uid()));
