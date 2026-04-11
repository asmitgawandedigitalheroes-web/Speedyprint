'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SITE_NAME } from '@/lib/utils/constants'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not send your message. Please try again.')
        return
      }
      setSubmitted(true)
    } catch {
      toast.error('Could not send your message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white">
      {/* Page header */}
      <div className="border-b border-gray-100 bg-brand-bg">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-1 w-8 bg-brand-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-brand-text">Contact us</h1>
          <p className="mt-2 text-brand-text-muted">
            Have a question or need a custom quote? Get in touch with our team.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Contact info */}
          <div className="space-y-8">
            {[
              {
                icon: Mail,
                title: 'Email',
                lines: ['info@speedyprint.co.za', 'orders@speedyprint.co.za'],
              },
              {
                icon: Phone,
                title: 'Phone',
                lines: ['011 027 1811', 'Mon–Fri, 08:00–16:30'],
              },
              {
                icon: MapPin,
                title: 'Address',
                lines: ['13 Langwa Street, Strydompark', 'Randburg'],
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-100 bg-brand-bg">
                  <item.icon className="h-5 w-5 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-text">{item.title}</h3>
                  {item.lines.map((l, i) => (
                    <p key={i} className="mt-0.5 text-sm text-brand-text-muted">{l}</p>
                  ))}
                </div>
              </div>
            ))}

            {/* Hours */}
            <div className="rounded-md border border-gray-100 bg-brand-bg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-brand-primary" />
                <h3 className="font-semibold text-brand-text text-sm">Business hours</h3>
              </div>
              <div className="space-y-1.5 text-sm text-brand-text-muted">
                <div className="flex justify-between">
                  <span>Monday – Friday</span><span className="font-medium text-brand-text">08:00 – 16:30</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span><span className="text-brand-text-muted">Closed</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday & Public Holidays</span><span className="text-brand-text-muted">Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="rounded-md border border-green-200 bg-green-50 p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-green-100">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="mt-4 font-heading text-2xl font-bold text-brand-text">Message sent</h2>
                <p className="mt-2 text-brand-text-muted">
                  Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-dark"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 rounded-md border border-gray-100 p-8">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {[
                    { id: 'name', label: 'Full name', type: 'text', placeholder: 'John Doe', key: 'name' },
                    { id: 'email', label: 'Email address', type: 'email', placeholder: 'you@example.com', key: 'email' },
                  ].map((field) => (
                    <div key={field.id}>
                      <label htmlFor={field.id} className="block text-sm font-medium text-brand-text mb-1.5">
                        {field.label}
                      </label>
                      <input
                        id={field.id}
                        type={field.type}
                        required
                        placeholder={field.placeholder}
                        value={form[field.key as keyof typeof form]}
                        onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                        disabled={loading}
                        className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-brand-text mb-1.5">Subject</label>
                  <input
                    id="subject"
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    disabled={loading}
                    className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-brand-text mb-1.5">Message</label>
                  <textarea
                    id="message"
                    rows={6}
                    required
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    disabled={loading}
                    className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-7 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                  ) : (
                    <>Send message <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
