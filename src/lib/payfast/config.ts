import crypto from 'crypto'
import type { Order } from '@/types'
import { SITE_URL } from '@/lib/utils/constants'

export const PAYFAST_CONFIG = {
  merchantId: process.env.PAYFAST_MERCHANT_ID || '',
  merchantKey: process.env.PAYFAST_MERCHANT_KEY || '',
  passphrase: process.env.PAYFAST_PASSPHRASE || '',
  sandbox: process.env.PAYFAST_SANDBOX === 'true',
  get baseUrl() {
    return this.sandbox
      ? 'https://sandbox.payfast.co.za'
      : 'https://www.payfast.co.za'
  },
  get processUrl() {
    return `${this.baseUrl}/eng/process`
  },
  get validateUrl() {
    return `${this.baseUrl}/eng/query/validate`
  },
}

/**
 * Generate an MD5 signature for PayFast payment data.
 */
export function generateSignature(
  data: Record<string, string>,
  passphrase?: string
): string {
  // Sort and create query string
  const sortedKeys = Object.keys(data).sort()
  const queryParts = sortedKeys
    .filter((key) => data[key] !== '' && key !== 'signature')
    .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)

  let queryString = queryParts.join('&')

  if (passphrase) {
    queryString += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`
  }

  return crypto.createHash('md5').update(queryString).digest('hex')
}

/**
 * Generate PayFast payment form data for an order.
 */
export function generatePaymentData(
  order: Order,
  email: string
): Record<string, string> {
  const returnUrl = `${SITE_URL}/checkout/success?order_id=${order.id}`
  const cancelUrl = `${SITE_URL}/checkout/cancel?order_id=${order.id}`
  const notifyUrl = `${SITE_URL}/api/webhooks/payfast`

  const data: Record<string, string> = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    email_address: email,
    m_payment_id: order.id,
    amount: order.total.toFixed(2),
    item_name: `SpeedyPrint Order #${order.order_number}`,
    item_description: `Custom sticker/label order`,
  }

  // Generate signature
  data.signature = generateSignature(data, PAYFAST_CONFIG.passphrase)

  return data
}

/**
 * Valid PayFast server IP addresses for ITN validation.
 */
export const PAYFAST_IPS = [
  '197.97.145.144',
  '197.97.145.145',
  '197.97.145.146',
  '197.97.145.147',
  '197.97.145.148',
  '197.97.145.149',
  '197.97.145.150',
  '197.97.145.151',
  '41.74.179.194',
  '41.74.179.195',
  '41.74.179.196',
  '41.74.179.197',
  '41.74.179.198',
  '41.74.179.199',
  '41.74.179.200',
  '41.74.179.201',
  '41.74.179.202',
  '41.74.179.203',
  '41.74.179.204',
]
