
-- Create about_us table for Tentang Kami dynamic content
CREATE TABLE IF NOT EXISTS public.about_us (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  icon_name text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agents table for Agent Berkantor
CREATE TABLE IF NOT EXISTS public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  phone text,
  email text,
  office_location text,
  photo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agent_units table for managing units assigned to agents
CREATE TABLE IF NOT EXISTS public.agent_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, unit_id)
);

-- Create facilities table for Struktur Fasilitas
CREATE TABLE IF NOT EXISTS public.facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_name text DEFAULT 'Building2',
  floor_location text,
  status text DEFAULT 'Aktif',
  image_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.about_us ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for about_us (read: everyone, write: super admin)
CREATE POLICY "Anyone can view about_us" ON public.about_us FOR SELECT USING (true);
CREATE POLICY "Super admin can manage about_us" ON public.about_us FOR ALL USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for agents (read: everyone, write: super admin)
CREATE POLICY "Anyone can view agents" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Super admin can manage agents" ON public.agents FOR ALL USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for agent_units (read: everyone, write: super admin)
CREATE POLICY "Anyone can view agent_units" ON public.agent_units FOR SELECT USING (true);
CREATE POLICY "Super admin can manage agent_units" ON public.agent_units FOR ALL USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- RLS Policies for facilities (read: everyone, write: super admin)
CREATE POLICY "Anyone can view facilities" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "Super admin can manage facilities" ON public.facilities FOR ALL USING (has_role(auth.uid(), 'super_admin')) WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Function to get user's unit_id from penghuni table
CREATE OR REPLACE FUNCTION public.get_user_unit_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unit_id FROM public.penghuni WHERE user_id = _user_id AND is_active = true LIMIT 1
$$;

-- Update bills RLS: penghuni can only see bills for their unit
CREATE POLICY "Penghuni can view own unit bills" ON public.bills 
FOR SELECT USING (
  unit_id = get_user_unit_id(auth.uid())
);

-- Drop and recreate news policies for super admin only write access
DROP POLICY IF EXISTS "Staff can manage news" ON public.news;

CREATE POLICY "Super admin can manage news" ON public.news 
FOR ALL USING (has_role(auth.uid(), 'super_admin')) 
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Insert default about_us content
INSERT INTO public.about_us (section_key, title, content, icon_name, display_order) VALUES
('visi', 'Visi Kami', 'Menjadi sistem manajemen properti terdepan yang memberikan solusi terintegrasi untuk pengelolaan rusunami modern di Indonesia.', 'Building2', 1),
('misi', 'Misi Kami', 'Menyediakan platform yang efisien, transparan, dan mudah digunakan untuk meningkatkan kualitas hidup penghuni apartemen.', 'Target', 2),
('tim', 'Tim Kami', 'Didukung oleh tim profesional berpengalaman dalam bidang properti dan teknologi informasi.', 'Users', 3),
('pengalaman', 'Pengalaman', 'Lebih dari 10 tahun pengalaman dalam mengelola berbagai properti residensial di seluruh Indonesia.', 'Award', 4)
ON CONFLICT (section_key) DO NOTHING;

-- Insert default facilities
INSERT INTO public.facilities (name, description, icon_name, floor_location, status, display_order) VALUES
('Kolam Renang', 'Kolam renang outdoor dengan area anak', 'Waves', 'Lt. 5', 'Aktif', 1),
('Fitness Center', 'Gym lengkap dengan peralatan modern', 'Dumbbell', 'Lt. 5', 'Aktif', 2),
('Basement Parking', 'Parkir bawah tanah 3 lantai', 'Car', 'B1-B3', 'Aktif', 3),
('Mini Market', 'Toko kebutuhan sehari-hari 24 jam', 'ShoppingBag', 'Lt. G', 'Aktif', 4),
('Food Court', 'Area makan dengan berbagai pilihan', 'Utensils', 'Lt. 2', 'Aktif', 5),
('Security 24 Jam', 'Keamanan dengan CCTV dan patrol', 'Shield', 'All Area', 'Aktif', 6),
('Internet Fiber', 'Koneksi internet high-speed', 'Wifi', 'All Unit', 'Aktif', 7),
('Genset Backup', 'Generator listrik cadangan', 'Zap', 'Basement', 'Standby', 8)
ON CONFLICT DO NOTHING;

-- Add triggers for updated_at
CREATE TRIGGER update_about_us_updated_at BEFORE UPDATE ON public.about_us FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON public.facilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
