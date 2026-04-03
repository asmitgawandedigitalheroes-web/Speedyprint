-- SpeedyPrint Database Schema
-- Migration 001: Initial Schema

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'production_staff');
CREATE TYPE division_type AS ENUM ('labels', 'laser', 'race-numbers', 'mtb-boards', 'print', 'trophies');
CREATE TYPE param_type AS ENUM ('select', 'range', 'number', 'text');
CREATE TYPE pricing_rule_type AS ENUM ('base_price', 'quantity_break', 'size_tier', 'material_addon', 'option_addon', 'finish_addon');
CREATE TYPE order_status AS ENUM ('draft', 'pending_payment', 'paid', 'in_production', 'completed', 'cancelled');
CREATE TYPE order_item_status AS ENUM ('pending_design', 'pending_proof', 'proof_sent', 'approved', 'in_production', 'completed');
CREATE TYPE csv_job_status AS ENUM ('uploaded', 'validated', 'processing', 'completed', 'error');
CREATE TYPE proof_status AS ENUM ('pending', 'approved', 'revision_requested', 'rejected');
CREATE TYPE file_type AS ENUM ('pdf', 'png', 'svg');
CREATE TYPE file_purpose AS ENUM ('artwork', 'logo', 'csv', 'proof', 'production');

-- ============================================
-- 1. PROFILES (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'ZA',
  role user_role DEFAULT 'customer',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 2. PRODUCT_GROUPS
-- ============================================
CREATE TABLE product_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  division division_type NOT NULL,
  image_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. PRODUCT_TEMPLATES
-- ============================================
CREATE TABLE product_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_group_id UUID NOT NULL REFERENCES product_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_json JSONB DEFAULT '{}',
  print_width_mm NUMERIC NOT NULL DEFAULT 100,
  print_height_mm NUMERIC NOT NULL DEFAULT 100,
  bleed_mm NUMERIC DEFAULT 3,
  safe_zone_mm NUMERIC DEFAULT 5,
  dpi INT DEFAULT 300,
  panels JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. TEMPLATE_PARAMETERS
-- ============================================
CREATE TABLE template_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_template_id UUID NOT NULL REFERENCES product_templates(id) ON DELETE CASCADE,
  param_key TEXT NOT NULL,
  param_label TEXT NOT NULL,
  param_type param_type NOT NULL DEFAULT 'select',
  options JSONB DEFAULT '[]',
  default_value TEXT,
  display_order INT DEFAULT 0,
  is_required BOOLEAN DEFAULT true
);

-- ============================================
-- 5. PRICING_RULES
-- ============================================
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_group_id UUID NOT NULL REFERENCES product_groups(id) ON DELETE CASCADE,
  rule_type pricing_rule_type NOT NULL,
  conditions JSONB DEFAULT '{}',
  price_value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0
);

-- ============================================
-- 6. DESIGNS
-- ============================================
CREATE TABLE designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_template_id UUID REFERENCES product_templates(id) ON DELETE SET NULL,
  name TEXT DEFAULT 'Untitled Design',
  canvas_json JSONB DEFAULT '{}',
  thumbnail_url TEXT,
  is_saved_template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER designs_updated_at
  BEFORE UPDATE ON designs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 7. ORDERS
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  status order_status DEFAULT 'draft',
  subtotal NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  payment_method TEXT,
  payment_reference TEXT,
  shipping_address JSONB DEFAULT '{}',
  billing_address JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  seq_num INT;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 10) AS INT)), 0) + 1
  INTO seq_num
  FROM orders
  WHERE order_number LIKE 'ORD-' || year_str || '-%';
  NEW.order_number := 'ORD-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_auto_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION generate_order_number();

