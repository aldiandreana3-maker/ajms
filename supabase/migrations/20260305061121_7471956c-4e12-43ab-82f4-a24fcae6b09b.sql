
CREATE TABLE public.employee_biodata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  birth_place text,
  birth_date date,
  phone text,
  email text,
  address text,
  bank_account_number text,
  bank_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_biodata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage employee biodata"
  ON public.employee_biodata FOR ALL
  USING (is_admin_or_above(auth.uid()))
  WITH CHECK (is_admin_or_above(auth.uid()));

CREATE POLICY "Staff can view own biodata"
  ON public.employee_biodata FOR SELECT
  USING (user_id = auth.uid() OR is_admin_or_above(auth.uid()));
