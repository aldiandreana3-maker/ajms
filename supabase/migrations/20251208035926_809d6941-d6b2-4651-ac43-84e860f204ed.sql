-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'staff', 'agent', 'penghuni');

-- Create enum for complaint status
CREATE TYPE public.complaint_status AS ENUM ('pending', 'proses', 'selesai');

-- Create enum for work order status
CREATE TYPE public.work_order_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create enum for card status
CREATE TYPE public.card_status AS ENUM ('active', 'inactive', 'lost', 'damaged');

-- Create enum for bill type
CREATE TYPE public.bill_type AS ENUM ('ipl', 'kebersihan', 'keamanan', 'sinking_fund', 'listrik', 'air', 'denda', 'perbaikan');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid', 'overdue');

-- Create enum for permit status
CREATE TYPE public.permit_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for news status
CREATE TYPE public.news_status AS ENUM ('draft', 'published');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'penghuni',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create units table
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number TEXT NOT NULL UNIQUE,
  floor INTEGER,
  building TEXT,
  type TEXT,
  area_sqm NUMERIC,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create penghuni (residents) table
CREATE TABLE public.penghuni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  ktp_number TEXT,
  is_owner BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  move_in_date DATE,
  move_out_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create keluhan (complaints) table
CREATE TABLE public.keluhan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penghuni_id UUID REFERENCES public.penghuni(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status complaint_status DEFAULT 'pending',
  photo_url TEXT,
  response TEXT,
  handled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create work_orders table
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keluhan_id UUID REFERENCES public.keluhan(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status work_order_status DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create parking_subscriptions (abonemen parkir) table
CREATE TABLE public.parking_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penghuni_id UUID REFERENCES public.penghuni(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  vehicle_type TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  vehicle_brand TEXT,
  vehicle_color TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_fee NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create access_cards (kartu akses) table
CREATE TABLE public.access_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penghuni_id UUID REFERENCES public.penghuni(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  card_number TEXT NOT NULL UNIQUE,
  card_type TEXT DEFAULT 'resident',
  status card_status DEFAULT 'active',
  issued_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create work_permits (izin kerja) table
CREATE TABLE public.work_permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  penghuni_id UUID REFERENCES public.penghuni(id) ON DELETE SET NULL,
  vendor_name TEXT NOT NULL,
  work_description TEXT NOT NULL,
  worker_count INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  document_url TEXT,
  status permit_status DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create goods_movement (keluar masuk barang) table
CREATE TABLE public.goods_movement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  penghuni_id UUID REFERENCES public.penghuni(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out')),
  item_description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  carrier_name TEXT,
  carrier_id TEXT,
  qr_code TEXT,
  photo_url TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create bills (tagihan) table
CREATE TABLE public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  penghuni_id UUID REFERENCES public.penghuni(id) ON DELETE SET NULL,
  bill_type bill_type NOT NULL,
  amount NUMERIC NOT NULL,
  billing_period DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_status payment_status DEFAULT 'unpaid',
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC,
  is_auto_generated BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create expenses (pengeluaran) table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create news (berita) table
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  status news_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create commercial_tenants (komersil) table
CREATE TABLE public.commercial_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  business_type TEXT,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  lease_start DATE,
  lease_end DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penghuni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keluhan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_movement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_tenants ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin or above
CREATE OR REPLACE FUNCTION public.is_admin_or_above(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin')
  )
$$;

-- Create function to check if user is staff or above
CREATE OR REPLACE FUNCTION public.is_staff_or_above(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin', 'staff', 'agent')
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admin can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admin can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Allow insert for authenticated users"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Super admin can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for units (staff and above can manage)
CREATE POLICY "Staff can view all units"
ON public.units FOR SELECT
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

CREATE POLICY "Admin can manage units"
ON public.units FOR ALL
TO authenticated
USING (public.is_admin_or_above(auth.uid()));

-- RLS Policies for penghuni
CREATE POLICY "Staff can view all penghuni"
ON public.penghuni FOR SELECT
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

CREATE POLICY "Admin can manage penghuni"
ON public.penghuni FOR ALL
TO authenticated
USING (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Penghuni can view own data"
ON public.penghuni FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for keluhan
CREATE POLICY "Staff can view all keluhan"
ON public.keluhan FOR SELECT
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can manage keluhan"
ON public.keluhan FOR ALL
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

-- RLS Policies for work_orders
CREATE POLICY "Staff can view all work orders"
ON public.work_orders FOR SELECT
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can manage work orders"
ON public.work_orders FOR ALL
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

-- RLS Policies for parking_subscriptions
CREATE POLICY "Staff can view all parking subscriptions"
ON public.parking_subscriptions FOR SELECT
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can manage parking subscriptions"
ON public.parking_subscriptions FOR ALL
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

-- RLS Policies for access_cards
CREATE POLICY "Staff can view all access cards"
ON public.access_cards FOR SELECT
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can manage access cards"
ON public.access_cards FOR ALL
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

-- RLS Policies for work_permits
CREATE POLICY "Staff can view all work permits"
ON public.work_permits FOR SELECT
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can manage work permits"
ON public.work_permits FOR ALL
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

-- RLS Policies for goods_movement
CREATE POLICY "Staff can view all goods movement"
ON public.goods_movement FOR SELECT
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can manage goods movement"
ON public.goods_movement FOR ALL
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

-- RLS Policies for bills
CREATE POLICY "Staff can view all bills"
ON public.bills FOR SELECT
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

CREATE POLICY "Admin can manage bills"
ON public.bills FOR ALL
TO authenticated
USING (public.is_admin_or_above(auth.uid()));

-- RLS Policies for expenses
CREATE POLICY "Admin can view expenses"
ON public.expenses FOR SELECT
TO authenticated
USING (public.is_admin_or_above(auth.uid()));

CREATE POLICY "Admin can manage expenses"
ON public.expenses FOR ALL
TO authenticated
USING (public.is_admin_or_above(auth.uid()));

-- RLS Policies for news
CREATE POLICY "Anyone can view published news"
ON public.news FOR SELECT
TO authenticated
USING (status = 'published' OR public.is_staff_or_above(auth.uid()));

CREATE POLICY "Staff can manage news"
ON public.news FOR ALL
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

-- RLS Policies for commercial_tenants
CREATE POLICY "Staff can view commercial tenants"
ON public.commercial_tenants FOR SELECT
TO authenticated
USING (public.is_staff_or_above(auth.uid()));

CREATE POLICY "Admin can manage commercial tenants"
ON public.commercial_tenants FOR ALL
TO authenticated
USING (public.is_admin_or_above(auth.uid()));

-- Create trigger function for new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_penghuni_updated_at BEFORE UPDATE ON public.penghuni FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_keluhan_updated_at BEFORE UPDATE ON public.keluhan FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parking_subscriptions_updated_at BEFORE UPDATE ON public.parking_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_access_cards_updated_at BEFORE UPDATE ON public.access_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_work_permits_updated_at BEFORE UPDATE ON public.work_permits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_commercial_tenants_updated_at BEFORE UPDATE ON public.commercial_tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();