-- ============================================
-- 8. ORDER_ITEMS
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_group_id UUID REFERENCES product_groups(id) ON DELETE SET NULL,
  product_template_id UUID REFERENCES product_templates(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  line_total NUMERIC DEFAULT 0,
  selected_params JSONB DEFAULT '{}',
  design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
  csv_job_id UUID,
  status order_item_status DEFAULT 'pending_design',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. CSV_JOBS
-- ============================================
CREATE TABLE csv_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_filename TEXT,
  file_url TEXT,
  parsed_data JSONB DEFAULT '[]',
  row_count INT DEFAULT 0,
  column_mapping JSONB DEFAULT '{}',
  status csv_job_status DEFAULT 'uploaded',
  error_log JSONB DEFAULT '[]',
  progress INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add FK for order_items.csv_job_id
ALTER TABLE order_items ADD CONSTRAINT fk_csv_job FOREIGN KEY (csv_job_id) REFERENCES csv_jobs(id) ON DELETE SET NULL;

-- ============================================
-- 10. PROOFS
-- ============================================
CREATE TABLE proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
  version INT DEFAULT 1,
  proof_file_url TEXT,
  proof_thumbnail_url TEXT,
  status proof_status DEFAULT 'pending',
  customer_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- ============================================
-- 11. PRODUCTION_FILES
-- ============================================
CREATE TABLE production_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  proof_id UUID REFERENCES proofs(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  file_type file_type NOT NULL DEFAULT 'pdf',
  file_name TEXT NOT NULL,
  resolution_dpi INT DEFAULT 300,
  has_bleed BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. UPLOADED_FILES
-- ============================================
CREATE TABLE uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT,
  purpose file_purpose DEFAULT 'artwork',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_product_groups_division ON product_groups(division);
CREATE INDEX idx_product_groups_slug ON product_groups(slug);
CREATE INDEX idx_product_groups_active ON product_groups(is_active);
CREATE INDEX idx_product_templates_group ON product_templates(product_group_id);
CREATE INDEX idx_template_params_template ON template_parameters(product_template_id);
CREATE INDEX idx_pricing_rules_group ON pricing_rules(product_group_id);
CREATE INDEX idx_designs_user ON designs(user_id);
CREATE INDEX idx_designs_template ON designs(product_template_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_status ON order_items(status);
CREATE INDEX idx_csv_jobs_user ON csv_jobs(user_id);
CREATE INDEX idx_csv_jobs_status ON csv_jobs(status);
CREATE INDEX idx_proofs_order_item ON proofs(order_item_id);
CREATE INDEX idx_proofs_status ON proofs(status);
CREATE INDEX idx_production_files_order_item ON production_files(order_item_id);
CREATE INDEX idx_uploaded_files_user ON uploaded_files(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Helper function to check role
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = uid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Profile insert on signup" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- PRODUCT_GROUPS (public read, admin write)
CREATE POLICY "Anyone can view active products" ON product_groups FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON product_groups FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- PRODUCT_TEMPLATES (public read, admin write)
CREATE POLICY "Anyone can view active templates" ON product_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage templates" ON product_templates FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- TEMPLATE_PARAMETERS (public read, admin write)
CREATE POLICY "Anyone can view parameters" ON template_parameters FOR SELECT USING (true);
CREATE POLICY "Admins can manage parameters" ON template_parameters FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- PRICING_RULES (public read, admin write)
CREATE POLICY "Anyone can view active pricing" ON pricing_rules FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage pricing" ON pricing_rules FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- DESIGNS
CREATE POLICY "Users can view own designs" ON designs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create designs" ON designs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own designs" ON designs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own designs" ON designs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all designs" ON designs FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

-- ORDERS
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'production_staff'));
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

-- ORDER_ITEMS
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can create order items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'production_staff'));
CREATE POLICY "Admins can update order items" ON order_items FOR UPDATE USING (get_user_role(auth.uid()) IN ('admin', 'production_staff'));

-- CSV_JOBS
CREATE POLICY "Users can view own csv jobs" ON csv_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create csv jobs" ON csv_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all csv jobs" ON csv_jobs FOR SELECT USING (get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can update csv jobs" ON csv_jobs FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

-- PROOFS
CREATE POLICY "Users can view own proofs" ON proofs FOR SELECT USING (
  EXISTS (SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.id = proofs.order_item_id AND o.user_id = auth.uid())
);
CREATE POLICY "Users can update own proofs" ON proofs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.id = proofs.order_item_id AND o.user_id = auth.uid())
);
CREATE POLICY "Admins can manage all proofs" ON proofs FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'production_staff'));

-- PRODUCTION_FILES
CREATE POLICY "Users can view own production files" ON production_files FOR SELECT USING (
  EXISTS (SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE oi.id = production_files.order_item_id AND o.user_id = auth.uid())
);
CREATE POLICY "Admins can manage production files" ON production_files FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'production_staff'));

-- UPLOADED_FILES
CREATE POLICY "Users can view own files" ON uploaded_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload files" ON uploaded_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own files" ON uploaded_files FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all files" ON uploaded_files FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('designs', 'designs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('proofs', 'proofs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('production', 'production', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies
CREATE POLICY "Users can upload to designs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'designs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public can view designs" ON storage.objects FOR SELECT USING (bucket_id = 'designs');
CREATE POLICY "Users can upload to uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public can view proofs" ON storage.objects FOR SELECT USING (bucket_id = 'proofs');
CREATE POLICY "Admins can manage production files" ON storage.objects FOR ALL USING (bucket_id = 'production' AND get_user_role(auth.uid()) IN ('admin', 'production_staff'));
