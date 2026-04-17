'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationLoader() {
  const pathname = usePathname()
  const [progress, setProgress]   = useState(0)
  const [visible,  setVisible]    = useState(false)
  const [done,     setDone]       = useState(false)

  const prevPathname  = useRef(pathname)
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const rafRef        = useRef<number | null>(null)

  // ── Start loader on any internal-link or form-button click ──────────────
  useEffect(() => {
    function isInternalHref(href: string | null) {
      if (!href) return false
      // Relative paths and same-origin absolute paths only
      try {
        const url = new URL(href, window.location.origin)
        return url.origin === window.location.origin && !href.startsWith('#')
      } catch {
        return href.startsWith('/')
      }
    }

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      // Walk up the DOM to find a clicked <a> or <button type="submit">
      const anchor = target.closest('a')
      const button = target.closest('button')

      if (anchor && isInternalHref(anchor.getAttribute('href'))) {
        // Don't trigger for same-page anchors
        const href = anchor.getAttribute('href')!
        if (href === pathname) return
        startProgress()
      } else if (button && (button.type === 'submit' || button.getAttribute('data-nav') === 'true')) {
        startProgress()
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [pathname])

  // ── Finish loader when pathname actually changes ─────────────────────────
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname
      finishProgress()
    }
  }, [pathname])

  // ── Helpers ──────────────────────────────────────────────────────────────
  function startProgress() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (rafRef.current)   cancelAnimationFrame(rafRef.current)

    setDone(false)
    setProgress(0)
    setVisible(true)

    // Increment quickly to 30%, then slow down, stall near 85%
    let current = 0
    timerRef.current = setInterval(() => {
      current += current < 30 ? 8 : current < 60 ? 4 : current < 80 ? 1.5 : 0.3
      if (current >= 85) {
        clearInterval(timerRef.current!)
        current = 85
      }
      setProgress(current)
    }, 80)
  }

  function finishProgress() {
    if (timerRef.current) clearInterval(timerRef.current)

    // Jump to 100%, then fade out
    setProgress(100)
    setDone(true)

    rafRef.current = requestAnimationFrame(() => {
      setTimeout(() => {
        setVisible(false)
        setProgress(0)
        setDone(false)
      }, 400)
    })
  }

  if (!visible) return null

  return (
    <>
      {/* Top progress bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent"
        aria-hidden="true"
      >
        <div
          className="h-full bg-brand-primary shadow-[0_0_8px_#E30613aa]"
          style={{
            width: `${progress}%`,
            transition: done
              ? 'width 0.2s ease-out, opacity 0.3s ease 0.15s'
              : 'width 0.08s linear',
            opacity: done ? 0 : 1,
          }}
        />
      </div>

      {/* Subtle page overlay — dims content slightly during navigation */}
      <div
        className="fixed inset-0 z-[9998] pointer-events-none bg-white"
        style={{
          opacity: done ? 0 : 0.25,
          transition: done ? 'opacity 0.3s ease' : 'opacity 0.15s ease',
        }}
      />
    </>
  )
}
