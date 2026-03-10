
-- Table for queue numbers
CREATE TABLE public.cashier_queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_number text NOT NULL,
  queue_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'waiting', -- waiting, called, completed, skipped
  called_at timestamptz,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cashier_queues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage queues" ON public.cashier_queues
  FOR ALL TO authenticated
  USING (is_staff_or_above(auth.uid()))
  WITH CHECK (is_staff_or_above(auth.uid()));

CREATE POLICY "Anyone authenticated can insert queue" ON public.cashier_queues
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone authenticated can view queues" ON public.cashier_queues
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Table for cashier transactions
CREATE TABLE public.cashier_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES public.cashier_queues(id),
  transaction_id text NOT NULL,
  queue_number text NOT NULL,
  customer_name text NOT NULL,
  payment_method text NOT NULL DEFAULT 'tunai', -- tunai, transfer, qris
  subtotal numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  cashier_id uuid,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cashier_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage transactions" ON public.cashier_transactions
  FOR ALL TO authenticated
  USING (is_staff_or_above(auth.uid()))
  WITH CHECK (is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can view transactions" ON public.cashier_transactions
  FOR SELECT TO authenticated
  USING (is_staff_or_above(auth.uid()));

-- Table for transaction items
CREATE TABLE public.cashier_transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES public.cashier_transactions(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cashier_transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage transaction items" ON public.cashier_transaction_items
  FOR ALL TO authenticated
  USING (is_staff_or_above(auth.uid()))
  WITH CHECK (is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can view transaction items" ON public.cashier_transaction_items
  FOR SELECT TO authenticated
  USING (is_staff_or_above(auth.uid()));
