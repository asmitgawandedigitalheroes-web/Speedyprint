import { Resend } from 'resend'
import type { Order } from '@/types'
import { CURRENCY_SYMBOL } from '@/lib/utils/constants'
import {
  orderConfirmationTemplate,
  paymentReceivedTemplate,
  proofReadyTemplate,
  orderShippedTemplate,
  welcomeTemplate,
  contactFormTemplate,
} from './templates'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!)
  }
  return _resend
}
const FROM = process.env.EMAIL_FROM || 'SpeedyPrint <noreply@speedyprint.co.za>'
const ADMIN_EMAIL = 'info@speedyprint.co.za'

export async function sendOrderConfirmation(order: Order, email: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Order Confirmed - #${order.order_number}`,
    html: orderConfirmationTemplate(
      order.order_number,
      `${CURRENCY_SYMBOL}${order.total.toFixed(2)}`
    ),
  })
}

export async function sendPaymentReceived(order: Order, email: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Payment Received - Order #${order.order_number}`,
    html: paymentReceivedTemplate(order.order_number),
  })
}

export async function sendProofReady(
  order: Order,
  proofUrl: string,
  email: string
) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Your Proof is Ready - Order #${order.order_number}`,
    html: proofReadyTemplate(order.order_number, proofUrl),
  })
}

export async function sendOrderShipped(
  order: Order,
  trackingNumber: string,
  email: string
) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Order Shipped - #${order.order_number}`,
    html: orderShippedTemplate(order.order_number, trackingNumber),
  })
}

export async function sendWelcomeEmail(name: string, email: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'Welcome to SpeedyPrint!',
    html: welcomeTemplate(name),
  })
}

export async function sendContactFormEmail(
  name: string,
  email: string,
  subject: string,
  message: string
) {
  return getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: `Contact Form: ${subject}`,
    html: contactFormTemplate(name, email, subject, message),
  })
}
