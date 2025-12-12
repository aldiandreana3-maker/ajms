-- Update trigger to also make admin_ajms@ajms.com a super admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  
  -- Auto assign super_admin role for specific admin emails
  IF NEW.email IN ('admin@ajms.com', 'admin_ajms@ajms.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin'::app_role);
  END IF;
  
  RETURN NEW;
END;
$$;