
-- System activation status table
CREATE TABLE public.system_activation (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_status text NOT NULL DEFAULT 'tidak_aktif' CHECK (system_status IN ('aktif', 'tidak_aktif')),
  activated_at timestamp with time zone,
  deactivated_at timestamp with time zone,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- System payments table
CREATE TABLE public.system_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jenis_pembayaran text NOT NULL CHECK (jenis_pembayaran IN ('aktivasi', 'bulanan')),
  nominal numeric NOT NULL,
  tanggal_bayar date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'berhasil', 'gagal')),
  notes text,
  recorded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_activation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_payments ENABLE ROW LEVEL SECURITY;

-- RLS for system_activation
CREATE POLICY "Anyone can view system status"
ON public.system_activation FOR SELECT
USING (true);

CREATE POLICY "Super admin can manage system activation"
ON public.system_activation FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS for system_payments
CREATE POLICY "Super admin can view all payments"
ON public.system_payments FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admin can manage payments"
ON public.system_payments FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Insert default system status row
INSERT INTO public.system_activation (system_status) VALUES ('tidak_aktif');

-- Trigger for updated_at
CREATE TRIGGER update_system_activation_updated_at
BEFORE UPDATE ON public.system_activation
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_payments_updated_at
BEFORE UPDATE ON public.system_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-activate system when activation payment succeeds
CREATE OR REPLACE FUNCTION public.auto_activate_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'berhasil' AND NEW.jenis_pembayaran = 'aktivasi' AND NEW.nominal >= 6699000 THEN
    UPDATE public.system_activation 
    SET system_status = 'aktif', activated_at = now(), updated_at = now()
    WHERE id = (SELECT id FROM public.system_activation LIMIT 1);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_activate_on_payment
AFTER INSERT OR UPDATE ON public.system_payments
FOR EACH ROW EXECUTE FUNCTION public.auto_activate_on_payment();
