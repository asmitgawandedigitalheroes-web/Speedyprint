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
      { id: 'bg-black', name: 'Black', preview: '#111111', color: '#111111', mode: 'bg' },
      { id: 'bg-cream', name: 'Warm Cream', preview: '#FAF7F2', color: '#FAF7F2', mode: 'bg' },
      { id: 'bg-midnight', name: 'Midnight', preview: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#0f0c29' }, { offset: 0.5, color: '#302b63' }, { offset: 1, color: '#24243e' }] },
      { id: 'bg-aurora', name: 'Aurora', preview: 'linear-gradient(135deg, #6EE7F7 0%, #B06AB3 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#6EE7F7' }, { offset: 1, color: '#B06AB3' }] },
      { id: 'bg-sunset', name: 'Sunset', preview: 'linear-gradient(135deg, #FF6B6B 0%, #FFA647 50%, #FFD93D 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#FF6B6B' }, { offset: 0.5, color: '#FFA647' }, { offset: 1, color: '#FFD93D' }] },
      { id: 'bg-ocean', name: 'Ocean', preview: 'linear-gradient(135deg, #0575E6 0%, #021B79 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#0575E6' }, { offset: 1, color: '#021B79' }] },
      { id: 'bg-sage', name: 'Sage', preview: 'linear-gradient(135deg, #B7D7C2 0%, #7EB69C 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#B7D7C2' }, { offset: 1, color: '#7EB69C' }] },
      { id: 'bg-peach', name: 'Peach Fuzz', preview: 'linear-gradient(135deg, #FFCBA4 0%, #FFA07A 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#FFCBA4' }, { offset: 1, color: '#FFA07A' }] },
      { id: 'bg-lavender', name: 'Lavender', preview: 'linear-gradient(135deg, #E8D5F5 0%, #C8A8E9 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#E8D5F5' }, { offset: 1, color: '#C8A8E9' }] },
      { id: 'bg-neon-green', name: 'Neon Green', preview: 'linear-gradient(135deg, #39FF14 0%, #00C896 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#39FF14' }, { offset: 1, color: '#00C896' }] },
      { id: 'bg-cyberpunk', name: 'Cyberpunk', preview: 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 50%, #FF00FF 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#FF00FF' }, { offset: 0.5, color: '#00FFFF' }, { offset: 1, color: '#FF00FF' }] },
      { id: 'bg-rose-gold', name: 'Rose Gold', preview: 'linear-gradient(135deg, #F8CDDA 0%, #1D2B64 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#F8CDDA' }, { offset: 1, color: '#1D2B64' }] },
      { id: 'bg-matcha', name: 'Matcha', preview: 'linear-gradient(135deg, #D4E9C4 0%, #8BB87A 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#D4E9C4' }, { offset: 1, color: '#8BB87A' }] },
      { id: 'bg-cobalt', name: 'Cobalt Blue', preview: 'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#4776E6' }, { offset: 1, color: '#8E54E9' }] },
      { id: 'bg-blossom', name: 'Blossom', preview: 'linear-gradient(135deg, #FFC0CB 0%, #FFB6C1 50%, #FF69B4 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#FFC0CB' }, { offset: 0.5, color: '#FFB6C1' }, { offset: 1, color: '#FF69B4' }] },
      { id: 'bg-slate', name: 'Slate Night', preview: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#1e293b' }, { offset: 1, color: '#334155' }] },
      { id: 'bg-bronze', name: 'Bronze', preview: 'linear-gradient(135deg, #CB8E00 0%, #E8C96E 50%, #CB8E00 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#CB8E00' }, { offset: 0.5, color: '#E8C96E' }, { offset: 1, color: '#CB8E00' }] },
      { id: 'bg-candy', name: 'Candy', preview: 'linear-gradient(135deg, #FC5C7D 0%, #6A82FB 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#FC5C7D' }, { offset: 1, color: '#6A82FB' }] },
      { id: 'bg-forest', name: 'Forest', preview: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#0f2027' }, { offset: 0.5, color: '#203a43' }, { offset: 1, color: '#2c5364' }] },
      { id: 'bg-cotton', name: 'Cotton Candy', preview: 'linear-gradient(135deg, #FFD6E7 0%, #C8E6FF 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#FFD6E7' }, { offset: 1, color: '#C8E6FF' }] },
      { id: 'bg-emerald', name: 'Emerald', preview: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#2ecc71' }, { offset: 1, color: '#27ae60' }] },
      { id: 'bg-glass', name: 'Ice Glass', preview: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(200,230,255,0.8) 100%)', mode: 'bg', gradientStops: [{ offset: 0, color: '#EEF6FF' }, { offset: 1, color: '#C8E6FF' }] },
    ],
  },
  {
    id: 'shapes',
    title: 'Shapes',
    items: [
      {
        id: 'shp-blob1', name: 'Blob', preview: '#EDE9FE',
        svg: svgIcon('<path d="M54 14 C68 20 74 36 70 52 C66 68 50 76 34 72 C18 68 8 54 12 38 C16 22 34 6 54 14Z" fill="#8B5CF6"/>'),
        mode: 'svg',
      },
      {
        id: 'shp-blob2', name: 'Soft Blob', preview: '#FEE2E2',
        svg: svgIcon('<path d="M44 10 C62 12 74 28 72 46 C70 60 56 72 40 72 C24 72 12 60 12 44 C12 26 26 8 44 10Z" fill="#F87171"/>'),
        mode: 'svg',
      },
      {
        id: 'shp-hexagon', name: 'Hexagon', preview: '#DBEAFE',
        svg: svgIcon('<polygon points="40,8 66,24 66,56 40,72 14,56 14,24" fill="#3B82F6"/>'),
        mode: 'svg',
      },
      {
        id: 'shp-pill', name: 'Pill', preview: '#D1FAE5',
        svg: svgIcon('<rect x="8" y="22" width="64" height="36" rx="18" fill="#10B981"/>'),
        mode: 'svg',
      },
      {
        id: 'shp-star5', name: 'Star', preview: '#FEF3C7',
        svg: svgIcon('<polygon points="40,8 47,30 72,30 52,46 59,70 40,56 21,70 28,46 8,30 33,30" fill="#F59E0B"/>'),
        mode: 'svg',
      },
      {
        id: 'shp-diamond', name: 'Diamond', preview: '#F3E8FF',
        svg: svgIcon('<polygon points="40,6 70,40 40,74 10,40" fill="#A855F7"/>'),
        mode: 'svg',
      },
      {
        id: 'shp-heart', name: 'Heart', preview: '#FFE4E6',
        svg: svgIcon('<path d="M40 68 C40 68 10 50 10 28 C10 16 20 8 30 8 C36 8 40 12 40 12 C40 12 44 8 50 8 C60 8 70 16 70 28 C70 50 40 68 40 68Z" fill="#F43F5E"/>'),
        mode: 'svg',
      },
      {
        id: 'shp-cloud', name: 'Cloud', preview: '#E0F2FE',
        svg: svgIcon('<path d="M62 52 C68 52 74 46 74 40 C74 34 68 28 62 28 C62 22 56 16 48 16 C42 16 38 20 36 24 C34 22 30 20 26 20 C18 20 12 26 12 34 C12 42 18 48 26 48 L62 52Z" fill="#0EA5E9"/>'),
        mode: 'svg',
      },
      {
        id: 'shp-speech', name: 'Speech Bubble', preview: '#F0FDF4',
        svg: svgIcon('<path d="M12 12 H68 C70 12 72 14 72 16 V52 C72 54 70 56 68 56 H46 L32 72 V56 H12 C10 56 8 54 8 52 V16 C8 14 10 12 12 12Z" fill="#22C55E"/>'),
        mode: 'svg',
      },
      {
        id: 'shp-rounded-rect', name: 'Rounded Box', preview: '#FFF7ED',
        svg: svgIcon('<rect x="8" y="14" width="64" height="52" rx="16" fill="#F97316"/>'),
        mode: 'svg',
      },
      {
        id: 'shp-lightning', name: 'Lightning', preview: '#FEFCE8',
        svg: svgIcon('<polygon points="46,8 20,46 38,46 34,72 60,34 42,34" fill="#EAB308"/>'),
        mode: 'svg',
      },
      {
        id: 'shp-cross', name: 'Plus / Cross', preview: '#F1F5F9',
        svg: svgIcon('<rect x="30" y="8" width="20" height="64" rx="6" fill="#64748B"/><rect x="8" y="30" width="64" height="20" rx="6" fill="#64748B"/>'),
        mode: 'svg',
      },
      {
        id: 'shp-moon', name: 'Crescent Moon', preview: '#1E1B4B',
        svg: svgIcon('<path d="M44 12 C28 12 14 26 14 44 C14 62 28 74 44 74 C52 74 52 74 52 74 C38 66 30 56 30 44 C30 32 38 22 52 16 C52 16 52 12 44 12Z" fill="#6366F1"/>'),
        mode: 'svg',
      },
      {
        id: 'shp-shield', name: 'Shield', preview: '#ECFDF5',
        svg: svgIcon('<path d="M40 8 L66 20 V44 C66 58 40 72 40 72 C40 72 14 58 14 44 V20 Z" fill="#059669"/>'),
        mode: 'svg',
      },
      {
        id: 'shp-donut', name: 'Ring / Donut', preview: '#FDF4FF',
        svg: svgIcon('<circle cx="40" cy="40" r="28" fill="#D946EF"/><circle cx="40" cy="40" r="14" fill="white"/>'),
        mode: 'svg',
      },
    ],
  },
  {
    id: 'lines',
    title: 'Lines & Dividers',
    items: [
      {
        id: 'ln-simple', name: 'Thin Line', preview: '#F1F5F9',
        svg: svgIcon('<line x1="8" y1="40" x2="72" y2="40" stroke="#475569" stroke-width="2" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'ln-thick', name: 'Thick Line', preview: '#F1F5F9',
        svg: svgIcon('<line x1="8" y1="40" x2="72" y2="40" stroke="#1e293b" stroke-width="6" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'ln-dashed', name: 'Dashed', preview: '#F1F5F9',
        svg: svgIcon('<line x1="8" y1="40" x2="72" y2="40" stroke="#94A3B8" stroke-width="2.5" stroke-dasharray="8,5" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'ln-dotted', name: 'Dotted', preview: '#F1F5F9',
        svg: svgIcon('<line x1="8" y1="40" x2="72" y2="40" stroke="#94A3B8" stroke-width="2.5" stroke-dasharray="2,6" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'ln-wavy', name: 'Wavy', preview: '#EFF6FF',
        svg: svgIcon('<path d="M6 40 C14 28 22 28 30 40 C38 52 46 52 54 40 C62 28 70 28 78 40" fill="none" stroke="#3B82F6" stroke-width="3" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'ln-zigzag', name: 'Zigzag', preview: '#FFF7ED',
        svg: svgIcon('<polyline points="6,50 20,26 34,50 48,26 62,50 76,26" fill="none" stroke="#F97316" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'ln-double', name: 'Double Line', preview: '#F0FDF4',
        svg: svgIcon('<line x1="8" y1="34" x2="72" y2="34" stroke="#22C55E" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="46" x2="72" y2="46" stroke="#22C55E" stroke-width="2" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'ln-dot-line', name: 'Dot + Line', preview: '#F5F3FF',
        svg: svgIcon('<line x1="8" y1="40" x2="35" y2="40" stroke="#7C3AED" stroke-width="2" stroke-linecap="round"/><circle cx="40" cy="40" r="4" fill="#7C3AED"/><line x1="45" y1="40" x2="72" y2="40" stroke="#7C3AED" stroke-width="2" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'ln-arrow', name: 'Arrow Right', preview: '#ECFDF5',
        svg: svgIcon('<line x1="10" y1="40" x2="60" y2="40" stroke="#10B981" stroke-width="3" stroke-linecap="round"/><polyline points="50,28 66,40 50,52" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'ln-arrow-double', name: 'Double Arrow', preview: '#FFF1F2',
        svg: svgIcon('<line x1="14" y1="40" x2="66" y2="40" stroke="#F43F5E" stroke-width="3" stroke-linecap="round"/><polyline points="24,28 10,40 24,52" fill="none" stroke="#F43F5E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><polyline points="56,28 70,40 56,52" fill="none" stroke="#F43F5E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'ln-dots', name: 'Dot Separator', preview: '#FAFAF9',
        svg: svgIcon('<circle cx="16" cy="40" r="3" fill="#78716C"/><circle cx="28" cy="40" r="3" fill="#78716C"/><circle cx="40" cy="40" r="3" fill="#78716C"/><circle cx="52" cy="40" r="3" fill="#78716C"/><circle cx="64" cy="40" r="3" fill="#78716C"/>'),
        mode: 'svg',
      },
      {
        id: 'ln-scribble', name: 'Scribble', preview: '#FFFBEB',
        svg: svgIcon('<path d="M8 36 C14 28 20 52 28 40 C36 28 42 52 50 40 C58 28 64 52 72 44" fill="none" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>'),
        mode: 'svg',
      },
    ],
  },
  {
    id: 'labels',
    title: 'Badges & Labels',
    items: [
      {
        id: 'lbl-new', name: 'NEW', preview: '#DCFCE7',
        svg: svgIcon('<rect x="8" y="26" width="64" height="28" rx="14" fill="#16A34A"/><text x="40" y="46" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">NEW</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-sale', name: 'SALE', preview: '#FEE2E2',
        svg: svgIcon('<rect x="6" y="20" width="68" height="40" rx="8" fill="#DC2626"/><text x="40" y="46" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="sans-serif">SALE</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-hot', name: 'HOT', preview: '#FFF7ED',
        svg: svgIcon('<rect x="8" y="24" width="64" height="32" rx="16" fill="#EA580C"/><text x="40" y="45" text-anchor="middle" fill="white" font-size="15" font-weight="bold" font-family="sans-serif">HOT 🔥</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-percent', name: '% Off Badge', preview: '#EDE9FE',
        svg: svgIcon('<circle cx="40" cy="40" r="32" fill="#7C3AED"/><text x="40" y="36" text-anchor="middle" fill="white" font-size="20" font-weight="bold" font-family="sans-serif">50%</text><text x="40" y="54" text-anchor="middle" fill="#DDD6FE" font-size="10" font-weight="bold" font-family="sans-serif">OFF</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-premium', name: 'PREMIUM', preview: '#1C1917',
        svg: svgIcon('<rect x="6" y="20" width="68" height="40" rx="6" fill="#1C1917"/><rect x="9" y="23" width="62" height="34" rx="3" fill="none" stroke="#D97706" stroke-width="1.5"/><text x="40" y="44" text-anchor="middle" fill="#FCD34D" font-size="11" font-weight="bold" font-family="sans-serif">PREMIUM</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-trending', name: 'TRENDING', preview: '#FFF1F2',
        svg: svgIcon('<rect x="4" y="22" width="72" height="36" rx="18" fill="#BE123C"/><text x="40" y="45" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="sans-serif">TRENDING ↑</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-limited', name: 'LIMITED', preview: '#F9FAFB',
        svg: svgIcon('<rect x="8" y="18" width="64" height="44" rx="6" fill="none" stroke="#111827" stroke-width="3"/><rect x="14" y="24" width="52" height="32" rx="2" fill="none" stroke="#111827" stroke-width="1.5"/><text x="40" y="45" text-anchor="middle" fill="#111827" font-size="11" font-weight="bold" font-family="sans-serif">LIMITED</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-free', name: 'FREE', preview: '#F0FDF4',
        svg: svgIcon('<rect x="4" y="22" width="72" height="36" rx="18" fill="#15803D"/><text x="40" y="45" text-anchor="middle" fill="white" font-size="15" font-weight="bold" font-family="sans-serif">FREE</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-verified', name: 'Verified', preview: '#EFF6FF',
        svg: svgIcon('<path d="M40 6 L48 16 L60 12 L58 24 L70 30 L62 40 L70 50 L58 56 L60 68 L48 64 L40 74 L32 64 L20 68 L22 56 L10 50 L18 40 L10 30 L22 24 L20 12 L32 16 Z" fill="#2563EB"/><polyline points="28,40 36,48 54,30" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'lbl-bestseller', name: 'Best Seller', preview: '#FFFBEB',
        svg: svgIcon('<polygon points="40,4 50,26 74,26 56,42 62,66 40,52 18,66 24,42 6,26 30,26" fill="#F59E0B"/><text x="40" y="78" text-anchor="middle" fill="#78350F" font-size="8" font-weight="bold" font-family="sans-serif">BEST SELLER</text>'),
        mode: 'svg',
      },
      {
        id: 'lbl-price-tag', name: 'Price Tag', preview: '#FAFAF9',
        svg: svgIcon('<path d="M8 40 L34 14 H72 V66 H34 Z" fill="none" stroke="#292524" stroke-width="2.5" stroke-linejoin="round"/><circle cx="54" cy="30" r="4.5" fill="none" stroke="#292524" stroke-width="2"/>'),
        mode: 'svg',
      },
      {
        id: 'lbl-eco', name: 'Eco / Organic', preview: '#F0FDF4',
        svg: svgIcon('<circle cx="40" cy="40" r="30" fill="#166534"/><path d="M28 52 C28 34 40 22 54 20 C54 20 52 36 40 44 C36 46 30 50 28 52Z" fill="#4ADE80"/><text x="40" y="66" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="sans-serif">ECO</text>'),
        mode: 'svg',
      },
    ],
  },
  {
    id: 'frames',
    title: 'Frames & Borders',
    items: [
      {
        id: 'frm-minimal', name: 'Minimal', preview: '#F8FAFC',
        svg: svgIcon('<rect x="6" y="6" width="68" height="68" rx="14" fill="none" stroke="#CBD5E1" stroke-width="2"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-bold', name: 'Bold', preview: '#F8FAFC',
        svg: svgIcon('<rect x="6" y="6" width="68" height="68" rx="10" fill="none" stroke="#0F172A" stroke-width="4"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-circle', name: 'Circle', preview: '#F5F3FF',
        svg: svgIcon('<circle cx="40" cy="40" r="32" fill="none" stroke="#7C3AED" stroke-width="2.5"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-pill', name: 'Pill', preview: '#EFF6FF',
        svg: svgIcon('<rect x="4" y="20" width="72" height="40" rx="20" fill="none" stroke="#2563EB" stroke-width="2.5"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-dashed', name: 'Dashed', preview: '#FFF1F2',
        svg: svgIcon('<rect x="6" y="6" width="68" height="68" rx="12" fill="none" stroke="#F43F5E" stroke-width="2.5" stroke-dasharray="8,4"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-double', name: 'Double', preview: '#F0FDF4',
        svg: svgIcon('<rect x="6" y="6" width="68" height="68" rx="6" fill="none" stroke="#16A34A" stroke-width="2"/><rect x="12" y="12" width="56" height="56" rx="3" fill="none" stroke="#16A34A" stroke-width="1"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-corner', name: 'Corner Marks', preview: '#FFFBEB',
        svg: svgIcon('<path d="M8 26 L8 8 L26 8" fill="none" stroke="#D97706" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M54 8 L72 8 L72 26" fill="none" stroke="#D97706" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M72 54 L72 72 L54 72" fill="none" stroke="#D97706" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 72 L8 72 L8 54" fill="none" stroke="#D97706" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-ticket', name: 'Ticket', preview: '#FEF9C3',
        svg: svgIcon('<path d="M10 14 H70 V30 C64 30 60 34 60 40 C60 46 64 50 70 50 V66 H10 V50 C16 50 20 46 20 40 C20 34 16 30 10 30 Z" fill="none" stroke="#CA8A04" stroke-width="2" stroke-linejoin="round"/><line x1="40" y1="14" x2="40" y2="66" stroke="#CA8A04" stroke-width="1" stroke-dasharray="4,3"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-badge-hex', name: 'Hex Badge', preview: '#F5F3FF',
        svg: svgIcon('<polygon points="40,6 60,17 60,63 40,74 20,63 20,17" fill="none" stroke="#6D28D9" stroke-width="2.5" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'frm-stitch', name: 'Stitch Border', preview: '#ECFDF5',
        svg: svgIcon('<rect x="6" y="6" width="68" height="68" rx="12" fill="none" stroke="#6EE7B7" stroke-width="3" stroke-dasharray="5,3"/>'),
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
        preview: 'radial-gradient(circle, #6366F1 2px, #EEF2FF 2px)',
        color: '#EEF2FF', mode: 'shape', patternSize: 20,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#EEF2FF'
          ctx.fillRect(0, 0, s, s)
          ctx.fillStyle = '#6366F1'
          ctx.beginPath()
          ctx.arc(s / 2, s / 2, s * 0.15, 0, Math.PI * 2)
          ctx.fill()
        },
      },
      {
        id: 'pat-stripes', name: 'Diagonal Stripes',
        preview: 'repeating-linear-gradient(45deg, #F43F5E, #F43F5E 4px, #FFF1F2 4px, #FFF1F2 12px)',
        color: '#FFF1F2', mode: 'shape', patternSize: 20,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#FFF1F2'
          ctx.fillRect(0, 0, s, s)
          ctx.fillStyle = '#F43F5E'
          ctx.save()
          ctx.translate(s / 2, s / 2)
          ctx.rotate(Math.PI / 4)
          const w = s * 2
          for (let i = -w; i < w; i += 12) {
            ctx.fillRect(i, -w, 4, w * 2)
          }
          ctx.restore()
        },
      },
      {
        id: 'pat-checker', name: 'Checkerboard',
        preview: 'repeating-conic-gradient(#0F172A 0% 25%, #F8FAFC 0% 50%) 50% / 20px 20px',
        color: '#F8FAFC', mode: 'shape', patternSize: 20,
        patternDraw: (ctx, s) => {
          const half = s / 2
          ctx.fillStyle = '#F8FAFC'
          ctx.fillRect(0, 0, s, s)
          ctx.fillStyle = '#0F172A'
          ctx.fillRect(0, 0, half, half)
          ctx.fillRect(half, half, half, half)
        },
      },
      {
        id: 'pat-grid', name: 'Grid',
        preview: 'linear-gradient(#E2E8F0 1px, transparent 1px), linear-gradient(90deg, #E2E8F0 1px, transparent 1px)',
        color: '#FFFFFF', mode: 'shape', patternSize: 20,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, s, s)
          ctx.strokeStyle = '#E2E8F0'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(0, 0); ctx.lineTo(s, 0)
          ctx.moveTo(0, 0); ctx.lineTo(0, s)
          ctx.stroke()
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
        },
      },
      {
        id: 'pat-carbon', name: 'Carbon',
        preview: 'linear-gradient(45deg, #1e293b 25%, #334155 25%, #334155 50%, #1e293b 50%, #1e293b 75%, #334155 75%)',
        color: '#1e293b', mode: 'shape', patternSize: 8,
        patternDraw: (ctx, s) => {
          const half = s / 2
          ctx.fillStyle = '#1e293b'
          ctx.fillRect(0, 0, s, s)
          ctx.fillStyle = '#334155'
          ctx.fillRect(half, 0, half, half)
          ctx.fillRect(0, half, half, half)
        },
      },
      {
        id: 'pat-hstripes', name: 'H-Lines',
        preview: 'repeating-linear-gradient(0deg, #6366F1 0px, #6366F1 2px, #EEF2FF 2px, #EEF2FF 12px)',
        color: '#EEF2FF', mode: 'shape', patternSize: 14,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#EEF2FF'
          ctx.fillRect(0, 0, s, s)
          ctx.fillStyle = '#6366F1'
          ctx.fillRect(0, 0, s, 2.5)
        },
      },
      {
        id: 'pat-zigzag', name: 'Zigzag',
        preview: 'linear-gradient(135deg, #F43F5E 25%, transparent 25%) -10px 0',
        color: '#FFF1F2', mode: 'shape', patternSize: 24,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#FFF1F2'
          ctx.fillRect(0, 0, s, s)
          ctx.strokeStyle = '#F43F5E'
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
        id: 'pat-diamonds', name: 'Diamonds',
        preview: 'linear-gradient(45deg, #7C3AED 25%, transparent 25%, transparent 75%, #7C3AED 75%)',
        color: '#F5F3FF', mode: 'shape', patternSize: 20,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#F5F3FF'
          ctx.fillRect(0, 0, s, s)
          ctx.fillStyle = '#C4B5FD'
          const h = s / 2
          ctx.beginPath()
          ctx.moveTo(h, 0); ctx.lineTo(s, h); ctx.lineTo(h, s); ctx.lineTo(0, h)
          ctx.closePath()
          ctx.fill()
          ctx.fillStyle = '#F5F3FF'
          ctx.beginPath()
          ctx.moveTo(h, 3); ctx.lineTo(s - 3, h); ctx.lineTo(h, s - 3); ctx.lineTo(3, h)
          ctx.closePath()
          ctx.fill()
        },
      },
      {
        id: 'pat-dots-dark', name: 'Dark Dots',
        preview: 'radial-gradient(circle, #E2E8F0 2px, #0F172A 2px)',
        color: '#0F172A', mode: 'shape', patternSize: 16,
        patternDraw: (ctx, s) => {
          ctx.fillStyle = '#0F172A'
          ctx.fillRect(0, 0, s, s)
          ctx.fillStyle = '#E2E8F0'
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
        id: 'soc-phone', name: 'Phone', preview: '#DCFCE7',
        svg: svgIcon('<rect x="24" y="8" width="32" height="64" rx="8" fill="none" stroke="#16A34A" stroke-width="2.5"/><circle cx="40" cy="62" r="3" fill="#16A34A"/><line x1="34" y1="16" x2="46" y2="16" stroke="#16A34A" stroke-width="2" stroke-linecap="round"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-email', name: 'Email', preview: '#EFF6FF',
        svg: svgIcon('<rect x="8" y="18" width="64" height="44" rx="8" fill="none" stroke="#2563EB" stroke-width="2.5"/><path d="M8 26 L40 46 L72 26" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linejoin="round"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-globe', name: 'Website', preview: '#F0FDFA',
        svg: svgIcon('<circle cx="40" cy="40" r="28" fill="none" stroke="#0D9488" stroke-width="2.5"/><ellipse cx="40" cy="40" rx="12" ry="28" fill="none" stroke="#0D9488" stroke-width="1.5"/><line x1="12" y1="32" x2="68" y2="32" stroke="#0D9488" stroke-width="1.5"/><line x1="12" y1="48" x2="68" y2="48" stroke="#0D9488" stroke-width="1.5"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-location', name: 'Location', preview: '#FFF1F2',
        svg: svgIcon('<path d="M40 72 C40 72 64 48 64 30 C64 16 54 8 40 8 C26 8 16 16 16 30 C16 48 40 72 40 72Z" fill="#F43F5E"/><circle cx="40" cy="30" r="10" fill="white"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-instagram', name: 'Instagram', preview: '#FDF2F8',
        svg: svgIcon('<defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#F58529"/><stop offset="50%" stop-color="#DD2A7B"/><stop offset="100%" stop-color="#515BD4"/></linearGradient></defs><rect x="10" y="10" width="60" height="60" rx="16" fill="none" stroke="url(#ig)" stroke-width="2.5"/><circle cx="40" cy="40" r="13" fill="none" stroke="url(#ig)" stroke-width="2.5"/><circle cx="58" cy="22" r="3.5" fill="#DD2A7B"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-facebook', name: 'Facebook', preview: '#EFF6FF',
        svg: svgIcon('<circle cx="40" cy="40" r="30" fill="#1877F2"/><path d="M44 28 L44 34 L50 34 L48 40 L44 40 L44 62 L36 62 L36 40 L30 40 L30 34 L36 34 L36 28 C36 22 40 18 46 18 L50 18 L50 24 L46 24 C44 24 44 26 44 28Z" fill="white"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-whatsapp', name: 'WhatsApp', preview: '#F0FDF4',
        svg: svgIcon('<circle cx="40" cy="40" r="30" fill="#25D366"/><path d="M40 14 C26 14 14 26 14 40 C14 44 15 48 18 52 L14 66 L28 62 C32 64 36 65 40 65 C54 65 66 54 66 40 C66 26 54 14 40 14Z" fill="white"/><path d="M30 32 C30 30 32 28 34 28 L36 28 C38 28 38 30 38 32 L38 34 C38 36 36 36 36 36 C36 36 38 44 44 44 C44 44 44 42 46 42 L48 42 C50 42 52 42 52 44 L52 46 C52 48 50 50 48 50 C42 50 30 46 30 32Z" fill="#25D366"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-tiktok', name: 'TikTok', preview: '#F9FAFB',
        svg: svgIcon('<rect x="8" y="8" width="64" height="64" rx="16" fill="#010101"/><path d="M52 24 C52 30 56 34 62 34 L62 42 C58 42 54 40 52 38 L52 52 C52 60 46 66 38 66 C30 66 24 60 24 52 C24 44 30 38 38 38 L38 46 C34 46 32 48 32 52 C32 56 34 58 38 58 C42 58 44 56 44 52 L44 18 L52 18 L52 24Z" fill="white"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-youtube', name: 'YouTube', preview: '#FFF1F2',
        svg: svgIcon('<rect x="6" y="20" width="68" height="40" rx="10" fill="#FF0000"/><polygon points="34,30 56,40 34,50" fill="white"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-qr', name: 'QR Code', preview: '#FAFAFA',
        svg: svgIcon('<rect x="8" y="8" width="64" height="64" rx="6" fill="none" stroke="#0F172A" stroke-width="2"/><rect x="14" y="14" width="18" height="18" rx="2" fill="none" stroke="#0F172A" stroke-width="2.5"/><rect x="18" y="18" width="10" height="10" rx="1" fill="#0F172A"/><rect x="48" y="14" width="18" height="18" rx="2" fill="none" stroke="#0F172A" stroke-width="2.5"/><rect x="52" y="18" width="10" height="10" rx="1" fill="#0F172A"/><rect x="14" y="48" width="18" height="18" rx="2" fill="none" stroke="#0F172A" stroke-width="2.5"/><rect x="18" y="52" width="10" height="10" rx="1" fill="#0F172A"/><rect x="48" y="48" width="6" height="6" fill="#0F172A"/><rect x="58" y="48" width="6" height="6" fill="#0F172A"/><rect x="48" y="58" width="6" height="6" fill="#0F172A"/><rect x="58" y="58" width="6" height="6" fill="#0F172A"/>'),
        mode: 'svg',
      },
      {
        id: 'soc-clock', name: 'Hours / Clock', preview: '#FFFBEB',
        svg: svgIcon('<circle cx="40" cy="40" r="28" fill="none" stroke="#D97706" stroke-width="2.5"/><line x1="40" y1="40" x2="40" y2="20" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/><line x1="40" y1="40" x2="56" y2="48" stroke="#D97706" stroke-width="2.5" stroke-linecap="round"/><circle cx="40" cy="40" r="3" fill="#D97706"/>'),
        mode: 'svg',
      },
    ],
  },
  {
    id: 'colors',
    title: 'Solid Colors',
    items: [
      { id: 'col-white', name: 'White', preview: '#FFFFFF', color: '#FFFFFF', mode: 'bg' },
      { id: 'col-black', name: 'Black', preview: '#111827', color: '#111827', mode: 'bg' },
      { id: 'col-slate', name: 'Slate', preview: '#64748B', color: '#64748B', mode: 'bg' },
      { id: 'col-gray', name: 'Gray', preview: '#9CA3AF', color: '#9CA3AF', mode: 'bg' },
      { id: 'col-cream', name: 'Cream', preview: '#FAF7F2', color: '#FAF7F2', mode: 'bg' },
      { id: 'col-red', name: 'Red', preview: '#EF4444', color: '#EF4444', mode: 'bg' },
      { id: 'col-rose', name: 'Rose', preview: '#F43F5E', color: '#F43F5E', mode: 'bg' },
      { id: 'col-pink', name: 'Pink', preview: '#EC4899', color: '#EC4899', mode: 'bg' },
      { id: 'col-fuchsia', name: 'Fuchsia', preview: '#D946EF', color: '#D946EF', mode: 'bg' },
      { id: 'col-purple', name: 'Purple', preview: '#A855F7', color: '#A855F7', mode: 'bg' },
      { id: 'col-violet', name: 'Violet', preview: '#7C3AED', color: '#7C3AED', mode: 'bg' },
      { id: 'col-indigo', name: 'Indigo', preview: '#6366F1', color: '#6366F1', mode: 'bg' },
      { id: 'col-blue', name: 'Blue', preview: '#3B82F6', color: '#3B82F6', mode: 'bg' },
      { id: 'col-sky', name: 'Sky', preview: '#0EA5E9', color: '#0EA5E9', mode: 'bg' },
      { id: 'col-cyan', name: 'Cyan', preview: '#06B6D4', color: '#06B6D4', mode: 'bg' },
      { id: 'col-teal', name: 'Teal', preview: '#14B8A6', color: '#14B8A6', mode: 'bg' },
      { id: 'col-emerald', name: 'Emerald', preview: '#10B981', color: '#10B981', mode: 'bg' },
      { id: 'col-green', name: 'Green', preview: '#22C55E', color: '#22C55E', mode: 'bg' },
      { id: 'col-lime', name: 'Lime', preview: '#84CC16', color: '#84CC16', mode: 'bg' },
      { id: 'col-yellow', name: 'Yellow', preview: '#EAB308', color: '#EAB308', mode: 'bg' },
      { id: 'col-amber', name: 'Amber', preview: '#F59E0B', color: '#F59E0B', mode: 'bg' },
      { id: 'col-orange', name: 'Orange', preview: '#F97316', color: '#F97316', mode: 'bg' },
      { id: 'col-navy', name: 'Navy', preview: '#1E3A5F', color: '#1E3A5F', mode: 'bg' },
      { id: 'col-maroon', name: 'Maroon', preview: '#881337', color: '#881337', mode: 'bg' },
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
