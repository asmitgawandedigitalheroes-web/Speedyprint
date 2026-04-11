// ⚠️ PLACEHOLDER: Verify all endpoint paths, field names, and auth scheme with GoBob API docs.

const GOBOB_BASE_URL = process.env.GOBOB_API_URL || 'https://api.gobob.co.za'
const GOBOB_API_KEY = process.env.GOBOB_API_KEY || ''

export interface GoBobAddress {
  name: string
  company?: string
  address1: string
  address2?: string
  city: string
  province: string
  postal_code: string
  country: string
  phone: string
  email?: string
}

export interface GoBobParcel {
  weight_kg: number
  length_cm: number
  width_cm: number
  height_cm: number
  description: string
  value: number
}

export interface GoBobQuoteRequest {
  collection_address: GoBobAddress
  delivery_address: GoBobAddress
  parcels: GoBobParcel[]
  service_type?: string
}

export interface GoBobQuoteResult {
  service_type: string
  service_code: string
  price: number
  price_incl_vat: number
  estimated_days: number
}

export interface GoBobBookRequest {
  collection_address: GoBobAddress
  delivery_address: GoBobAddress
  parcels: GoBobParcel[]
  service_code: string
  reference: string
  special_instructions?: string
}

export interface GoBobBookResult {
  shipment_id: string
  waybill_number: string
  tracking_url: string
  collection_date: string
  estimated_delivery: string
  label_url?: string
}

async function gobobFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${GOBOB_BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${GOBOB_API_KEY}`, // ⚠️ PLACEHOLDER: confirm auth scheme
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GoBob API error ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

/**
 * Fetch shipping quotes from GoBob for a given collection/delivery address pair.
 * ⚠️ PLACEHOLDER: Verify endpoint and request shape with GoBob docs.
 */
export async function getGoBobQuotes(
  request: GoBobQuoteRequest
): Promise<GoBobQuoteResult[]> {
  return gobobFetch<GoBobQuoteResult[]>('/v1/quotes', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

/**
 * Book a shipment with GoBob after payment is confirmed.
 * ⚠️ PLACEHOLDER: Verify endpoint and request shape with GoBob docs.
 */
export async function bookGoBobShipment(
  request: GoBobBookRequest
): Promise<GoBobBookResult> {
  return gobobFetch<GoBobBookResult>('/v1/shipments', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

/**
 * Maps our internal shipping address JSONB to a GoBobAddress shape.
 */
export function buildGoBobDeliveryAddress(
  shippingAddress: {
    full_name?: string
    address_line1?: string
    address_line2?: string
    city?: string
    province?: string
    postal_code?: string
    country?: string
    phone?: string
  },
  email?: string
): GoBobAddress {
  return {
    name: shippingAddress.full_name ?? '',
    address1: shippingAddress.address_line1 ?? '',
    address2: shippingAddress.address_line2,
    city: shippingAddress.city ?? '',
    province: shippingAddress.province ?? '',
    postal_code: shippingAddress.postal_code ?? '',
    country: shippingAddress.country ?? 'ZA',
    phone: shippingAddress.phone ?? '',
    email,
  }
}

/**
 * Returns the Speedyprint warehouse/collection address from env vars.
 */
export function getCollectionAddress(): GoBobAddress {
  return {
    name: 'SpeedyPrint',
    address1: process.env.GOBOB_WAREHOUSE_ADDRESS1 ?? '',
    city: process.env.GOBOB_WAREHOUSE_CITY ?? 'Cape Town',
    province: process.env.GOBOB_WAREHOUSE_PROVINCE ?? 'Western Cape',
    postal_code: process.env.GOBOB_WAREHOUSE_POSTAL ?? '',
    country: 'ZA',
    phone: process.env.GOBOB_WAREHOUSE_PHONE ?? '',
  }
}
