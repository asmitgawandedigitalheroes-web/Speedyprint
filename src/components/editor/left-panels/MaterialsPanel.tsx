'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Search, ChevronRight, X, Check, Type, Palette, Download } from 'lucide-react'
import { useEditorStore } from '@/lib/editor/useEditorStore'
import { setBackground, setBackgroundPattern, setBackgroundGradient, addSVGToCanvas, getArtboardCenter } from '@/lib/editor/fabricUtils'
import { Rect, Pattern } from 'fabric'

const StrapiMaterialsBrowser = dynamic(() => import('./StrapiMaterialsBrowser'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-xs text-ed-text-dim">Loading library...</div>
    </div>
  ),
})


/* ───── Pattern tile drawing helpers ───── */

/** Creates an offscreen canvas, draws a pattern tile, and returns a Fabric.js Pattern */
function createPatternFromDraw(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  tileSize: number
): Pattern {
  const patCanvas = document.createElement('canvas')
  patCanvas.width = tileSize
  patCanvas.height = tileSize
  const ctx = patCanvas.getContext('2d')!
  draw(ctx, tileSize)
  return new Pattern({
    source: patCanvas,
    repeat: 'repeat',
  })
}

/* ───── Asset types ───── */

type PatternDrawFn = (ctx: CanvasRenderingContext2D, size: number) => void

interface AssetItem {
  id: string
  name: string
  /** CSS value for the thumbnail preview */
  preview: string
  /** SVG string — added to canvas as an image when clicked */
  svg?: string
  /** Hex color — applied as background or rect fill */
  color?: string
  /** Gradient color stops — when present, applies as gradient background */
  gradientStops?: { offset: number; color: string }[]
  /** Gradient angle in degrees (default 135) */
  gradientAngle?: number
  /** Draw function for pattern tile — when present, creates a real pattern fill */
  patternDraw?: PatternDrawFn
  /** Tile size for the pattern (default 20) */
  patternSize?: number
  /** 'bg' applies as background, 'shape' adds rect, 'svg' adds svg image */
  mode: 'bg' | 'shape' | 'svg'
}

interface AssetCategory {
  id: string
  title: string
  items: AssetItem[]
}

/* ───── SVG color/text helpers ───── */

/** Extract unique fill/stroke colors from an SVG string (excluding white/transparent/none) */
function extractSvgColors(svg: string): string[] {
  const colorRegex = /(?:fill|stroke)="(#[0-9A-Fa-f]{3,8})"/g
  const colors = new Set<string>()
  let match
  while ((match = colorRegex.exec(svg)) !== null) {
    const c = match[1].toUpperCase()
    if (c !== '#FFF' && c !== '#FFFFFF' && c !== '#000' && c !== '#000000') {
      colors.add(c)
    }
  }
  return [...colors]
}

/** Extract text content from SVG <text> elements */
function extractSvgTexts(svg: string): string[] {
  const textRegex = /<text[^>]*>([^<]+)<\/text>/g
  const texts: string[] = []
  let match
  while ((match = textRegex.exec(svg)) !== null) {
    texts.push(match[1])
  }
  return texts
}

/** Replace a specific color in SVG (both fill and stroke) */
function replaceSvgColor(svg: string, oldColor: string, newColor: string): string {
  const escaped = oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Case-insensitive replacement for fill and stroke attributes
  return svg.replace(new RegExp(`((?:fill|stroke)=")${escaped}(")`, 'gi'), `$1${newColor}$2`)
}

/** Replace text content in the nth <text> element */
function replaceSvgText(svg: string, index: number, newText: string): string {
  let i = 0
  return svg.replace(/<text([^>]*)>([^<]+)<\/text>/g, (full, attrs, _oldText) => {
    if (i++ === index) return `<text${attrs}>${newText}</text>`
    return full
  })
}

/* ───── Quick color palette ───── */

const QUICK_COLORS = [
  '#E53935', '#D81B60', '#8E24AA', '#5C6BC0', '#1E88E5',
  '#00ACC1', '#00897B', '#43A047', '#7CB342', '#FDD835',
  '#FFB300', '#FB8C00', '#F4511E', '#6D4C41', '#546E7A',
  '#212121', '#FFD700', '#FF69B4', '#00CED1', '#FF6347',
]

/* ───── SVG asset data ───── */

const svgIcon = (body: string, size = 80, viewBox = '0 0 80 80') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">${body}</svg>`

