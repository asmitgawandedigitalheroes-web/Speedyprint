export type UserRole = 'customer' | 'admin' | 'production_staff'

export interface ProductFamily {
  key: string
  name: string
  description: string
  icon: string
  products: string[]
  divisionKey: string
}
export type Division = 'labels' | 'race-numbers' | 'mtb-boards' | 'laser' | 'trophies' | 'print'
export type ParamType = 'select' | 'range' | 'number' | 'text'
export type PricingRuleType = 'base_price' | 'quantity_break' | 'size_tier' | 'material_addon' | 'option_addon' | 'finish_addon'
export type OrderStatus = 'draft' | 'pending_payment' | 'paid' | 'in_production' | 'completed' | 'cancelled'
export type OrderItemStatus = 'pending_design' | 'pending_proof' | 'proof_sent' | 'approved' | 'in_production' | 'completed' | 'cancelled'
export type CsvJobStatus = 'uploaded' | 'validated' | 'processing' | 'completed' | 'error'
export type ProofStatus = 'pending' | 'approved' | 'revision_requested' | 'rejected' | 'cancelled'
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

// Dimension constraints stored in template_json
export interface TemplateDimensionConstraints {
  min_width_mm?: number
  max_width_mm?: number
  width_step_mm?: number
  min_height_mm?: number
  max_height_mm?: number
  height_step_mm?: number
}

// Sponsor/logo zones stored in template_json (for events division)
export interface SponsorZone {
  key: string
  label: string
  description?: string
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
  image_url: string | null
  is_active: boolean
  created_at: string
  parameters?: TemplateParameter[]
  product_group?: ProductGroup
}

// Helper to extract dimension constraints from template_json
export function getDimensionConstraints(template: ProductTemplate): TemplateDimensionConstraints | null {
  if (!template || !template.template_json) return null
  const tj = template.template_json as Record<string, unknown>
  
  if (typeof tj !== 'object') return null

  const hasWidth = tj.min_width_mm !== undefined || tj.max_width_mm !== undefined
  const hasHeight = tj.min_height_mm !== undefined || tj.max_height_mm !== undefined
  
  if (!hasWidth && !hasHeight) return null

  return {
    min_width_mm: typeof tj.min_width_mm === 'number' ? tj.min_width_mm : undefined,
    max_width_mm: typeof tj.max_width_mm === 'number' ? tj.max_width_mm : undefined,
    width_step_mm: (tj.width_step_mm as number | undefined) ?? 1,
    min_height_mm: typeof tj.min_height_mm === 'number' ? tj.min_height_mm : undefined,
    max_height_mm: typeof tj.max_height_mm === 'number' ? tj.max_height_mm : undefined,
    height_step_mm: (tj.height_step_mm as number | undefined) ?? 1,
  }
}

// Helper to extract sponsor zones from template_json
export function getSponsorZones(template: ProductTemplate): SponsorZone[] {
  const tj = template.template_json as Record<string, unknown>
  if (!Array.isArray(tj?.sponsor_zones)) return []
  return tj.sponsor_zones as SponsorZone[]
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
  tracking_number?: string | null
  admin_notes?: string | null
  approved_at?: string | null
  shipped_at?: string | null
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
  approved_by: string | null
  approved_ip: string | null
}

export type ProofAuditAction =
  | 'proof_created'
  | 'proof_approved'
  | 'revision_requested'
  | 'production_generated'
  | 'proof_cancelled'

export interface ProofAuditLog {
  id: string
  proof_id: string
  order_item_id: string
  action: ProofAuditAction
  actor_id: string | null
  actor_role: UserRole | 'system' | null
  notes: string | null
  client_ip: string | null
  metadata: Record<string, unknown>
  created_at: string
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

// V2 Content types
export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  featured_image: string | null
  author: string
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Testimonial {
  id: string
  customer_name: string
  company_name: string | null
  location: string | null
  rating: number
  review_text: string
  featured: boolean
  created_at: string
}

// Admin types
export interface SiteSetting {
  key: string
  value: string
  updated_at: string
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: string
  notes: string | null
  changed_by: string | null
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
  csv_job_id?: string
  thumbnail_url?: string
  artwork_url?: string
  selected?: boolean
}
