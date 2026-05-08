
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
        'staff_outsourcing_parkir',
        'staff_purchasing'
      )
  )
$function$;
