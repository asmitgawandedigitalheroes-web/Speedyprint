/**
 * Bob Go Shipping API client — v2
 * Sandbox: https://api.sandbox.bobgo.co.za/v2
 * Production: https://api.bobgo.co.za/v2
 * Auth: Bearer token
 */

const BOBGO_BASE_URL = (process.env.BOBGO_API_URL || 'https://api.sandbox.bobgo.co.za/v2').replace(/\/$/, '')
const BOBGO_API_KEY = process.env.BOBGO_API_KEY || ''

// ─── Address ───────────────────────────────────────────────────────────────

export interface BobGoAddress {
  company?: string
  street_address: string  // e.g. "13 Langwa Street"
  local_area: string      // suburb / area e.g. "Strydompark"
  city: string            // e.g. "Randburg"
  zone: string            // province e.g. "Gauteng"
  country: string         // ISO 3166-1 alpha-2 e.g. "ZA"
  code: string            // postal code e.g. "2169"
  lat?: number
  lng?: number
}

// ─── Rates at Checkout ─────────────────────────────────────────────────────

export interface BobGoRACItem {
  description: string
  price: number
  quantity: number
  length_cm: number
  width_cm: number
  height_cm: number
  weight_kg: number
}

export interface BobGoRACRequest {
  collection_address: BobGoAddress
  delivery_address: BobGoAddress
  items: BobGoRACItem[]
  declared_value: number
  handling_time: number  // business days before dispatch
}

export interface BobGoRate {
  id: number
  service_level_code: string
  service_name: string        // display name e.g. "Standard shipping"
  provider_slug: string
  total_price: number         // price incl. VAT
  base_rate?: number
  currency?: string
  min_delivery_date?: string
  max_delivery_date?: string
  type?: string               // e.g. "door"
}

// ─── Shipments (booking) ───────────────────────────────────────────────────

export interface BobGoParcel {
  description: string
  submitted_length_cm: number
  submitted_width_cm: number
  submitted_height_cm: number
  submitted_weight_kg: number
  custom_parcel_reference?: string
}

export interface BobGoShipmentRequest {
  collection_address: BobGoAddress
  collection_contact_name: string
  collection_contact_mobile_number: string
  collection_contact_email: string
  delivery_address: BobGoAddress
  delivery_contact_name: string
  delivery_contact_mobile_number: string
  delivery_contact_email: string
  parcels: BobGoParcel[]
  declared_value: number
  service_level_code: string   // from the prior rate quote
  provider_slug: string        // from the prior rate quote
  custom_order_number?: string
  custom_tracking_reference?: string
  instructions_collection?: string
  instructions_delivery?: string
}

export interface BobGoShipmentResult {
  id: number
  tracking_reference: string
  waybill_url?: string
  label_url?: string
  collection_date?: string
  estimated_delivery?: string
}

// ─── HTTP helper ───────────────────────────────────────────────────────────

async function bobGoFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BOBGO_BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${BOBGO_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Bob Go API error ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Fetch shipping rates at checkout (uses your Bob Go platform rules/markup).
 * Response shape: { rates: { count: number; rates: BobGoRate[] } }
 */
export async function getBobGoRates(request: BobGoRACRequest): Promise<BobGoRate[]> {
  const response = await bobGoFetch<{ count: number; rates: BobGoRate[] }>(
    '/rates-at-checkout',
    { method: 'POST', body: JSON.stringify(request) }
  )
  return response?.rates ?? []
}

// ─── Tracking ──────────────────────────────────────────────────────────────

export interface BobGoTrackingEvent {
  id: number
  date: string
  status: string
  location?: string
  message?: string
}

export interface BobGoTrackingResult {
  id: number
  shipment_tracking_reference: string
  status: string
  tracking_events: BobGoTrackingEvent[]
}

/**
 * Fetch live tracking events for a shipment by its tracking reference.
 */
export async function getBobGoTracking(trackingReference: string): Promise<BobGoTrackingResult> {
  return bobGoFetch<BobGoTrackingResult>(
    `/tracking?tracking_reference=${encodeURIComponent(trackingReference)}`
  )
}

/**
 * Book a shipment after payment. Requires service_level_code + provider_slug
 * obtained from a prior rates call.
 */
export async function bookBobGoShipment(
  request: BobGoShipmentRequest
): Promise<BobGoShipmentResult> {
  return bobGoFetch<BobGoShipmentResult>('/shipments', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// ─── Address helpers ───────────────────────────────────────────────────────

/**
 * Map our internal ShippingAddress shape to a BobGoAddress.
 * Bob Go requires street_address, local_area, city, zone, code.
 */
export function buildBobGoDeliveryAddress(
  addr: {
    full_name?: string
    address_line1?: string
    address_line2?: string
    city?: string
    province?: string
    postal_code?: string
    country?: string
    phone?: string
  }
): BobGoAddress {
  return {
    // Use address_line2 as suburb/local_area; fall back to city
    street_address: addr.address_line1 ?? '',
    local_area: addr.address_line2 || addr.city || '',
    city: addr.city ?? '',
    zone: addr.province ?? '',
    country: addr.country ?? 'ZA',
    code: addr.postal_code ?? '',
  }
}

/**
 * Returns the SpeedyPrint warehouse collection address from env vars.
 */
export function getWarehouseAddress(): BobGoAddress {
  return {
    street_address: process.env.BOBGO_WAREHOUSE_STREET ?? '13 Langwa Street',
    local_area: process.env.BOBGO_WAREHOUSE_LOCAL_AREA ?? 'Strydompark',
    city: process.env.BOBGO_WAREHOUSE_CITY ?? 'Randburg',
    zone: process.env.BOBGO_WAREHOUSE_PROVINCE ?? 'Gauteng',
    country: 'ZA',
    code: process.env.BOBGO_WAREHOUSE_POSTAL ?? '2169',
  }
}

/**
 * Encode a selected rate into a single string for DB storage.
 * Format: "provider_slug|service_level_code"
 */
export function encodeServiceType(providerSlug: string, serviceLevelCode: string): string {
  return `${providerSlug}|${serviceLevelCode}`
}

/**
 * Decode a service type string back into provider_slug + service_level_code.
 */
export function decodeServiceType(serviceType: string): { provider_slug: string; service_level_code: string } {
  const [provider_slug = '', service_level_code = ''] = serviceType.split('|')
  return { provider_slug, service_level_code }
}
