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
    <p style="color:#6B7280;line-height:1.6;">Hi ${name}, welcome aboard! You're all set to start ordering custom print and fabrication solutions.</p>
    <p style="color:#6B7280;line-height:1.6;">Here's what you can do:</p>
    <ul style="color:#6B7280;line-height:1.8;">
      <li>Get an instant quote with our pricing calculator</li>
      <li>Design your stickers online with our design wizard</li>
      <li>Upload your own artwork for professional printing</li>
    </ul>
    <a href="${SITE_URL}/order-now" style="display:inline-block;background:#FF6B00;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Start Your First Order</a>
  `)
}

export function adminProofApprovedTemplate(orderNumber: string, productName: string): string {
  return emailWrapper(`
    <h2 style="color:#1A1A1A;margin:0 0 16px;">✅ Proof Approved</h2>
    <p style="color:#6B7280;line-height:1.6;">A customer has approved their proof for order <strong>#${orderNumber}</strong>.</p>
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:24px 0;">
      <p style="margin:0;font-size:14px;color:#166534;"><strong>Product:</strong> ${productName}</p>
    </div>
    <p style="color:#6B7280;line-height:1.6;">The order item status has been updated to <strong>In Production</strong>. Production files have been generated and are ready for download in the admin dashboard.</p>
    <a href="${SITE_URL}/admin/orders" style="display:inline-block;background:#FF6B00;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">View Order</a>
  `)
}

export function adminRevisionRequestedTemplate(orderNumber: string, customerNotes: string): string {
  return emailWrapper(`
    <h2 style="color:#1A1A1A;margin:0 0 16px;">🔄 Revision Requested</h2>
    <p style="color:#6B7280;line-height:1.6;">A customer has requested a revision for order <strong>#${orderNumber}</strong>.</p>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#9a3412;">Customer Notes:</p>
      <p style="margin:0;color:#6B7280;font-style:italic;">${customerNotes}</p>
    </div>
    <p style="color:#6B7280;line-height:1.6;">Please review the feedback, make the necessary changes, and upload a new proof version.</p>
    <a href="${SITE_URL}/admin/orders" style="display:inline-block;background:#FF6B00;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Go to Orders</a>
  `)
}

export function passwordResetTemplate(resetLink: string): string {
  return emailWrapper(`
    <h2 style="color:#1A1A1A;margin:0 0 16px;">Reset Your Password</h2>
    <p style="color:#6B7280;line-height:1.6;">We received a request to reset the password for your ${SITE_NAME} account. Click the button below to choose a new password.</p>
    <a href="${resetLink}" style="display:inline-block;background:#FF6B00;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Reset Password</a>
    <p style="color:#6B7280;line-height:1.6;margin-top:24px;font-size:14px;">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password will not change.</p>
    <p style="color:#9CA3AF;font-size:12px;margin-top:16px;">If the button doesn't work, copy and paste this link into your browser:<br><span style="color:#FF6B00;word-break:break-all;">${resetLink}</span></p>
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
    <a href="${SITE_URL}/admin/enquiries" style="display:inline-block;background:#E30613;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">View in Admin</a>
  `)
}

export function enquiryReplyTemplate(customerName: string, originalSubject: string, replyMessage: string): string {
  return emailWrapper(`
    <h2 style="color:#1A1A1A;margin:0 0 8px;">Re: ${originalSubject}</h2>
    <p style="color:#6B7280;line-height:1.6;margin:0 0 24px;">Hi ${customerName}, thanks for getting in touch. Here's our response:</p>
    <div style="background:#f5f5f5;border-left:4px solid #E30613;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0;color:#1A1A1A;line-height:1.8;white-space:pre-wrap;">${replyMessage}</p>
    </div>
    <p style="color:#6B7280;font-size:14px;line-height:1.6;">If you have any further questions, feel free to reply to this email or visit our website.</p>
    <a href="${SITE_URL}/contact" style="display:inline-block;background:#E30613;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:16px;">Contact Us Again</a>
  `)
}
