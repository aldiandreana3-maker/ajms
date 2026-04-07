
-- Update handle_new_user to assign master_dev instead of super_admin for admin emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  IF NEW.email IN ('admin@ajms.com', 'admin_ajms@ajms.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'master_dev'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update assign_super_admin_role trigger to assign master_dev
CREATE OR REPLACE FUNCTION public.assign_super_admin_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email = 'admin@ajms.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'master_dev')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update is_admin_or_above to include master_dev
CREATE OR REPLACE FUNCTION public.is_admin_or_above(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin', 'master_dev')
  )
$function$;

-- Update is_staff_or_above to include master_dev
CREATE OR REPLACE FUNCTION public.is_staff_or_above(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'master_dev',
        'super_admin', 
        'admin', 
        'staff', 
        'agent',
        'staff_tro',
        'staff_finance',
        'staff_hrd_ga',
        'staff_engineering',
        'staff_outsourcing_cleaning',
        'staff_outsourcing_security',
        'staff_outsourcing_parkir'
      )
  )
$function$;

-- Update has_role to also support master_dev checking (no change needed, it's generic)
-- Update existing admin@ajms.com user role from super_admin to master_dev
UPDATE public.user_roles 
SET role = 'master_dev'::app_role
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email IN ('admin@ajms.com', 'admin_ajms@ajms.com')
) AND role = 'super_admin';
