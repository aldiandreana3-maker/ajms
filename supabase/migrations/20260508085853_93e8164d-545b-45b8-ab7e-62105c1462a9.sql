
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  npwp text,
  category text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_number text NOT NULL UNIQUE,
  requester_division text NOT NULL,
  requester_name text,
  requester_id uuid,
  needed_date date,
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'pending',
  description text,
  notes text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id uuid REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'pcs',
  estimated_price numeric DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text NOT NULL UNIQUE,
  supplier_id uuid,
  supplier_name text,
  pr_id uuid,
  pr_number text,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_date date,
  status text NOT NULL DEFAULT 'draft',
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'pcs',
  price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.goods_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_number text NOT NULL UNIQUE,
  po_id uuid,
  po_number text,
  supplier_name text,
  receipt_date date NOT NULL DEFAULT CURRENT_DATE,
  received_by uuid,
  received_by_name text,
  condition_notes text,
  photo_url text,
  status text NOT NULL DEFAULT 'diterima',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.goods_receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id uuid REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity_ordered numeric DEFAULT 0,
  quantity_received numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'pcs',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pr_updated BEFORE UPDATE ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_po_updated BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_grn_updated BEFORE UPDATE ON public.goods_receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Purchasing manage suppliers" ON public.suppliers FOR ALL TO authenticated
  USING (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_purchasing'))
  WITH CHECK (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_purchasing'));
CREATE POLICY "Staff view suppliers" ON public.suppliers FOR SELECT TO authenticated
  USING (is_staff_or_above(auth.uid()));

CREATE POLICY "Purchasing manage PR" ON public.purchase_requests FOR ALL TO authenticated
  USING (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_purchasing'))
  WITH CHECK (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_purchasing'));
CREATE POLICY "Staff view PR" ON public.purchase_requests FOR SELECT TO authenticated
  USING (is_staff_or_above(auth.uid()));

CREATE POLICY "Purchasing manage PR items" ON public.purchase_request_items FOR ALL TO authenticated
  USING (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_purchasing'))
  WITH CHECK (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_purchasing'));
CREATE POLICY "Staff view PR items" ON public.purchase_request_items FOR SELECT TO authenticated
  USING (is_staff_or_above(auth.uid()));

CREATE POLICY "Purchasing manage PO" ON public.purchase_orders FOR ALL TO authenticated
  USING (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_purchasing'))
  WITH CHECK (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_purchasing'));
CREATE POLICY "Staff view PO" ON public.purchase_orders FOR SELECT TO authenticated
  USING (is_staff_or_above(auth.uid()));

CREATE POLICY "Purchasing manage PO items" ON public.purchase_order_items FOR ALL TO authenticated
  USING (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_purchasing'))
  WITH CHECK (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_purchasing'));
CREATE POLICY "Staff view PO items" ON public.purchase_order_items FOR SELECT TO authenticated
  USING (is_staff_or_above(auth.uid()));

CREATE POLICY "Purchasing manage GRN" ON public.goods_receipts FOR ALL TO authenticated
  USING (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_purchasing'))
  WITH CHECK (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_purchasing'));
CREATE POLICY "Staff view GRN" ON public.goods_receipts FOR SELECT TO authenticated
  USING (is_staff_or_above(auth.uid()));

CREATE POLICY "Purchasing manage GRN items" ON public.goods_receipt_items FOR ALL TO authenticated
  USING (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_purchasing'))
  WITH CHECK (is_admin_or_above(auth.uid()) OR has_role(auth.uid(), 'staff_purchasing'));
CREATE POLICY "Staff view GRN items" ON public.goods_receipt_items FOR SELECT TO authenticated
  USING (is_staff_or_above(auth.uid()));
