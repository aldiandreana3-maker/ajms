
-- Function to get ALL unit IDs for a user (supports multiple units for penghuni AND agents)
CREATE OR REPLACE FUNCTION public.get_user_unit_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Units from penghuni table (owner/tenant)
  SELECT unit_id FROM public.penghuni 
  WHERE user_id = _user_id AND is_active = true AND unit_id IS NOT NULL
  UNION
  -- Units from agent_units table (agent managing units)
  SELECT au.unit_id FROM public.agent_units au
  INNER JOIN public.agents a ON a.id = au.agent_id
  INNER JOIN public.profiles p ON p.email = a.email
  WHERE p.id = _user_id AND a.is_active = true
$$;

-- Drop old restrictive bills RLS policies and recreate with multi-unit support
DROP POLICY IF EXISTS "Penghuni can view own unit bills" ON public.bills;

CREATE POLICY "Users can view own unit bills"
ON public.bills
FOR SELECT
USING (
  unit_id IN (SELECT get_user_unit_ids(auth.uid()))
  OR is_staff_or_above(auth.uid())
);

-- Keep existing admin manage policy (already exists)
-- DROP POLICY IF EXISTS "Admin can manage bills" ON public.bills; -- keep as is
-- DROP POLICY IF EXISTS "Staff can view all bills" ON public.bills; -- drop since new policy covers it

DROP POLICY IF EXISTS "Staff can view all bills" ON public.bills;
