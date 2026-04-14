// BUG-022 FIX: Was 'Speedy Labels' — mismatched the DB value ('SpeedyPrint') and footer branding.
// Three different identities were visible simultaneously on the same page.
// TODO: Replace this constant with a live DB read from site_settings.site_name
// so admins can update the brand name without a code deploy.
export const SITE_NAME = 'Speedy Print'
export const SITE_DESCRIPTION = 'Premium custom print and fabrication solutions for business, events and brands — South Africa\'s complete print suite.'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://speedyprint.co.za'

export const VAT_RATE = 0.15 // 15% South African VAT
export const CURRENCY = 'ZAR'
export const CURRENCY_SYMBOL = 'R'
export const COMPANY_ADDRESS = '13 Langwa Street, Strydompark, Randburg, 2169'

export const DIVISIONS = [
  { key: 'labels' as const, name: 'Labels', description: 'Custom labels, stickers, and product packaging', icon: 'Tag' },
  { key: 'race-numbers' as const, name: 'Race Numbers', description: 'Professional race bibs and event numbering', icon: 'Hash' },
  { key: 'mtb-boards' as const, name: 'MTB Boards', description: 'Mountain bike number boards and cycling accessories', icon: 'Bike' },
  { key: 'laser' as const, name: 'Laser', description: 'Laser-cut and engraved signage and gifts', icon: 'Zap' },
  { key: 'trophies' as const, name: 'Trophies', description: 'Award trophies, medals, and recognition products', icon: 'Trophy' },
  { key: 'print' as const, name: 'Print', description: 'Stamps, sleeves, and general commercial printing', icon: 'Printer' },
]

export const HEADER_PRODUCTS = [
  { href: '/labels', label: 'Labels', description: 'Custom labels, stickers, wristbands & car magnets', icon: 'Tag' },
  { href: '/race-numbers', label: 'Race Numbers', description: 'Professional race numbers & event tags', icon: 'Hash' },
  { href: '/mtb-boards', label: 'MTB & Boards', description: 'MTB boards, bike flaps & Correx boards', icon: 'Bike' },
  { href: '/stamps', label: 'Stamps', description: 'Self-inking, pre-inked & traditional stamps', icon: 'Printer' },
  { href: '/laser', label: 'Laser & NFC', description: 'Laser-cut signs, acrylic, gifts & NFC stands', icon: 'Zap' },
  { href: '/trophies', label: 'Trophies', description: 'Awards, medals, plaques & recognition', icon: 'Trophy' },
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
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  pending_design: { label: 'Pending Design', color: 'bg-orange-100 text-orange-700' },
  proof_pending_review: { label: 'Proof: Pending Review', color: 'bg-amber-100 text-amber-700' },
  in_production: { label: 'In Production', color: 'bg-purple-100 text-purple-700' },
  ready_to_ship: { label: 'Ready to Ship', color: 'bg-teal-100 text-teal-700' },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700' },
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

export const WHATSAPP_NUMBER = '27110271811'
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`
export const FREE_DELIVERY_THRESHOLD = 500 // R500
export const FLAT_SHIPPING_RATE = 85 // R85
export const MAX_CART_QUANTITY = 10000

// V2 Sticker/Label Divisions
export const V2_DIVISIONS = [
  { key: 'custom-stickers' as const, name: 'Custom Stickers', description: 'High-quality custom stickers for any purpose', icon: 'Star', color: '#E30613' },
  { key: 'product-labels' as const, name: 'Product Labels', description: 'Professional labels for your products', icon: 'Tag', color: '#1E293B' },
  { key: 'vehicle-decals' as const, name: 'Vehicle & Fleet Decals', description: 'Durable decals for vehicles and fleets', icon: 'Truck', color: '#14B8A6' },
  { key: 'window-wall' as const, name: 'Window & Wall Graphics', description: 'Eye-catching window and wall graphics', icon: 'Layout', color: '#8B5CF6' },
  { key: 'specialty-3d' as const, name: 'Specialty & 3D Domed', description: 'Premium 3D domed stickers and specialty items', icon: 'Diamond', color: '#EC4899' },
]

// Product Families — grouped navigation for the homepage
export const PRODUCT_FAMILIES = [
  {
    key: 'labels-stickers',
    name: 'Labels & Stickers',
    description: 'Custom labels, stickers, wristbands, and car magnets for any surface or application.',
    imageUrl: '/images/products/custom-labels.png',
    icon: 'Tag',
    products: ['Custom Labels', 'Vinyl Stickers', 'Wristbands', 'Car Magnets'],
    divisionKey: 'labels',
  },
  {
    key: 'event-products',
    name: 'Race & Event',
    description: 'Race numbers, event tags, and MTB boards built for performance days.',
    imageUrl: '/images/products/race-bibs.png',
    icon: 'Hash',
    products: ['Race Numbers', 'Event Tags'],
    divisionKey: 'race-numbers',
  },
  {
    key: 'mtb-boards',
    name: 'MTB & Boards',
    description: 'MTB number boards, bike flaps, and Correx signage boards.',
    imageUrl: '/images/products/mtb-number-boards.png',
    icon: 'Bike',
    products: ['MTB Number Boards', 'Bike Flaps', 'Correx Boards'],
    divisionKey: 'mtb-boards',
  },
  {
    key: 'print-stationery',
    name: 'Print & Stationery',
    description: 'Flyers, business cards, brochures, certificates, note pads, stamps, and event printing.',
    imageUrl: '/images/products/self-inking-stamps.png',
    icon: 'Printer',
    products: ['Flyers', 'Business Cards', 'Brochures & Catalogues', 'Certificates', 'Note Pads', 'Self-Inking Stamps', 'Envelopes', 'Event Printing'],
    divisionKey: 'print',
  },
  {
    key: 'laser-fabrication',
    name: 'Laser & NFC',
    description: 'Precision laser-cut acrylic signs, engraved gifts, and smart NFC stands.',
    imageUrl: '/images/products/acrylic-signs.png',
    icon: 'Zap',
    products: ['Acrylic Signs', 'Wooden Plaques', 'NFC Stands'],
    divisionKey: 'laser',
  },
  {
    key: 'signs-display',
    name: 'Signs & Display',
    description: 'Coffee cup sleeves, branded packaging, and award trophies.',
    imageUrl: '/images/products/coffee-cup-sleeves.png',
    icon: 'Layout',
    products: ['Coffee Cup Sleeves', 'Award Trophies'],
    divisionKey: 'trophies',
  },
]

// Pricing Constants
export const BASE_PRICE_PER_UNIT = 25.0 // R25.00 for 100x100mm on white vinyl
export const DOMING_SURCHARGE = 15.0 // R15.00 per unit
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
