
CREATE TABLE public.employee_payroll (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  total_attendance INTEGER NOT NULL DEFAULT 0,
  total_leaves INTEGER NOT NULL DEFAULT 0,
  total_overtimes INTEGER NOT NULL DEFAULT 0,
  total_permits INTEGER NOT NULL DEFAULT 0,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  allowance NUMERIC NOT NULL DEFAULT 0,
  deductions NUMERIC NOT NULL DEFAULT 0,
  total_salary NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_month, period_year)
);

ALTER TABLE public.employee_payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage payroll" ON public.employee_payroll
  FOR ALL TO authenticated
  USING (is_admin_or_above(auth.uid()))
  WITH CHECK (is_admin_or_above(auth.uid()));

CREATE POLICY "Staff can view own payroll" ON public.employee_payroll
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin_or_above(auth.uid()));
