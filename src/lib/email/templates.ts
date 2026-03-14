import { SITE_NAME, SITE_URL } from '@/lib/utils/constants'

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <div style="background:#1E3A5F;padding:24px;text-align:center;">
      <h1 style="margin:0;color:#FF6B00;font-size:24px;">${SITE_NAME}</h1>
    </div>
    <!-- Content -->
    <div style="padding:32px 24px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="background:#f5f5f5;padding:24px;text-align:center;font-size:12px;color:#6B7280;">
      <p style="margin:0;">&copy; ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.</p>
      <p style="margin:8px 0 0;"><a href="${SITE_URL}" style="color:#FF6B00;">Visit our website</a></p>
    </div>
  </div>
</body>
</html>`
}

export function orderConfirmationTemplate(orderNumber: string, total: string): string {
  return emailWrapper(`
    <h2 style="color:#1A1A1A;margin:0 0 16px;">Order Confirmed!</h2>
    <p style="color:#6B7280;line-height:1.6;">Thank you for your order. We've received your order <strong>#${orderNumber}</strong> and will begin processing it shortly.</p>
    <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:24px 0;">
      <p style="margin:0;font-size:14px;color:#6B7280;">Order Total</p>
      <p style="margin:4px 0 0;font-size:24px;font-weight:bold;color:#FF6B00;">${total}</p>
    </div>
    <p style="color:#6B7280;line-height:1.6;">We'll send you updates as your order progresses. You can track your order status in your account dashboard.</p>
    <a href="${SITE_URL}/account/orders" style="display:inline-block;background:#FF6B00;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">View Order</a>
  `)
}

export function paymentReceivedTemplate(orderNumber: string): string {
  return emailWrapper(`
    <h2 style="color:#1A1A1A;margin:0 0 16px;">Payment Received</h2>
    <p style="color:#6B7280;line-height:1.6;">We've received payment for order <strong>#${orderNumber}</strong>. Your order is now being prepared for production.</p>
    <p style="color:#6B7280;line-height:1.6;">You'll receive another email once your digital proof is ready for review.</p>
    <a href="${SITE_URL}/account/orders" style="display:inline-block;background:#FF6B00;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Track Order</a>
  `)
}

export function proofReadyTemplate(orderNumber: string, proofUrl: string): string {
  return emailWrapper(`
    <h2 style="color:#1A1A1A;margin:0 0 16px;">Your Proof is Ready!</h2>
    <p style="color:#6B7280;line-height:1.6;">The digital proof for order <strong>#${orderNumber}</strong> is ready for your review. Please check it carefully before approving.</p>
    <a href="${proofUrl}" style="display:inline-block;background:#FF6B00;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Review Proof</a>
    <p style="color:#6B7280;line-height:1.6;margin-top:16px;font-size:14px;">Once you approve the proof, we'll begin printing your order.</p>
  `)
}

export function orderShippedTemplate(orderNumber: string, trackingNumber: string): string {
  return emailWrapper(`
    <h2 style="color:#1A1A1A;margin:0 0 16px;">Your Order Has Shipped!</h2>
    <p style="color:#6B7280;line-height:1.6;">Great news! Order <strong>#${orderNumber}</strong> has been dispatched and is on its way to you.</p>
    <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:24px 0;">
      <p style="margin:0;font-size:14px;color:#6B7280;">Tracking Number</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:bold;color:#1A1A1A;">${trackingNumber}</p>
    </div>
    <p style="color:#6B7280;line-height:1.6;">Standard delivery takes 3-5 business days. You can track your package using the tracking number above.</p>
  `)
}

export function welcomeTemplate(name: string): string {
  return emailWrapper(`
    <h2 style="color:#1A1A1A;margin:0 0 16px;">Welcome to ${SITE_NAME}!</h2>
    <p style="color:#6B7280;line-height:1.6;">Hi ${name}, welcome aboard! You're all set to start ordering custom stickers, labels, and decals.</p>
    <p style="color:#6B7280;line-height:1.6;">Here's what you can do:</p>
    <ul style="color:#6B7280;line-height:1.8;">
      <li>Get an instant quote with our pricing calculator</li>
      <li>Design your stickers online with our design wizard</li>
      <li>Upload your own artwork for professional printing</li>
    </ul>
    <a href="${SITE_URL}/order-now" style="display:inline-block;background:#FF6B00;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Start Your First Order</a>
  `)
}

export function contactFormTemplate(name: string, email: string, subject: string, message: string): string {
  return emailWrapper(`
    <h2 style="color:#1A1A1A;margin:0 0 16px;">New Contact Form Submission</h2>
    <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0 0 8px;"><strong>Name:</strong> ${name}</p>
      <p style="margin:0 0 8px;"><strong>Email:</strong> ${email}</p>
      <p style="margin:0 0 8px;"><strong>Subject:</strong> ${subject}</p>
      <p style="margin:0;"><strong>Message:</strong></p>
      <p style="margin:8px 0 0;color:#6B7280;">${message}</p>
    </div>
  `)
}
