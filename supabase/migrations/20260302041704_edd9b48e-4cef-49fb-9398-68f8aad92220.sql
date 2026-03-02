
-- 1. Employee Attendance (Absen)
CREATE TABLE public.employee_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  check_in_photo_url TEXT,
  check_out_photo_url TEXT,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'hadir',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own attendance" ON public.employee_attendance
  FOR SELECT USING (user_id = auth.uid() OR is_admin_or_above(auth.uid()));

CREATE POLICY "Staff can insert own attendance" ON public.employee_attendance
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can update own attendance" ON public.employee_attendance
  FOR UPDATE USING (user_id = auth.uid() AND is_staff_or_above(auth.uid()));

CREATE POLICY "Admin can manage all attendance" ON public.employee_attendance
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Unique constraint: one attendance per user per day
CREATE UNIQUE INDEX idx_attendance_user_date ON public.employee_attendance (user_id, attendance_date);

-- 2. Employee Leaves (Cuti)
CREATE TABLE public.employee_leaves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  leave_type TEXT NOT NULL DEFAULT 'cuti_tahunan',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_leaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own leaves" ON public.employee_leaves
  FOR SELECT USING (user_id = auth.uid() OR is_admin_or_above(auth.uid()));

CREATE POLICY "Staff can insert own leaves" ON public.employee_leaves
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_staff_or_above(auth.uid()));

CREATE POLICY "Admin can manage all leaves" ON public.employee_leaves
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- 3. Employee Overtime (Lembur)
CREATE TABLE public.employee_overtimes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  overtime_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours NUMERIC GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time)) / 3600) STORED,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_overtimes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own overtimes" ON public.employee_overtimes
  FOR SELECT USING (user_id = auth.uid() OR is_admin_or_above(auth.uid()));

CREATE POLICY "Staff can insert own overtimes" ON public.employee_overtimes
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_staff_or_above(auth.uid()));

CREATE POLICY "Admin can manage all overtimes" ON public.employee_overtimes
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- 4. Employee Permits (Izin)
CREATE TABLE public.employee_permits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  permit_type TEXT NOT NULL DEFAULT 'sakit',
  permit_date DATE NOT NULL,
  reason TEXT NOT NULL,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_permits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own permits" ON public.employee_permits
  FOR SELECT USING (user_id = auth.uid() OR is_admin_or_above(auth.uid()));

CREATE POLICY "Staff can insert own permits" ON public.employee_permits
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_staff_or_above(auth.uid()));

CREATE POLICY "Admin can manage all permits" ON public.employee_permits
  FOR ALL USING (is_admin_or_above(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_employee_attendance_updated_at BEFORE UPDATE ON public.employee_attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_leaves_updated_at BEFORE UPDATE ON public.employee_leaves FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_overtimes_updated_at BEFORE UPDATE ON public.employee_overtimes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_employee_permits_updated_at BEFORE UPDATE ON public.employee_permits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
