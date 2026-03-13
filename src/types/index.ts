export type UserRole = 'customer' | 'admin' | 'production_staff'
export type Division = 'labels' | 'laser' | 'events' | 'stamps' | 'sleeves'
export type ParamType = 'select' | 'range' | 'number' | 'text'
export type PricingRuleType = 'base_price' | 'quantity_break' | 'size_tier' | 'material_addon' | 'option_addon' | 'finish_addon'
export type OrderStatus = 'draft' | 'pending_payment' | 'paid' | 'in_production' | 'completed' | 'cancelled'
export type OrderItemStatus = 'pending_design' | 'pending_proof' | 'proof_sent' | 'approved' | 'in_production' | 'completed'
export type CsvJobStatus = 'uploaded' | 'validated' | 'processing' | 'completed' | 'error'
export type ProofStatus = 'pending' | 'approved' | 'revision_requested' | 'rejected'
export type FileType = 'pdf' | 'png' | 'svg'
export type FilePurpose = 'artwork' | 'logo' | 'csv' | 'proof' | 'production'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  company_name: string | null
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  country: string
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ProductGroup {
  id: string
  name: string
  slug: string
  description: string | null
  division: Division
  image_url: string | null
  display_order: number
  is_active: boolean
  created_at: string
  templates?: ProductTemplate[]
}

export interface ProductTemplate {
  id: string
  product_group_id: string
  name: string
  description: string | null
  template_json: Record<string, unknown>
  print_width_mm: number
  print_height_mm: number
  bleed_mm: number
  safe_zone_mm: number
  dpi: number
  panels: unknown[]
  is_active: boolean
  created_at: string
  parameters?: TemplateParameter[]
  product_group?: ProductGroup
}

export interface TemplateParameter {
  id: string
  product_template_id: string
  param_key: string
  param_label: string
  param_type: ParamType
  options: unknown[]
  default_value: string | null
  display_order: number
  is_required: boolean
}

export interface PricingRule {
  id: string
  product_group_id: string
  rule_type: PricingRuleType
  conditions: Record<string, unknown>
  price_value: number
  currency: string
  is_active: boolean
  display_order: number
}

export interface Design {
  id: string
  user_id: string
  product_template_id: string | null
  name: string
  canvas_json: Record<string, unknown>
  thumbnail_url: string | null
  is_saved_template: boolean
  created_at: string
  updated_at: string
  product_template?: ProductTemplate
}

export interface Order {
  id: string
  user_id: string
  order_number: string
  status: OrderStatus
  subtotal: number
  tax: number
  shipping_cost: number
  total: number
  payment_method: string | null
  payment_reference: string | null
  shipping_address: ShippingAddress
  billing_address: ShippingAddress
  notes: string | null
  created_at: string
  paid_at: string | null
  completed_at: string | null
  items?: OrderItem[]
  profile?: Profile
}

export interface ShippingAddress {
  full_name?: string
  address_line1?: string
  address_line2?: string
  city?: string
  province?: string
  postal_code?: string
  country?: string
  phone?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_group_id: string | null
  product_template_id: string | null
  quantity: number
  unit_price: number
  line_total: number
  selected_params: Record<string, unknown>
  design_id: string | null
  csv_job_id: string | null
  status: OrderItemStatus
  created_at: string
  design?: Design
  product_group?: ProductGroup
  product_template?: ProductTemplate
  proofs?: Proof[]
}

export interface CsvJob {
  id: string
  order_item_id: string | null
  user_id: string
  original_filename: string | null
  file_url: string | null
  parsed_data: unknown[]
  row_count: number
  column_mapping: Record<string, string>
  status: CsvJobStatus
  error_log: unknown[]
  progress: number
  created_at: string
  completed_at: string | null
}

export interface Proof {
  id: string
  order_item_id: string
  design_id: string | null
  version: number
  proof_file_url: string | null
  proof_thumbnail_url: string | null
  status: ProofStatus
  customer_notes: string | null
  admin_notes: string | null
  created_at: string
  responded_at: string | null
}

export interface ProductionFile {
  id: string
  order_item_id: string
  proof_id: string | null
  file_url: string
  file_type: FileType
  file_name: string
  resolution_dpi: number
  has_bleed: boolean
  metadata: Record<string, unknown>
  generated_at: string
}

export interface UploadedFile {
  id: string
  user_id: string
  order_item_id: string | null
  file_url: string
  original_name: string
  mime_type: string | null
  file_size_bytes: number | null
  purpose: FilePurpose
  created_at: string
}

// Cart types (client-side)
export interface CartItem {
  id: string
  product_group_id: string
  product_template_id: string
  product_name: string
  template_name: string
  quantity: number
  unit_price: number
  line_total: number
  selected_params: Record<string, unknown>
  design_id?: string
  thumbnail_url?: string
}
