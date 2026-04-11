import crypto from 'crypto'
import type { Order } from '@/types'
import { SITE_URL } from '@/lib/utils/constants'

// ⚠️ PLACEHOLDER: Verify base URLs with Switch API documentation
export const SWITCH_CONFIG = {
  merchantId: process.env.SWITCH_MERCHANT_ID || '',
  merchantKey: process.env.SWITCH_MERCHANT_KEY || '',
  passphrase: process.env.SWITCH_PASSPHRASE || '',
  sandbox: process.env.SWITCH_SANDBOX === 'true',
  get baseUrl() {
    return this.sandbox
      ? 'https://sandbox.switchpayments.co.za' // ⚠️ PLACEHOLDER: confirm with Switch docs
      : 'https://www.switchpayments.co.za'      // ⚠️ PLACEHOLDER: confirm with Switch docs
  },
  get processUrl() {
    return `${this.baseUrl}/eng/process` // ⚠️ PLACEHOLDER: confirm with Switch docs
  },
}

/**
 * Generate an MD5 signature for Switch payment data.
 * ⚠️ PLACEHOLDER: Confirm signature algorithm (MD5 vs HMAC-SHA256) with Switch API docs.
 */
export function generateSwitchSignature(
  data: Record<string, string>,
  passphrase?: string
): string {
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
 * Generate Switch payment form data for an order.
 * ⚠️ PLACEHOLDER: Confirm exact field names required by Switch API docs.
 */
export function generateSwitchPaymentData(
  order: Order,
  email: string
): Record<string, string> {
  const returnUrl = `${SITE_URL}/checkout/success?order_id=${order.id}`
  const cancelUrl = `${SITE_URL}/checkout/cancel?order_id=${order.id}`
  const notifyUrl = `${SITE_URL}/api/webhooks/switch`

  const data: Record<string, string> = {
    merchant_id: SWITCH_CONFIG.merchantId,
    merchant_key: SWITCH_CONFIG.merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    email_address: email,
    m_payment_id: order.id,
    amount: order.total.toFixed(2),
    item_name: `Speedy Print Order #${order.order_number}`,
    item_description: 'Custom sticker/label order',
  }

  data.signature = generateSwitchSignature(data, SWITCH_CONFIG.passphrase)

  return data
}

/**
 * Valid Switch server IP addresses for webhook validation.
 * ⚠️ PLACEHOLDER: Populate this list from Switch API documentation.
 */
export const SWITCH_IPS: string[] = [
  // Add Switch server IPs here after obtaining from Switch docs
]
