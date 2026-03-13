'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { SITE_NAME } from '@/lib/utils/constants'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would send to an API route / email service
    setSubmitted(true)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-brand-black">Contact Us</h1>
      <p className="mt-4 text-lg text-brand-gray-medium">
        Have a question or need a custom quote? Get in touch with our team.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="space-y-8">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-red/10">
              <Mail className="h-6 w-6 text-brand-red" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-black">Email</h3>
              <p className="mt-1 text-brand-gray-medium">info@speedyprint.co.za</p>
              <p className="text-brand-gray-medium">orders@speedyprint.co.za</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-red/10">
              <Phone className="h-6 w-6 text-brand-red" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-black">Phone</h3>
              <p className="mt-1 text-brand-gray-medium">+27 (0) 21 123 4567</p>
              <p className="text-sm text-brand-gray-medium">Mon-Fri, 8am - 5pm SAST</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-red/10">
              <MapPin className="h-6 w-6 text-brand-red" />
            </div>
            <div>
              <h3 className="font-semibold text-brand-black">Address</h3>
              <p className="mt-1 text-brand-gray-medium">
                Cape Town, Western Cape<br />
                South Africa
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-brand-bg p-6">
            <h3 className="font-semibold text-brand-black">Business Hours</h3>
            <div className="mt-3 space-y-1 text-sm text-brand-gray-medium">
              <div className="flex justify-between">
                <span>Monday - Friday</span>
                <span>8:00 AM - 5:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday</span>
                <span>9:00 AM - 1:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span>Closed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          {submitted ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Send className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-brand-black">Message Sent!</h2>
              <p className="mt-2 text-brand-gray-medium">
                Thank you for contacting {SITE_NAME}. We&apos;ll get back to you within 24 hours.
              </p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                className="mt-6 rounded-lg bg-brand-red px-6 py-2 text-white transition hover:bg-brand-red-light"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-brand-gray-light p-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-brand-black">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-brand-gray-light px-4 py-2 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-brand-black">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-brand-gray-light px-4 py-2 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-brand-black">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-brand-gray-light px-4 py-2 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-brand-black">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  required
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-brand-gray-light px-4 py-2 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-brand-red px-8 py-3 font-semibold text-white transition hover:bg-brand-red-light"
              >
                <Send className="h-5 w-5" />
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
