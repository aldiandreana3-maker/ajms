ALTER TABLE public.system_activation 
ADD COLUMN IF NOT EXISTS monthly_status text NOT NULL DEFAULT 'normal'
CHECK (monthly_status IN ('normal','peringatan','terlambat','dibatasi'));