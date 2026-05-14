
-- Shift definitions
CREATE TABLE public.shift_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  late_tolerance_minutes INTEGER NOT NULL DEFAULT 15,
  working_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shift_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated view shifts" ON public.shift_definitions
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manage shifts" ON public.shift_definitions
  FOR ALL TO authenticated
  USING (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'staff_hrd_ga'::app_role))
  WITH CHECK (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'staff_hrd_ga'::app_role));

CREATE TRIGGER trg_shift_definitions_updated
  BEFORE UPDATE ON public.shift_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default shifts
INSERT INTO public.shift_definitions (name, start_time, end_time, late_tolerance_minutes, working_days, color, is_default) VALUES
  ('Shift Pagi', '07:00', '15:00', 15, '{1,2,3,4,5,6}', '#3b82f6', true),
  ('Shift Siang', '15:00', '23:00', 15, '{1,2,3,4,5,6}', '#f59e0b', true),
  ('Shift Malam', '23:00', '07:00', 15, '{1,2,3,4,5,6}', '#8b5cf6', true);

-- Employee shift schedules
CREATE TABLE public.employee_shift_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  employee_name TEXT,
  shift_id UUID REFERENCES public.shift_definitions(id) ON DELETE SET NULL,
  schedule_date DATE NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, schedule_date)
);

CREATE INDEX idx_ess_user_date ON public.employee_shift_schedules(user_id, schedule_date);
CREATE INDEX idx_ess_date ON public.employee_shift_schedules(schedule_date);

ALTER TABLE public.employee_shift_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own schedule" ON public.employee_shift_schedules
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'staff_hrd_ga'::app_role));

CREATE POLICY "Admin manage schedules" ON public.employee_shift_schedules
  FOR ALL TO authenticated
  USING (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'staff_hrd_ga'::app_role))
  WITH CHECK (public.is_admin_or_above(auth.uid()) OR public.has_role(auth.uid(), 'staff_hrd_ga'::app_role));

CREATE TRIGGER trg_ess_updated
  BEFORE UPDATE ON public.employee_shift_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notification trigger
CREATE OR REPLACE FUNCTION public.notify_shift_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  shift_name TEXT;
  action_text TEXT;
BEGIN
  SELECT name INTO shift_name FROM public.shift_definitions WHERE id = NEW.shift_id;
  action_text := CASE WHEN TG_OP = 'INSERT' THEN 'ditetapkan' ELSE 'diperbarui' END;
  
  INSERT INTO public.broadcast_messages (title, content, sender_id, sender_name, target_type, target_value)
  VALUES (
    'Perubahan Jadwal Shift',
    'Jadwal kerja Anda untuk ' || to_char(NEW.schedule_date, 'DD Mon YYYY') || ' telah ' || action_text || ': ' || COALESCE(shift_name, 'Tidak ada shift'),
    COALESCE(NEW.created_by, auth.uid()),
    'Sistem HRD',
    'user',
    ARRAY[NEW.user_id::text]
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_shift_change
  AFTER INSERT OR UPDATE OF shift_id ON public.employee_shift_schedules
  FOR EACH ROW EXECUTE FUNCTION public.notify_shift_change();

-- Add shift_id to attendance
ALTER TABLE public.employee_attendance ADD COLUMN shift_id UUID REFERENCES public.shift_definitions(id) ON DELETE SET NULL;