const CATEGORIES: AssetCategory[] = [
  {
    id: 'backgrounds',
    title: 'Backgrounds & Gradients',
    items: [
      { id: 'bg-white', name: 'White', preview: '#FFFFFF', color: '#FFFFFF', mode: 'bg' },
      { id: 'bg-lightgray', name: 'Light Gray', preview: '#F5F5F5', color: '#F5F5F5', mode: 'bg' },
      { id: 'bg-black', name: 'Black', preview: '#000000', color: '#000000', mode: 'bg' },
      { id: 'bg-cream', name: 'Cream', preview: '#FFF8E7', color: '#FFF8E7', mode: 'bg' },
      { id: 'bg-blue', name: 'Blue Gradient', preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#667eea' }, { offset: 1, color: '#764ba2' }] },
      { id: 'bg-sunset', name: 'Sunset', preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#f093fb' }, { offset: 1, color: '#f5576c' }] },
      { id: 'bg-ocean', name: 'Ocean', preview: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#0093E9' }, { offset: 1, color: '#80D0C7' }] },
      { id: 'bg-fire', name: 'Fire', preview: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#f12711' }, { offset: 1, color: '#f5af19' }] },
      { id: 'bg-mint', name: 'Mint', preview: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#11998e' }, { offset: 1, color: '#38ef7d' }] },
      { id: 'bg-lavender', name: 'Lavender', preview: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#a18cd1' }, { offset: 1, color: '#fbc2eb' }] },
      { id: 'bg-peach', name: 'Peach', preview: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#ffecd2' }, { offset: 1, color: '#fcb69f' }] },
      { id: 'bg-night', name: 'Night Sky', preview: 'linear-gradient(135deg, #0c0c0c 0%, #434343 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#0c0c0c' }, { offset: 1, color: '#434343' }] },
      { id: 'bg-gold', name: 'Gold', preview: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#f7971e' }, { offset: 1, color: '#ffd200' }] },
      { id: 'bg-rose', name: 'Rose', preview: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#ee9ca7' }, { offset: 1, color: '#ffdde1' }] },
      { id: 'bg-cherry', name: 'Cherry', preview: 'linear-gradient(135deg, #EB3349 0%, #F45C43 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#EB3349' }, { offset: 1, color: '#F45C43' }] },
      { id: 'bg-royal', name: 'Royal', preview: 'linear-gradient(135deg, #141E30 0%, #243B55 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#141E30' }, { offset: 1, color: '#243B55' }] },
      { id: 'bg-emerald', name: 'Emerald', preview: 'linear-gradient(135deg, #43C6AC 0%, #191654 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#43C6AC' }, { offset: 1, color: '#191654' }] },
      { id: 'bg-cotton', name: 'Cotton Candy', preview: 'linear-gradient(135deg, #E8CBC0 0%, #636FA4 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#E8CBC0' }, { offset: 1, color: '#636FA4' }] },
      { id: 'bg-coral', name: 'Coral Reef', preview: 'linear-gradient(135deg, #FF6B6B 0%, #556270 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#FF6B6B' }, { offset: 1, color: '#556270' }] },
      { id: 'bg-neon', name: 'Neon', preview: 'linear-gradient(135deg, #00F260 0%, #0575E6 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#00F260' }, { offset: 1, color: '#0575E6' }] },
      { id: 'bg-aurora', name: 'Aurora', preview: 'linear-gradient(135deg, #7F00FF 0%, #E100FF 50%, #00F0FF 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#7F00FF' }, { offset: 0.5, color: '#E100FF' }, { offset: 1, color: '#00F0FF' }] },
      { id: 'bg-sahara', name: 'Sahara', preview: 'linear-gradient(135deg, #F4E2D8 0%, #BA5370 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#F4E2D8' }, { offset: 1, color: '#BA5370' }] },
      { id: 'bg-ice', name: 'Ice', preview: 'linear-gradient(135deg, #E6DADA 0%, #274046 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#E6DADA' }, { offset: 1, color: '#274046' }] },
      { id: 'bg-rainbow', name: 'Rainbow', preview: 'linear-gradient(135deg, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#ff0000' }, { offset: 0.17, color: '#ffff00' }, { offset: 0.33, color: '#00ff00' }, { offset: 0.5, color: '#00ffff' }, { offset: 0.67, color: '#0000ff' }, { offset: 0.83, color: '#ff00ff' }, { offset: 1, color: '#ff0000' }] },
      { id: 'bg-sky', name: 'Sky Blue', preview: 'linear-gradient(180deg, #87CEEB 0%, #E0F7FA 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#87CEEB' }, { offset: 1, color: '#E0F7FA' }], gradientAngle: 180 },
      { id: 'bg-dusk', name: 'Dusk', preview: 'linear-gradient(135deg, #2C3E50 0%, #FD746C 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#2C3E50' }, { offset: 1, color: '#FD746C' }] },
      { id: 'bg-pastel', name: 'Pastel Dream', preview: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#FFDEE9' }, { offset: 1, color: '#B5FFFC' }] },
      { id: 'bg-forest', name: 'Forest', preview: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#134E5E' }, { offset: 1, color: '#71B280' }] },
    ],
  },
  {
    id: 'stickers',
    title: 'Stickers & Icons',
    items: [
      {
        id: 'stk-check-circle', name: 'Checkmark Circle', preview: '#E8F5E9',
        svg: svgIcon('<circle cx="40" cy="40" r="28" fill="none" stroke="#34A853" stroke-width="3"/><polyline points="24,40 35,51 56,30" fill="none" stroke="#34A853" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'stk-info', name: 'Info', preview: '#E3F2FD',
        svg: svgIcon('<circle cx="40" cy="40" r="28" fill="none" stroke="#4285F4" stroke-width="3"/><circle cx="40" cy="26" r="3" fill="#4285F4"/><line x1="40" y1="35" x2="40" y2="58" stroke="#4285F4" stroke-width="3.5" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'stk-warning', name: 'Warning', preview: '#FFF8E1',
        svg: svgIcon('<path d="M40 10 L72 66 H8 Z" fill="none" stroke="#FBBC04" stroke-width="3" stroke-linejoin="round"/><line x1="40" y1="32" x2="40" y2="48" stroke="#FBBC04" stroke-width="3.5" stroke-linecap="round"/><circle cx="40" cy="57" r="2.5" fill="#FBBC04"/>'),
        mode: 'svg',
      },
      {
        id: 'stk-verified', name: 'Verified Badge', preview: '#E8EAF6',
        svg: svgIcon('<path d="M40 6 L48 16 L60 12 L58 24 L70 30 L62 40 L70 50 L58 56 L60 68 L48 64 L40 74 L32 64 L20 68 L22 56 L10 50 L18 40 L10 30 L22 24 L20 12 L32 16 Z" fill="#4285F4"/><polyline points="28,40 36,48 54,30" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'stk-sparkle', name: 'Sparkle', preview: '#FFF8E1',
        svg: svgIcon('<path d="M40 8 C42 28 52 38 72 40 C52 42 42 52 40 72 C38 52 28 42 8 40 C28 38 38 28 40 8Z" fill="none" stroke="#FBBC04" stroke-width="2.5" stroke-linejoin="round"/><path d="M58 12 C59 18 62 21 68 22 C62 23 59 26 58 32 C57 26 54 23 48 22 C54 21 57 18 58 12Z" fill="#FBBC04"/>'),
        mode: 'svg',
      },
      {
        id: 'stk-thumbsup', name: 'Thumbs Up', preview: '#E3F2FD',
        svg: svgIcon('<path d="M22 42 L22 66 L32 66 L32 42 Z" fill="none" stroke="#4285F4" stroke-width="2.5" stroke-linejoin="round"/><path d="M32 66 L50 66 C54 66 57 63 58 59 L62 45 C63 41 60 38 56 38 L46 38 L48 28 C49 24 46 20 42 20 L40 20 L32 42" fill="none" stroke="#4285F4" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'stk-coffee', name: 'Coffee Cup', preview: '#EFEBE9',
        svg: svgIcon('<path d="M16 30 L22 66 L54 66 L60 30 Z" fill="none" stroke="#5D4037" stroke-width="2.5" stroke-linejoin="round"/><path d="M60 36 C60 36 68 36 68 46 C68 56 60 56 60 56" fill="none" stroke="#5D4037" stroke-width="2.5" stroke-linecap="round"/><rect x="14" y="70" width="48" height="4" rx="2" fill="none" stroke="#5D4037" stroke-width="2"/><path d="M30 18 C30 14 34 12 34 8" fill="none" stroke="#8D6E63" stroke-width="2" stroke-linecap="round"/><path d="M40 18 C40 14 44 12 44 8" fill="none" stroke="#8D6E63" stroke-width="2" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'stk-leaf', name: 'Leaf', preview: '#E8F5E9',
        svg: svgIcon('<path d="M16 64 C16 64 16 28 48 12 C48 12 56 44 28 60" fill="none" stroke="#34A853" stroke-width="2.5" stroke-linejoin="round"/><path d="M16 64 C28 48 38 32 48 12" fill="none" stroke="#34A853" stroke-width="2" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'stk-lightbulb', name: 'Lightbulb', preview: '#FFF8E1',
        svg: svgIcon('<path d="M30 52 C24 46 20 38 20 32 C20 20 28 12 40 12 C52 12 60 20 60 32 C60 38 56 46 50 52 Z" fill="none" stroke="#FBBC04" stroke-width="2.5" stroke-linejoin="round"/><line x1="30" y1="58" x2="50" y2="58" stroke="#FBBC04" stroke-width="2.5" stroke-linecap="round"/><line x1="32" y1="64" x2="48" y2="64" stroke="#FBBC04" stroke-width="2.5" stroke-linecap="round"/><line x1="36" y1="70" x2="44" y2="70" stroke="#FBBC04" stroke-width="2.5" stroke-linecap="round"/><line x1="40" y1="36" x2="40" y2="52" stroke="#FBBC04" stroke-width="2" stroke-linecap="round"/><line x1="32" y1="40" x2="40" y2="48" stroke="#FBBC04" stroke-width="2" stroke-linecap="round"/><line x1="48" y1="40" x2="40" y2="48" stroke="#FBBC04" stroke-width="2" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'stk-gear', name: 'Settings Gear', preview: '#ECEFF1',
        svg: svgIcon('<circle cx="40" cy="40" r="10" fill="none" stroke="#546E7A" stroke-width="2.5"/><path d="M40 10 L44 18 L50 16 L52 24 L58 24 L56 32 L64 34 L60 40 L64 46 L56 48 L58 56 L52 56 L50 64 L44 62 L40 70 L36 62 L30 64 L28 56 L22 56 L24 48 L16 46 L20 40 L16 34 L24 32 L22 24 L28 24 L30 16 L36 18 Z" fill="none" stroke="#546E7A" stroke-width="2.5" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'stk-bag', name: 'Shopping Bag', preview: '#F3E5F5',
        svg: svgIcon('<path d="M14 28 L18 70 L62 70 L66 28 Z" fill="none" stroke="#7B1FA2" stroke-width="2.5" stroke-linejoin="round"/><path d="M28 28 L28 20 C28 13 33 8 40 8 C47 8 52 13 52 20 L52 28" fill="none" stroke="#7B1FA2" stroke-width="2.5" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'stk-truck', name: 'Delivery Truck', preview: '#E3F2FD',
        svg: svgIcon('<rect x="6" y="26" width="42" height="30" rx="3" fill="none" stroke="#1976D2" stroke-width="2.5"/><path d="M48 36 L64 36 L72 48 L72 56 L48 56 Z" fill="none" stroke="#1976D2" stroke-width="2.5" stroke-linejoin="round"/><circle cx="22" cy="60" r="6" fill="none" stroke="#1976D2" stroke-width="2.5"/><circle cx="60" cy="60" r="6" fill="none" stroke="#1976D2" stroke-width="2.5"/><line x1="28" y1="60" x2="54" y2="60" stroke="#1976D2" stroke-width="2"/>'),
        mode: 'svg',
      },
      {
        id: 'stk-barcode', name: 'Barcode', preview: '#FAFAFA',
        svg: svgIcon('<g fill="#37474F"><rect x="10" y="16" width="4" height="40"/><rect x="18" y="16" width="2" height="40"/><rect x="24" y="16" width="6" height="40"/><rect x="34" y="16" width="2" height="40"/><rect x="40" y="16" width="4" height="40"/><rect x="48" y="16" width="2" height="40"/><rect x="54" y="16" width="6" height="40"/><rect x="64" y="16" width="4" height="40"/><rect x="70" y="16" width="2" height="40"/></g><text x="40" y="68" text-anchor="middle" fill="#37474F" font-size="9" font-family="monospace">123456789</text>'),
        mode: 'svg',
      },
      {
        id: 'stk-wifi', name: 'WiFi', preview: '#E8EAF6',
        svg: svgIcon('<circle cx="40" cy="60" r="4" fill="#5C6BC0"/><path d="M26 50 C30 44 34 42 40 42 C46 42 50 44 54 50" fill="none" stroke="#5C6BC0" stroke-width="2.5" stroke-linecap="round"/><path d="M16 40 C22 32 30 28 40 28 C50 28 58 32 64 40" fill="none" stroke="#5C6BC0" stroke-width="2.5" stroke-linecap="round"/><path d="M8 30 C16 20 26 14 40 14 C54 14 64 20 72 30" fill="none" stroke="#5C6BC0" stroke-width="2.5" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'stk-shield', name: 'Shield Check', preview: '#E0F2F1',
        svg: svgIcon('<path d="M40 8 L66 20 V42 C66 56 40 72 40 72 C40 72 14 56 14 42 V20 Z" fill="none" stroke="#00897B" stroke-width="2.5" stroke-linejoin="round"/><polyline points="28,40 36,48 52,32" fill="none" stroke="#00897B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
    ],
  },
  {
    id: 'labels',
    title: 'Labels & Tags',
    items: [
      {
        id: 'lbl-new', name: 'NEW Pill', preview: '#E8F5E9',
        svg: svgIcon('<rect x="8" y="26" width="64" height="28" rx="14" fill="#34A853"/><text x="40" y="45" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">NEW</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-sale', name: 'SALE Tag', preview: '#FFEBEE',
        svg: svgIcon('<path d="M10 20 L58 20 L72 40 L58 60 L10 60 Z" fill="#EA4335"/><circle cx="16" cy="40" r="3" fill="white"/><text x="42" y="45" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">SALE</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-percent', name: 'Percent Off', preview: '#EDE7F6',
        svg: svgIcon('<circle cx="40" cy="40" r="30" fill="#5C6BC0"/><text x="40" y="36" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="sans-serif">30%</text><text x="40" y="52" text-anchor="middle" fill="#C5CAE9" font-size="10" font-weight="bold" font-family="sans-serif">OFF</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-bestseller', name: 'Best Seller', preview: '#FFF3E0',
        svg: svgIcon('<path d="M6 22 L74 22 L74 50 L40 62 L6 50 Z" fill="#FB8C00"/><text x="40" y="40" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="sans-serif">BEST SELLER</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-limited', name: 'LIMITED Stamp', preview: '#FFEBEE',
        svg: svgIcon('<rect x="8" y="18" width="64" height="44" rx="4" fill="none" stroke="#EA4335" stroke-width="3"/><rect x="14" y="24" width="52" height="32" rx="2" fill="none" stroke="#EA4335" stroke-width="1.5"/><text x="40" y="45" text-anchor="middle" fill="#EA4335" font-size="12" font-weight="bold" font-family="sans-serif">LIMITED</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-organic', name: 'Organic', preview: '#E8F5E9',
        svg: svgIcon('<circle cx="40" cy="40" r="30" fill="#2E7D32"/><path d="M30 50 C30 34 40 24 52 22 C52 22 50 36 40 42 C36 44 32 48 30 50Z" fill="#81C784"/><text x="40" y="62" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="sans-serif">ORGANIC</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-premium', name: 'PREMIUM', preview: '#FFF8E1',
        svg: svgIcon('<rect x="6" y="20" width="68" height="40" rx="4" fill="#1a1a1a"/><rect x="9" y="23" width="62" height="34" rx="2" fill="none" stroke="#D4AF37" stroke-width="1.5"/><text x="40" y="44" text-anchor="middle" fill="#D4AF37" font-size="11" font-weight="bold" font-family="sans-serif">PREMIUM</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-freeship', name: 'Free Shipping', preview: '#E3F2FD',
        svg: svgIcon('<rect x="4" y="22" width="72" height="36" rx="18" fill="#4285F4"/><text x="40" y="38" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="sans-serif">FREE</text><text x="40" y="50" text-anchor="middle" fill="#BBDEFB" font-size="8" font-weight="bold" font-family="sans-serif">SHIPPING</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-exclusive', name: 'EXCLUSIVE', preview: '#F3E5F5',
        svg: svgIcon('<polygon points="40,6 58,14 70,30 70,50 58,66 40,74 22,66 10,50 10,30 22,14" fill="#7B1FA2"/><text x="40" y="43" text-anchor="middle" fill="white" font-size="9" font-weight="bold" font-family="sans-serif">EXCLUSIVE</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-trust', name: 'Trust Badge', preview: '#E0F2F1',
        svg: svgIcon('<path d="M40 8 L66 20 V42 C66 56 40 72 40 72 C40 72 14 56 14 42 V20 Z" fill="#00897B"/><polyline points="28,38 36,46 52,30" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="40" y="62" text-anchor="middle" fill="white" font-size="7" font-weight="bold" font-family="sans-serif">TRUSTED</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-hot', name: 'HOT Deal', preview: '#FBE9E7',
        svg: svgIcon('<rect x="8" y="24" width="64" height="32" rx="16" fill="#EA4335"/><text x="40" y="44" text-anchor="middle" fill="white" font-size="15" font-weight="bold" font-family="sans-serif">HOT</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-price', name: 'Price Tag', preview: '#FFFDE7',
        svg: svgIcon('<path d="M8 40 L34 14 H72 V66 H34 Z" fill="none" stroke="#F57F17" stroke-width="2.5" stroke-linejoin="round"/><circle cx="54" cy="32" r="4" fill="none" stroke="#F57F17" stroke-width="2"/>'),
        mode: 'svg',
      },
    ],
  },
  {
    id: 'decorative',
    title: 'Decorative Elements',
    items: [
      {
        id: 'dec-thin-divider', name: 'Thin Divider', preview: '#ECEFF1',
        svg: svgIcon('<line x1="8" y1="40" x2="72" y2="40" stroke="#90A4AE" stroke-width="1.5" stroke-linecap="round"/><circle cx="40" cy="40" r="2" fill="#90A4AE"/>'),
        mode: 'svg',
      },
      {
        id: 'dec-dot-separator', name: 'Dot Separator', preview: '#ECEFF1',
        svg: svgIcon('<circle cx="16" cy="40" r="2.5" fill="#78909C"/><circle cx="28" cy="40" r="2.5" fill="#78909C"/><circle cx="40" cy="40" r="2.5" fill="#78909C"/><circle cx="52" cy="40" r="2.5" fill="#78909C"/><circle cx="64" cy="40" r="2.5" fill="#78909C"/>'),
        mode: 'svg',
      },
      {
        id: 'dec-bracket', name: 'Bracket Ornament', preview: '#F3E5F5',
        svg: svgIcon('<path d="M24 12 C16 12 12 18 12 26 L12 34 C12 38 8 40 8 40 C8 40 12 42 12 46 L12 54 C12 62 16 68 24 68" fill="none" stroke="#7B1FA2" stroke-width="2.5" stroke-linecap="round"/><path d="M56 12 C64 12 68 18 68 26 L68 34 C68 38 72 40 72 40 C72 40 68 42 68 46 L68 54 C68 62 64 68 56 68" fill="none" stroke="#7B1FA2" stroke-width="2.5" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'dec-arrow', name: 'Modern Arrow', preview: '#E0F2F1',
        svg: svgIcon('<line x1="12" y1="40" x2="62" y2="40" stroke="#00897B" stroke-width="2.5" stroke-linecap="round"/><polyline points="52,30 66,40 52,50" fill="none" stroke="#00897B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'dec-blob', name: 'Abstract Blob', preview: '#E3F2FD',
        svg: svgIcon('<path d="M48 12 C62 16 72 28 68 44 C64 60 52 70 36 68 C20 66 10 54 14 38 C18 22 34 8 48 12Z" fill="none" stroke="#4285F4" stroke-width="2.5"/>'),
        mode: 'svg',
      },
      {
        id: 'dec-gradient-circle', name: 'Gradient Circle', preview: '#E8EAF6',
        svg: svgIcon('<defs><linearGradient id="gc1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#667eea"/><stop offset="100%" stop-color="#764ba2"/></linearGradient></defs><circle cx="40" cy="40" r="28" fill="none" stroke="url(#gc1)" stroke-width="3"/>'),
        mode: 'svg',
      },
      {
        id: 'dec-minimal-leaf', name: 'Minimal Leaf', preview: '#E8F5E9',
        svg: svgIcon('<path d="M20 60 Q20 30 50 14 Q54 40 30 56 Z" fill="none" stroke="#34A853" stroke-width="2.5" stroke-linejoin="round"/><path d="M20 60 Q34 38 50 14" fill="none" stroke="#34A853" stroke-width="1.5"/>'),
        mode: 'svg',
      },
      {
        id: 'dec-diamond', name: 'Geometric Diamond', preview: '#FFF8E1',
        svg: svgIcon('<polygon points="40,8 68,40 40,72 12,40" fill="none" stroke="#D4AF37" stroke-width="2.5" stroke-linejoin="round"/><polygon points="40,20 58,40 40,60 22,40" fill="none" stroke="#D4AF37" stroke-width="1.5" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'dec-corner', name: 'Corner Decoration', preview: '#EFEBE9',
        svg: svgIcon('<path d="M8 8 L8 32" fill="none" stroke="#8D6E63" stroke-width="2.5" stroke-linecap="round"/><path d="M8 8 L32 8" fill="none" stroke="#8D6E63" stroke-width="2.5" stroke-linecap="round"/><path d="M72 72 L72 48" fill="none" stroke="#8D6E63" stroke-width="2.5" stroke-linecap="round"/><path d="M72 72 L48 72" fill="none" stroke="#8D6E63" stroke-width="2.5" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'dec-wavy', name: 'Wavy Line', preview: '#E0F7FA',
        svg: svgIcon('<path d="M6 40 C14 28 22 28 30 40 C38 52 46 52 54 40 C62 28 70 28 78 40" fill="none" stroke="#00ACC1" stroke-width="2.5" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'dec-dots-pattern', name: 'Dot Pattern', preview: '#F3E5F5',
        svg: svgIcon('<g fill="#9575CD"><circle cx="16" cy="16" r="2.5"/><circle cx="32" cy="16" r="2.5"/><circle cx="48" cy="16" r="2.5"/><circle cx="64" cy="16" r="2.5"/><circle cx="16" cy="32" r="2.5"/><circle cx="32" cy="32" r="2.5"/><circle cx="48" cy="32" r="2.5"/><circle cx="64" cy="32" r="2.5"/><circle cx="16" cy="48" r="2.5"/><circle cx="32" cy="48" r="2.5"/><circle cx="48" cy="48" r="2.5"/><circle cx="64" cy="48" r="2.5"/><circle cx="16" cy="64" r="2.5"/><circle cx="32" cy="64" r="2.5"/><circle cx="48" cy="64" r="2.5"/><circle cx="64" cy="64" r="2.5"/></g>'),
        mode: 'svg',
      },
      {
        id: 'dec-sparkle-burst', name: 'Sparkle Burst', preview: '#FFF8E1',
        svg: svgIcon('<path d="M40 12 L42 34 L64 28 L46 40 L64 52 L42 46 L40 68 L38 46 L16 52 L34 40 L16 28 L38 34 Z" fill="none" stroke="#FBBC04" stroke-width="2" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
    ],
  },
  {
    id: 'frames',
    title: 'Borders & Frames',
    items: [
      {
        id: 'frm-thin-rounded', name: 'Thin Rounded', preview: '#ECEFF1',
        svg: svgIcon('<rect x="6" y="6" width="68" height="68" rx="12" fill="none" stroke="#546E7A" stroke-width="2"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-pill', name: 'Pill / Capsule', preview: '#E3F2FD',
        svg: svgIcon('<rect x="4" y="20" width="72" height="40" rx="20" fill="none" stroke="#4285F4" stroke-width="2.5"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-circle', name: 'Circle Frame', preview: '#F3E5F5',
        svg: svgIcon('<circle cx="40" cy="40" r="32" fill="none" stroke="#7B1FA2" stroke-width="2.5"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-badge', name: 'Badge Outline', preview: '#FFF8E1',
        svg: svgIcon('<polygon points="40,6 58,14 70,30 70,50 58,66 40,74 22,66 10,50 10,30 22,14" fill="none" stroke="#D4AF37" stroke-width="2.5" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-ticket', name: 'Ticket Shape', preview: '#FFFDE7',
        svg: svgIcon('<path d="M10 14 H70 V30 C64 30 60 34 60 40 C60 46 64 50 70 50 V66 H10 V50 C16 50 20 46 20 40 C20 34 16 30 10 30 Z" fill="none" stroke="#F57F17" stroke-width="2" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-bracket', name: 'Bracket Frame', preview: '#E8EAF6',
        svg: svgIcon('<path d="M18 8 L8 8 L8 72 L18 72" fill="none" stroke="#5C6BC0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M62 8 L72 8 L72 72 L62 72" fill="none" stroke="#5C6BC0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-double', name: 'Double Line', preview: '#E0F2F1',
        svg: svgIcon('<rect x="6" y="6" width="68" height="68" rx="4" fill="none" stroke="#00897B" stroke-width="2"/><rect x="12" y="12" width="56" height="56" rx="2" fill="none" stroke="#00897B" stroke-width="1"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-corner-accent', name: 'Corner Accent', preview: '#FFF3E0',
        svg: svgIcon('<path d="M8 24 L8 8 L24 8" fill="none" stroke="#FB8C00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M56 8 L72 8 L72 24" fill="none" stroke="#FB8C00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M72 56 L72 72 L56 72" fill="none" stroke="#FB8C00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 72 L8 72 L8 56" fill="none" stroke="#FB8C00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-dashed', name: 'Dashed Frame', preview: '#FCE4EC',
        svg: svgIcon('<rect x="6" y="6" width="68" height="68" rx="8" fill="none" stroke="#E91E63" stroke-width="2" stroke-dasharray="8,4"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-gold', name: 'Gold Frame', preview: '#FFF8E1',
        svg: svgIcon('<rect x="6" y="6" width="68" height="68" rx="2" fill="none" stroke="#D4AF37" stroke-width="3"/><rect x="11" y="11" width="58" height="58" rx="1" fill="none" stroke="#D4AF37" stroke-width="1"/>'),
        mode: 'svg',
      },
    ],
  },
  {
    id: 'patterns',
    title: 'Patterns & Textures',
    items: [
      {
        id: 'pat-dots', name: 'Polka Dots',
        preview: 'radial-gradient(circle, #E53935 2px, #FFF 2px)',
        color: '#FFFFFF', mode: 'shape', patternSize: 20,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, s, s)
          ctx.fillStyle = '#E53935'
          ctx.beginPath()
          ctx.arc(s / 2, s / 2, s * 0.15, 0, Math.PI * 2)
          ctx.fill()
        },
      },
      {
        id: 'pat-stripes', name: 'Stripes',
        preview: 'repeating-linear-gradient(45deg, #4F46E5, #4F46E5 5px, #6366F1 5px, #6366F1 10px)',
        color: '#4F46E5', mode: 'shape', patternSize: 20,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#6366F1'
          ctx.fillRect(0, 0, s, s)
          ctx.fillStyle = '#4F46E5'
          ctx.save()
          ctx.translate(s / 2, s / 2)
          ctx.rotate(Math.PI / 4)
          const w = s * 2
          for (let i = -w; i < w; i += 10) {
            ctx.fillRect(i, -w, 5, w * 2)
          }
          ctx.restore()
        },
      },
      {
        id: 'pat-checker', name: 'Checkerboard',
        preview: 'repeating-conic-gradient(#333 0% 25%, #fff 0% 50%) 50% / 20px 20px',
        color: '#333333', mode: 'shape', patternSize: 20,
        patternDraw: (ctx, s) => {
          const half = s / 2
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, s, s)
          ctx.fillStyle = '#333333'
          ctx.fillRect(0, 0, half, half)
          ctx.fillRect(half, half, half, half)
        },
      },
      {
        id: 'pat-wood', name: 'Wood Grain',
        preview: 'linear-gradient(135deg, #DEB887 0%, #D2A679 30%, #C4956A 60%, #B8845B 100%)',
        color: '#DEB887', mode: 'shape', patternSize: 40,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#DEB887'
          ctx.fillRect(0, 0, s, s)
          ctx.strokeStyle = '#C4956A'
          ctx.lineWidth = 1.5
          for (let y = 3; y < s; y += 6) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.bezierCurveTo(s * 0.3, y + 2, s * 0.7, y - 2, s, y + 1)
            ctx.stroke()
          }
          ctx.strokeStyle = '#B8845B'
          ctx.lineWidth = 0.8
          for (let y = 6; y < s; y += 12) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.bezierCurveTo(s * 0.4, y - 3, s * 0.6, y + 3, s, y)
            ctx.stroke()
          }
        },
      },
      {
        id: 'pat-marble', name: 'Marble',
        preview: 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 30%, #D9D9D9 60%, #F0F0F0 100%)',
        color: '#F0F0F0', mode: 'shape', patternSize: 60,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#F5F5F5'
          ctx.fillRect(0, 0, s, s)
          ctx.strokeStyle = '#D0D0D0'
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.moveTo(0, s * 0.3)
          ctx.bezierCurveTo(s * 0.2, s * 0.1, s * 0.5, s * 0.5, s, s * 0.4)
          ctx.stroke()
          ctx.strokeStyle = '#C8C8C8'
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.moveTo(s * 0.1, s)
          ctx.bezierCurveTo(s * 0.3, s * 0.6, s * 0.7, s * 0.8, s * 0.9, s * 0.2)
          ctx.stroke()
          ctx.strokeStyle = '#DCDCDC'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(0, s * 0.7)
          ctx.bezierCurveTo(s * 0.4, s * 0.65, s * 0.6, s * 0.9, s, s * 0.75)
          ctx.stroke()
        },
      },
      {
        id: 'pat-carbon', name: 'Carbon Fiber',
        preview: 'linear-gradient(45deg, #2C2C2C 25%, #3A3A3A 25%, #3A3A3A 50%, #2C2C2C 50%, #2C2C2C 75%, #3A3A3A 75%)',
        color: '#2C2C2C', mode: 'shape', patternSize: 8,
        patternDraw: (ctx, s) => {
          const half = s / 2
          ctx.fillStyle = '#2C2C2C'
          ctx.fillRect(0, 0, s, s)
          ctx.fillStyle = '#3A3A3A'
          ctx.fillRect(half, 0, half, half)
          ctx.fillRect(0, half, half, half)
          ctx.fillStyle = 'rgba(255,255,255,0.04)'
          ctx.fillRect(half, 0, half, half)
        },
      },
      {
        id: 'pat-hstripes', name: 'Horizontal Lines',
        preview: 'repeating-linear-gradient(0deg, #2196F3 0px, #2196F3 2px, #E3F2FD 2px, #E3F2FD 10px)',
        color: '#E3F2FD', mode: 'shape', patternSize: 12,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#E3F2FD'
          ctx.fillRect(0, 0, s, s)
          ctx.fillStyle = '#2196F3'
          ctx.fillRect(0, 0, s, 3)
        },
      },
      {
        id: 'pat-grid', name: 'Grid',
        preview: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
        color: '#FFFFFF', mode: 'shape', patternSize: 20,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, s, s)
          ctx.strokeStyle = '#CCCCCC'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(0, 0); ctx.lineTo(s, 0)
          ctx.moveTo(0, 0); ctx.lineTo(0, s)
          ctx.stroke()
        },
      },
      {
        id: 'pat-zigzag', name: 'Zigzag',
        preview: 'linear-gradient(135deg, #FF9800 25%, transparent 25%) -10px 0, linear-gradient(225deg, #FF9800 25%, transparent 25%) -10px 0, linear-gradient(315deg, #FF9800 25%, transparent 25%), linear-gradient(45deg, #FF9800 25%, transparent 25%)',
        color: '#FFF3E0', mode: 'shape', patternSize: 24,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#FFF3E0'
          ctx.fillRect(0, 0, s, s)
          ctx.strokeStyle = '#FF9800'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(0, s * 0.5)
          ctx.lineTo(s * 0.25, s * 0.2)
          ctx.lineTo(s * 0.5, s * 0.5)
          ctx.lineTo(s * 0.75, s * 0.2)
          ctx.lineTo(s, s * 0.5)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(0, s)
          ctx.lineTo(s * 0.25, s * 0.7)
          ctx.lineTo(s * 0.5, s)
          ctx.lineTo(s * 0.75, s * 0.7)
          ctx.lineTo(s, s)
          ctx.stroke()
        },
      },
      {
        id: 'pat-diamonds', name: 'Diamond Grid',
        preview: 'linear-gradient(45deg, #9C27B0 25%, transparent 25%, transparent 75%, #9C27B0 75%), linear-gradient(45deg, #9C27B0 25%, transparent 25%, transparent 75%, #9C27B0 75%)',
        color: '#F3E5F5', mode: 'shape', patternSize: 20,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#F3E5F5'
          ctx.fillRect(0, 0, s, s)
          ctx.fillStyle = '#CE93D8'
          const h = s / 2
          ctx.beginPath()
          ctx.moveTo(h, 0); ctx.lineTo(s, h); ctx.lineTo(h, s); ctx.lineTo(0, h)
          ctx.closePath()
          ctx.fill()
          ctx.fillStyle = '#F3E5F5'
          ctx.beginPath()
          ctx.moveTo(h, 3); ctx.lineTo(s - 3, h); ctx.lineTo(h, s - 3); ctx.lineTo(3, h)
          ctx.closePath()
          ctx.fill()
        },
      },
      {
        id: 'pat-herringbone', name: 'Herringbone',
        preview: 'linear-gradient(45deg, #795548 12.5%, transparent 12.5%, transparent 37.5%, #795548 37.5%, #795548 62.5%, transparent 62.5%, transparent 87.5%, #795548 87.5%)',
        color: '#D7CCC8', mode: 'shape', patternSize: 20,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#D7CCC8'
          ctx.fillRect(0, 0, s, s)
          ctx.strokeStyle = '#8D6E63'
          ctx.lineWidth = 2
          const h = s / 2
          ctx.beginPath()
          ctx.moveTo(0, h); ctx.lineTo(h, 0)
          ctx.moveTo(h, 0); ctx.lineTo(s, h)
          ctx.moveTo(0, s); ctx.lineTo(h, h)
          ctx.moveTo(h, h); ctx.lineTo(s, s)
          ctx.stroke()
        },
      },
      {
        id: 'pat-dots-gold', name: 'Gold Dots',
        preview: 'radial-gradient(circle, #D4AF37 2px, #1a1a1a 2px)',
        color: '#1a1a1a', mode: 'shape', patternSize: 16,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#1a1a1a'
          ctx.fillRect(0, 0, s, s)
          ctx.fillStyle = '#D4AF37'
          ctx.beginPath()
          ctx.arc(s / 2, s / 2, s * 0.15, 0, Math.PI * 2)
          ctx.fill()
        },
      },
    ],
  },
  {
    id: 'social',
    title: 'Social & Contact',
    items: [
      {
        id: 'soc-phone', name: 'Phone', preview: '#E8F5E9',
        svg: svgIcon('<path d="M24 14 C20 18 18 24 18 28 C18 36 22 46 30 54 C38 62 48 66 56 66 C60 66 66 64 70 60 L64 50 C60 52 56 52 54 50 L46 42 C44 40 44 36 46 34 L40 24 C38 22 34 22 32 24 L24 14Z" fill="none" stroke="#34A853" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-email', name: 'Email', preview: '#E3F2FD',
        svg: svgIcon('<rect x="8" y="18" width="64" height="44" rx="4" fill="none" stroke="#4285F4" stroke-width="2.5"/><path d="M8 22 L40 42 L72 22" fill="none" stroke="#4285F4" stroke-width="2.5" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-globe', name: 'Website', preview: '#E0F7FA',
        svg: svgIcon('<circle cx="40" cy="40" r="28" fill="none" stroke="#00838F" stroke-width="2.5"/><ellipse cx="40" cy="40" rx="12" ry="28" fill="none" stroke="#00838F" stroke-width="2"/><line x1="12" y1="30" x2="68" y2="30" stroke="#00838F" stroke-width="1.5"/><line x1="12" y1="50" x2="68" y2="50" stroke="#00838F" stroke-width="1.5"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-location', name: 'Location Pin', preview: '#FFEBEE',
        svg: svgIcon('<path d="M40 70 C40 70 64 46 64 28 C64 14 54 6 40 6 C26 6 16 14 16 28 C16 46 40 70 40 70Z" fill="none" stroke="#EA4335" stroke-width="2.5" stroke-linejoin="round"/><circle cx="40" cy="28" r="10" fill="none" stroke="#EA4335" stroke-width="2.5"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-qr', name: 'QR Placeholder', preview: '#FAFAFA',
        svg: svgIcon('<rect x="8" y="8" width="64" height="64" rx="4" fill="none" stroke="#37474F" stroke-width="2"/><rect x="14" y="14" width="18" height="18" rx="2" fill="none" stroke="#37474F" stroke-width="2.5"/><rect x="18" y="18" width="10" height="10" rx="1" fill="#37474F"/><rect x="48" y="14" width="18" height="18" rx="2" fill="none" stroke="#37474F" stroke-width="2.5"/><rect x="52" y="18" width="10" height="10" rx="1" fill="#37474F"/><rect x="14" y="48" width="18" height="18" rx="2" fill="none" stroke="#37474F" stroke-width="2.5"/><rect x="18" y="52" width="10" height="10" rx="1" fill="#37474F"/><rect x="48" y="48" width="6" height="6" fill="#37474F"/><rect x="58" y="48" width="6" height="6" fill="#37474F"/><rect x="48" y="58" width="6" height="6" fill="#37474F"/><rect x="58" y="58" width="6" height="6" fill="#37474F"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-instagram', name: 'Instagram', preview: '#FCE4EC',
        svg: svgIcon('<rect x="10" y="10" width="60" height="60" rx="16" fill="none" stroke="#E1306C" stroke-width="2.5"/><circle cx="40" cy="40" r="14" fill="none" stroke="#E1306C" stroke-width="2.5"/><circle cx="58" cy="22" r="3.5" fill="#E1306C"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-facebook', name: 'Facebook', preview: '#E3F2FD',
        svg: svgIcon('<circle cx="40" cy="40" r="28" fill="none" stroke="#1877F2" stroke-width="2.5"/><path d="M44 28 L44 34 L50 34 L48 40 L44 40 L44 60 L36 60 L36 40 L30 40 L30 34 L36 34 L36 28 C36 22 40 18 46 18 L50 18 L50 24 L46 24 C44 24 44 26 44 28Z" fill="none" stroke="#1877F2" stroke-width="2" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-whatsapp', name: 'WhatsApp', preview: '#E8F5E9',
        svg: svgIcon('<path d="M40 8 C22 8 8 22 8 40 C8 46 10 52 14 56 L10 72 L26 68 C30 70 34 72 40 72 C58 72 72 58 72 40 C72 22 58 8 40 8Z" fill="none" stroke="#25D366" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 32 C30 30 32 28 34 28 L36 28 C38 28 38 30 38 32 L38 34 C38 36 36 36 36 36 C36 36 38 44 44 44 C44 44 44 42 46 42 L48 42 C50 42 52 42 52 44 L52 46 C52 48 50 50 48 50 C42 50 30 46 30 32Z" fill="none" stroke="#25D366" stroke-width="2" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-clock', name: 'Clock / Hours', preview: '#FFF3E0',
        svg: svgIcon('<circle cx="40" cy="40" r="28" fill="none" stroke="#FB8C00" stroke-width="2.5"/><line x1="40" y1="40" x2="40" y2="22" stroke="#FB8C00" stroke-width="2.5" stroke-linecap="round"/><line x1="40" y1="40" x2="54" y2="46" stroke="#FB8C00" stroke-width="2.5" stroke-linecap="round"/><circle cx="40" cy="40" r="2.5" fill="#FB8C00"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-wifi', name: 'Wi-Fi', preview: '#E8EAF6',
        svg: svgIcon('<circle cx="40" cy="60" r="3.5" fill="#5C6BC0"/><path d="M28 50 C32 44 36 42 40 42 C44 42 48 44 52 50" fill="none" stroke="#5C6BC0" stroke-width="2.5" stroke-linecap="round"/><path d="M18 40 C24 32 32 28 40 28 C48 28 56 32 62 40" fill="none" stroke="#5C6BC0" stroke-width="2.5" stroke-linecap="round"/><path d="M10 30 C18 20 28 14 40 14 C52 14 62 20 70 30" fill="none" stroke="#5C6BC0" stroke-width="2.5" stroke-linecap="round"/>'),
        mode: 'svg',
      },
    ],
  },
  {
    id: 'colors',
    title: 'Solid Colors',
    items: [
      { id: 'col-red', name: 'Red', preview: '#E53935', color: '#E53935', mode: 'bg' },
      { id: 'col-pink', name: 'Pink', preview: '#EC407A', color: '#EC407A', mode: 'bg' },
      { id: 'col-purple', name: 'Purple', preview: '#AB47BC', color: '#AB47BC', mode: 'bg' },
      { id: 'col-deep-purple', name: 'Deep Purple', preview: '#7E57C2', color: '#7E57C2', mode: 'bg' },
      { id: 'col-indigo', name: 'Indigo', preview: '#5C6BC0', color: '#5C6BC0', mode: 'bg' },
      { id: 'col-blue', name: 'Blue', preview: '#42A5F5', color: '#42A5F5', mode: 'bg' },
      { id: 'col-light-blue', name: 'Light Blue', preview: '#29B6F6', color: '#29B6F6', mode: 'bg' },
      { id: 'col-cyan', name: 'Cyan', preview: '#26C6DA', color: '#26C6DA', mode: 'bg' },
      { id: 'col-teal', name: 'Teal', preview: '#26A69A', color: '#26A69A', mode: 'bg' },
      { id: 'col-green', name: 'Green', preview: '#66BB6A', color: '#66BB6A', mode: 'bg' },
      { id: 'col-light-green', name: 'Light Green', preview: '#9CCC65', color: '#9CCC65', mode: 'bg' },
      { id: 'col-lime', name: 'Lime', preview: '#D4E157', color: '#D4E157', mode: 'bg' },
      { id: 'col-yellow', name: 'Yellow', preview: '#FFEE58', color: '#FFEE58', mode: 'bg' },
      { id: 'col-amber', name: 'Amber', preview: '#FFA726', color: '#FFA726', mode: 'bg' },
      { id: 'col-orange', name: 'Orange', preview: '#FF7043', color: '#FF7043', mode: 'bg' },
      { id: 'col-brown', name: 'Brown', preview: '#8D6E63', color: '#8D6E63', mode: 'bg' },
      { id: 'col-grey', name: 'Grey', preview: '#BDBDBD', color: '#BDBDBD', mode: 'bg' },
      { id: 'col-blue-grey', name: 'Blue Grey', preview: '#78909C', color: '#78909C', mode: 'bg' },
      { id: 'col-cream', name: 'Cream', preview: '#FFF8E1', color: '#FFF8E1', mode: 'bg' },
      { id: 'col-navy', name: 'Navy', preview: '#1A237E', color: '#1A237E', mode: 'bg' },
      { id: 'col-maroon', name: 'Maroon', preview: '#880E4F', color: '#880E4F', mode: 'bg' },
      { id: 'col-forest', name: 'Forest', preview: '#1B5E20', color: '#1B5E20', mode: 'bg' },
      { id: 'col-white', name: 'White', preview: '#FFFFFF', color: '#FFFFFF', mode: 'bg' },
      { id: 'col-black', name: 'Black', preview: '#212121', color: '#212121', mode: 'bg' },
    ],
  },
]

/* ───── Customize Popover ───── */

function CustomizePopover({
  item,
  onAdd,
  onClose,
}: {
  item: AssetItem
  onAdd: (svg: string) => void
  onClose: () => void
}) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const originalSvg = item.svg ?? ''
  const origColors = extractSvgColors(originalSvg)
  const origTexts = extractSvgTexts(originalSvg)

  const [colorMap, setColorMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    origColors.forEach((c) => (map[c] = c))
    return map
  })
  const [textMap, setTextMap] = useState<string[]>([...origTexts])
  const [activeColorIdx, setActiveColorIdx] = useState<number | null>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Build modified SVG
  const getModifiedSvg = useCallback(() => {
    let svg = originalSvg
    for (const [oldC, newC] of Object.entries(colorMap)) {
      if (oldC !== newC) svg = replaceSvgColor(svg, oldC, newC)
    }
    origTexts.forEach((origT, i) => {
      if (textMap[i] !== origT) svg = replaceSvgText(svg, i, textMap[i])
    })
    return svg
  }, [originalSvg, colorMap, textMap, origTexts])

  const previewSvg = getModifiedSvg()

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 right-0 top-0 z-50 bg-ed-bg border border-ed-border rounded-xl shadow-xl p-3 mx-1"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-ed-text">Customize: {item.name}</h4>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-ed-border/50 text-ed-text-dim">
          <X size={14} />
        </button>
      </div>

      {/* Live Preview */}
      <div
        className="w-full h-20 rounded-lg border border-ed-border flex items-center justify-center mb-3"
        style={{ background: '#f8f8f8' }}
      >
        <div
          className="w-16 h-16 flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />
      </div>

      {/* Color Editors */}
      {origColors.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-1.5">
            <Palette size={12} className="text-ed-text-dim" />
            <span className="text-[10px] font-semibold text-ed-text-dim uppercase">Colors</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {origColors.map((origC, idx) => (
              <button
                key={origC}
                onClick={() => setActiveColorIdx(activeColorIdx === idx ? null : idx)}
                className={`w-7 h-7 rounded-md border-2 transition-all ${
                  activeColorIdx === idx ? 'border-ed-accent scale-110' : 'border-ed-border'
                }`}
                style={{ backgroundColor: colorMap[origC] }}
                title={`Change color (${origC})`}
              />
            ))}
          </div>
          {activeColorIdx !== null && (
            <div className="p-2 bg-ed-bg-raised rounded-lg border border-ed-border">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="color"
                  value={colorMap[origColors[activeColorIdx]]}
                  onChange={(e) =>
                    setColorMap((m) => ({ ...m, [origColors[activeColorIdx!]]: e.target.value }))
                  }
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={colorMap[origColors[activeColorIdx]]}
                  onChange={(e) => {
                    const v = e.target.value
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                      setColorMap((m) => ({ ...m, [origColors[activeColorIdx!]]: v }))
                    }
                  }}
                  className="flex-1 text-[11px] px-2 py-1 editor-input font-mono"
                  placeholder="#000000"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {QUICK_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      setColorMap((m) => ({ ...m, [origColors[activeColorIdx!]]: c }))
                    }
                    className="w-5 h-5 rounded-sm border border-ed-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Editors */}
      {origTexts.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-1.5">
            <Type size={12} className="text-ed-text-dim" />
            <span className="text-[10px] font-semibold text-ed-text-dim uppercase">Text</span>
          </div>
          {origTexts.map((origT, idx) => (
            <input
              key={idx}
              type="text"
              value={textMap[idx]}
              onChange={(e) =>
                setTextMap((arr) => {
                  const next = [...arr]
                  next[idx] = e.target.value
                  return next
                })
              }
              className="w-full text-[11px] px-2 py-1.5 editor-input mb-1.5"
              placeholder={origT}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            onAdd(getModifiedSvg())
            onClose()
          }}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-ed-accent text-white text-[11px] font-medium hover:bg-ed-accent-hover transition-colors"
        >
          <Check size={12} />
          Add to Canvas
        </button>
        <button
          onClick={() => {
            setColorMap(() => {
              const map: Record<string, string> = {}
              origColors.forEach((c) => (map[c] = c))
              return map
            })
            setTextMap([...origTexts])
            setActiveColorIdx(null)
          }}
          className="px-3 py-1.5 rounded-lg border border-ed-border text-[11px] text-ed-text-dim hover:bg-ed-border/30 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

/* ───── Component ───── */
export default function MaterialsPanel() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [customizing, setCustomizing] = useState<AssetItem | null>(null)
  const [showOnlineLibrary, setShowOnlineLibrary] = useState(false)
  const canvas = useEditorStore((s) => s.canvas)

  const handleAddSvg = useCallback(
    async (svg: string) => {
      if (!canvas) return
      await addSVGToCanvas(canvas, svg)
    },
    [canvas]
  )

  const handleUse = useCallback(
    async (item: AssetItem) => {
      if (!canvas) return

      // SVG items with colors or text → open customization popover
      if (item.mode === 'svg' && item.svg) {
        const hasColors = extractSvgColors(item.svg).length > 0
        const hasText = extractSvgTexts(item.svg).length > 0
        if (hasColors || hasText) {
          setCustomizing(item)
          return
        }
        await addSVGToCanvas(canvas, item.svg)
      } else if (item.mode === 'bg') {
        if (item.patternDraw) {
          const pattern = createPatternFromDraw(item.patternDraw, item.patternSize ?? 20)
          setBackgroundPattern(canvas, pattern)
        } else if (item.gradientStops) {
          setBackgroundGradient(canvas, item.gradientStops, item.gradientAngle ?? 135)
        } else if (item.color) {
          setBackground(canvas, item.color)
        }
      } else if (item.mode === 'shape') {
        const center = getArtboardCenter()
        const fill = item.patternDraw
          ? createPatternFromDraw(item.patternDraw, item.patternSize ?? 20)
          : (item.color ?? '#cccccc')
        const rect = new Rect({
          left: center.x - 80,
          top: center.y - 60,
          width: 160,
          height: 120,
          fill,
          rx: 4,
          ry: 4,
        })
        canvas.add(rect)
        canvas.setActiveObject(rect)
        canvas.renderAll()
      }
    },
    [canvas]
  )

  const filteredCategories = CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) =>
      !search || item.name.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0)

  const COLLAPSED_COUNT = 5

  // Show Strapi materials browser (after all hooks)
  if (showOnlineLibrary) {
    return <StrapiMaterialsBrowser onClose={() => setShowOnlineLibrary(false)} />
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="px-3 pt-3 pb-2">
        <h2 className="text-sm font-semibold text-ed-text mb-2">Elements</h2>

        {/* Online Library Button */}
        <button
          onClick={() => setShowOnlineLibrary(true)}
          className="w-full mb-2.5 flex items-center gap-2 px-3 py-2 rounded-lg border border-ed-accent/20 bg-ed-accent/5 hover:bg-ed-accent/10 hover:border-ed-accent/40 transition-all"
        >
          <div className="w-6 h-6 rounded-md bg-ed-accent/15 flex items-center justify-center">
            <Download size={12} className="text-ed-accent" />
          </div>
          <div className="text-left flex-1">
            <p className="text-[11px] font-semibold text-ed-accent">Online Library</p>
            <p className="text-[9px] text-ed-text-dim">1200+ stickers & clipart</p>
          </div>
          <ChevronRight size={14} className="text-ed-accent/60" />
        </button>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ed-text-dim" />
          <input
            type="text"
            placeholder="Search elements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full !pl-8 pr-3 py-1.5 editor-input"
          />
        </div>
      </div>

      {/* Customization Popover */}
      {customizing && (
        <CustomizePopover
          item={customizing}
          onAdd={handleAddSvg}
          onClose={() => setCustomizing(null)}
        />
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-4 editor-scrollbar">
        {filteredCategories.map((cat) => {
          const isExpanded = expanded === cat.id || !!search
          const visibleItems = isExpanded ? cat.items : cat.items.slice(0, COLLAPSED_COUNT)
          const hasMore = cat.items.length > COLLAPSED_COUNT

          return (
            <div key={cat.id} className="mb-5">
              {/* Category header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-ed-text">{cat.title}</h3>
                {hasMore && !search && (
                  <button
                    onClick={() => setExpanded((p) => (p === cat.id ? null : cat.id))}
                    className="flex items-center gap-0.5 text-[10px] text-ed-accent font-medium hover:text-ed-accent-hover transition-colors"
                  >
                    {isExpanded ? 'Show Less' : 'See More'}
                    <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                )}
              </div>

              {/* Grid */}
              <div className={`grid ${cat.id === 'colors' ? 'grid-cols-6 gap-1.5' : 'grid-cols-5 gap-2'}`}>
                {visibleItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleUse(item)}
                    title={item.name}
                    className={`group relative rounded-lg overflow-hidden border border-ed-border hover:border-ed-accent/40 hover:shadow-sm transition-all ${
                      cat.id === 'colors' ? 'aspect-square' : 'aspect-square'
                    }`}
                  >
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: item.preview, backgroundSize: '10px 10px' }}
                    >
                      {item.svg && (
                        <div
                          className="w-[70%] h-[70%] flex items-center justify-center"
                          dangerouslySetInnerHTML={{ __html: item.svg }}
                        />
                      )}
                    </div>
                    {/* Hover overlay with name */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center">
                      <span className="text-[8px] text-white font-medium pb-0.5 opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
                        {item.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}

        {filteredCategories.length === 0 && (
          <p className="text-xs text-ed-text-dim text-center py-8">No elements found</p>
        )}
      </div>
    </div>
  )
}
