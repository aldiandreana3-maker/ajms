
-- Security Patrol Table
CREATE TABLE public.security_patrols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patrol_date date NOT NULL DEFAULT CURRENT_DATE,
  patrol_time timestamp with time zone NOT NULL DEFAULT now(),
  location text NOT NULL,
  status text NOT NULL DEFAULT 'aman',
  photo_url text NULL,
  notes text NULL,
  officer_id uuid NULL,
  officer_name text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.security_patrols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view patrols" ON public.security_patrols
  FOR SELECT TO authenticated USING (is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can insert patrols" ON public.security_patrols
  FOR INSERT TO authenticated WITH CHECK (is_staff_or_above(auth.uid()));

CREATE POLICY "Admin can manage patrols" ON public.security_patrols
  FOR ALL TO authenticated USING (is_admin_or_above(auth.uid())) WITH CHECK (is_admin_or_above(auth.uid()));

-- House Keeping Tasks Table
CREATE TABLE public.housekeeping_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_date date NOT NULL DEFAULT CURRENT_DATE,
  area_name text NOT NULL,
  task_description text NOT NULL,
  status text NOT NULL DEFAULT 'belum',
  assigned_to text NULL,
  completed_at timestamp with time zone NULL,
  completed_by uuid NULL,
  completed_by_name text NULL,
  photo_url text NULL,
  notes text NULL,
  created_by uuid NULL,
  created_by_name text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.housekeeping_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view housekeeping" ON public.housekeeping_tasks
  FOR SELECT TO authenticated USING (is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can insert housekeeping" ON public.housekeeping_tasks
  FOR INSERT TO authenticated WITH CHECK (is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can update housekeeping" ON public.housekeeping_tasks
  FOR UPDATE TO authenticated USING (is_staff_or_above(auth.uid())) WITH CHECK (is_staff_or_above(auth.uid()));

CREATE POLICY "Admin can manage housekeeping" ON public.housekeeping_tasks
  FOR ALL TO authenticated USING (is_admin_or_above(auth.uid())) WITH CHECK (is_admin_or_above(auth.uid()));
