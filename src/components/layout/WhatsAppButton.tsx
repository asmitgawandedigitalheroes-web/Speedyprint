'use client'

import { useEffect, useRef, useState } from 'react'
import { Mail, MessageCircle, Phone, X } from 'lucide-react'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { WHATSAPP_URL } from '@/lib/utils/constants'

export function WhatsAppButton() {
  const { settings } = useSiteSettings()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const whatsappNumber = settings.whatsapp_number
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hi%2C+I+need+help+with+my+design+on+Speedy+Print.`
    : `${WHATSAPP_URL}?text=Hi%2C+I+need+help+with+my+design+on+Speedy+Print.`

  const email = settings.company_email || 'info@speedyprint.co.za'
  const phone = settings.company_phone || '011 027 1811'
  const phoneTel = phone.replace(/[^0-9+]/g, '')

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Contact panel */}
      {open && (
        <div className="mb-1 w-64 rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="flex items-center justify-between rounded-t-2xl bg-gray-50 px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Contact us</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-2 space-y-1">
            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-green-50 transition-colors group"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-gray-800 group-hover:text-green-700">WhatsApp</p>
                <p className="text-xs text-gray-400">Chat with us instantly</p>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${email}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-blue-50 transition-colors group"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Mail className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 group-hover:text-blue-700">Email us</p>
                <p className="text-xs text-gray-400 truncate">{email}</p>
              </div>
            </a>

            {/* Phone */}
            <a
              href={`tel:${phoneTel}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-gray-50 transition-colors group"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <Phone className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">Call us</p>
                <p className="text-xs text-gray-400">{phone}</p>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 hover:shadow-xl"
        aria-label="Contact us"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </button>
    </div>
  )
}
