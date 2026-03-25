export const SITE_NAME = 'Speedy Labels'
export const SITE_DESCRIPTION = 'Premium custom labels, stickers & decals — designed online, printed fast, delivered across South Africa.'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://speedylabels.co.za'

export const VAT_RATE = 0.15 // 15% South African VAT
export const CURRENCY = 'ZAR'
export const CURRENCY_SYMBOL = 'R'

export const DIVISIONS = [
  { key: 'labels' as const, name: 'Speedy Labels', description: 'Custom labels and stickers', icon: 'Tag' },
  { key: 'laser' as const, name: 'Speedy Laser', description: 'Laser-cut and engraved products', icon: 'Zap' },
  { key: 'events' as const, name: 'Speedy Event Numbers', description: 'Race bibs, event numbers, tags', icon: 'Hash' },
  { key: 'stamps' as const, name: 'Speedy Stamps', description: 'Custom rubber stamps', icon: 'Stamp' },
  { key: 'sleeves' as const, name: 'Speedy Trophies', description: 'Coffee cup sleeves and trophies', icon: 'Trophy' },
]

export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
]

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  pending_payment: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Paid', color: 'bg-blue-100 text-blue-700' },
  in_production: { label: 'In Production', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
}

export const ORDER_ITEM_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_design: { label: 'Pending Design', color: 'bg-gray-100 text-gray-700' },
  pending_proof: { label: 'Pending Proof', color: 'bg-yellow-100 text-yellow-700' },
  proof_sent: { label: 'Proof Sent', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  in_production: { label: 'In Production', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
}

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']
export const ACCEPTED_UPLOAD_TYPES = [...ACCEPTED_IMAGE_TYPES, 'application/pdf']
export const MAX_CSV_ROWS = 5000

// --- V2 Additions ---

export const WHATSAPP_NUMBER = '27123456789' // Update with real number
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`
export const FREE_DELIVERY_THRESHOLD = 500 // R500
export const FLAT_SHIPPING_RATE = 85 // R85

// V2 Sticker/Label Divisions
export const V2_DIVISIONS = [
  { key: 'custom-stickers' as const, name: 'Custom Stickers', description: 'High-quality custom stickers for any purpose', icon: 'Star', color: '#FF5C00' },
  { key: 'product-labels' as const, name: 'Product Labels', description: 'Professional labels for your products', icon: 'Tag', color: '#1E293B' },
  { key: 'vehicle-decals' as const, name: 'Vehicle & Fleet Decals', description: 'Durable decals for vehicles and fleets', icon: 'Truck', color: '#14B8A6' },
  { key: 'window-wall' as const, name: 'Window & Wall Graphics', description: 'Eye-catching window and wall graphics', icon: 'Layout', color: '#8B5CF6' },
  { key: 'specialty-3d' as const, name: 'Specialty & 3D Domed', description: 'Premium 3D domed stickers and specialty items', icon: 'Diamond', color: '#EC4899' },
]

// Pricing Constants
export const BASE_PRICE_PER_UNIT = 5.0 // R5.00 for 100x100mm on white vinyl
export const DOMING_SURCHARGE = 3.5 // R3.50 per unit
export const BASE_SIZE_MM = { width: 100, height: 100 }

export const MATERIALS = [
  { value: 'white-vinyl', label: 'White Vinyl', multiplier: 1.0 },
  { value: 'clear-vinyl', label: 'Clear Vinyl', multiplier: 1.15 },
  { value: 'chrome-metallic', label: 'Chrome/Metallic', multiplier: 1.35 },
  { value: 'reflective', label: 'Reflective', multiplier: 1.5 },
  { value: 'holographic', label: 'Holographic', multiplier: 1.6 },
] as const

export const FINISHES = [
  { value: 'gloss', label: 'Gloss', multiplier: 1.0 },
  { value: 'matte', label: 'Matte', multiplier: 1.05 },
  { value: 'satin', label: 'Satin', multiplier: 1.03 },
] as const

export const ADHESION_TYPES = [
  { value: 'standard', label: 'Standard', multiplier: 1.0 },
  { value: 'high-tack', label: 'High-Tack', multiplier: 1.1 },
  { value: 'removable', label: 'Removable', multiplier: 1.05 },
] as const

export const SHAPES = [
  { value: 'standard', label: 'Standard (Rect/Round)', multiplier: 1.0 },
  { value: 'die-cut', label: 'Die-Cut', multiplier: 1.2 },
  { value: 'kiss-cut', label: 'Kiss-Cut', multiplier: 1.15 },
] as const

export const VOLUME_TIERS = [
  { min: 1, max: 49, multiplier: 1.0 },
  { min: 50, max: 99, multiplier: 0.92 },
  { min: 100, max: 249, multiplier: 0.85 },
  { min: 250, max: 499, multiplier: 0.78 },
  { min: 500, max: 999, multiplier: 0.72 },
  { min: 1000, max: Infinity, multiplier: 0.65 },
] as const
