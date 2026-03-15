'use client'

import { MessageCircle } from 'lucide-react'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { WHATSAPP_URL } from '@/lib/utils/constants'

export function WhatsAppButton() {
  const { settings } = useSiteSettings()

  const whatsappNumber = settings.whatsapp_number
  const url = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`
    : WHATSAPP_URL

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 hover:shadow-xl"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  )
}
