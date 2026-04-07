ALTER TABLE public.employee_attendance
  ADD COLUMN IF NOT EXISTS check_in_latitude double precision,
  ADD COLUMN IF NOT EXISTS check_in_longitude double precision,
  ADD COLUMN IF NOT EXISTS check_out_latitude double precision,
  ADD COLUMN IF NOT EXISTS check_out_longitude double precision,
  ADD COLUMN IF NOT EXISTS check_in_location_name text,
  ADD COLUMN IF NOT EXISTS check_out_location_name text;