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
  enquiryReplyTemplate,
  adminProofApprovedTemplate,
  adminRevisionRequestedTemplate,
  passwordResetTemplate,
  quoteNotificationTemplate,
  quoteReplyTemplate,
} from './templates'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!)
  }
  return _resend
}
const FROM = process.env.EMAIL_FROM!
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const result = await getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your Speedy Print password',
    html: passwordResetTemplate(resetLink),
  })
  if (result.error) {
    console.error('[Resend] sendPasswordResetEmail error:', result.error)
  } else {
    console.log('[Resend] sendPasswordResetEmail sent, id:', result.data?.id)
  }
  return result
}

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
    subject: 'Welcome to Speedy Print Suite!',
    html: welcomeTemplate(name),
  })
}

export async function sendContactFormEmail(
  name: string,
  email: string,
  subject: string,
  message: string,
  artworkUrl?: string
) {
  return getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: `Contact Form: ${subject}`,
    html: contactFormTemplate(name, email, subject, message, artworkUrl),
  })
}

export async function sendEnquiryReply(
  customerName: string,
  customerEmail: string,
  originalSubject: string,
  replyMessage: string
) {
  return getResend().emails.send({
    from: FROM,
    to: customerEmail,
    replyTo: ADMIN_EMAIL,
    subject: `Re: ${originalSubject}`,
    html: enquiryReplyTemplate(customerName, originalSubject, replyMessage),
  })
}

export async function sendAdminProofApproved(orderNumber: string, productName: string) {
  return getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `✅ Proof Approved — Order #${orderNumber}`,
    html: adminProofApprovedTemplate(orderNumber, productName),
  })
}

export async function sendAdminRevisionRequested(orderNumber: string, customerNotes: string) {
  return getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `🔄 Revision Requested — Order #${orderNumber}`,
    html: adminRevisionRequestedTemplate(orderNumber, customerNotes),
  })
}

export async function sendQuoteNotification(data: Parameters<typeof quoteNotificationTemplate>[0]) {
  return getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: data.email,
    subject: `📋 New Quote Request — ${data.product_type || 'General'} — ${data.full_name}`,
    html: quoteNotificationTemplate(data),
  })
}

export async function sendQuoteReply(
  customerName: string,
  customerEmail: string,
  replyMessage: string,
  quotedPrice?: number | null,
  quoteValidDays?: number | null
) {
  return getResend().emails.send({
    from: FROM,
    to: customerEmail,
    replyTo: ADMIN_EMAIL,
    subject: `Your Quote from Speedy Print is Ready`,
    html: quoteReplyTemplate(customerName, replyMessage, quotedPrice, quoteValidDays),
  })
}
