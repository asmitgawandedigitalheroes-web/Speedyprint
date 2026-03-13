export const SITE_NAME = 'SpeedyPrint'
export const SITE_DESCRIPTION = 'Custom printing solutions for labels, laser cutting, event numbers, stamps, and more.'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://speedyprint-v1.vercel.app'

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
