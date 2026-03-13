#!/usr/bin/env node
/**
 * Generate professional product mockup images for SpeedyPrint
 * Uses SVG → Sharp pipeline to create branded product images
 *
 * SpeedyPrint Brand Colors:
 *   Red:    #C62828
 *   Black:  #1A1A2E
 *   Yellow: #FFC107
 *   Gray:   #64748B
 */

import sharp from 'sharp'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const OUTPUT_DIR = join(__dirname, '..', 'public', 'images', 'products')

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true })
}

const BRAND = {
  red: '#C62828',
  darkRed: '#8E0000',
  black: '#1A1A2E',
  yellow: '#FFC107',
  gray: '#64748B',
  lightGray: '#F1F5F9',
  white: '#FFFFFF',
}

const WIDTH = 800
const HEIGHT = 600

// --- SVG Templates for each product ---

function svgCustomLabels() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FFF5F5"/>
        <stop offset="100%" style="stop-color:#FEE2E2"/>
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="3" dy="3" stdDeviation="6" flood-color="#00000020"/>
      </filter>
      <filter id="shadow2" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="2" dy="2" stdDeviation="4" flood-color="#00000015"/>
      </filter>
    </defs>
    <!-- Background -->
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <!-- Decorative dots pattern -->
    <g opacity="0.05">
      ${Array.from({length: 20}, (_, i) =>
        Array.from({length: 15}, (_, j) =>
          `<circle cx="${i*42+10}" cy="${j*42+10}" r="3" fill="${BRAND.red}"/>`
        ).join('')
      ).join('')}
    </g>
    <!-- Main label stack (3 labels fanned out) -->
    <!-- Label 3 (back) -->
    <g transform="translate(280, 140) rotate(-8, 120, 80)" filter="url(#shadow)">
      <rect x="0" y="0" width="280" height="170" rx="12" fill="${BRAND.white}" stroke="#E2E8F0" stroke-width="1"/>
      <rect x="15" y="15" width="250" height="5" rx="2" fill="#E2E8F0"/>
      <rect x="15" y="30" width="200" height="5" rx="2" fill="#E2E8F0"/>
      <rect x="15" y="45" width="170" height="5" rx="2" fill="#E2E8F0"/>
    </g>
    <!-- Label 2 (middle) -->
    <g transform="translate(260, 160) rotate(-3, 120, 80)" filter="url(#shadow)">
      <rect x="0" y="0" width="280" height="170" rx="12" fill="${BRAND.white}" stroke="#E2E8F0" stroke-width="1"/>
      <rect x="15" y="15" width="250" height="5" rx="2" fill="#F1F5F9"/>
      <rect x="15" y="30" width="200" height="5" rx="2" fill="#F1F5F9"/>
    </g>
    <!-- Label 1 (front) - main featured label -->
    <g transform="translate(240, 180)" filter="url(#shadow)">
      <rect x="0" y="0" width="280" height="170" rx="12" fill="${BRAND.white}" stroke="${BRAND.red}" stroke-width="2"/>
      <!-- Label content -->
      <rect x="15" y="15" width="55" height="55" rx="8" fill="${BRAND.red}"/>
      <text x="42" y="50" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">SP</text>
      <rect x="85" y="20" width="160" height="8" rx="3" fill="${BRAND.black}"/>
      <rect x="85" y="38" width="120" height="6" rx="3" fill="${BRAND.gray}"/>
      <rect x="85" y="52" width="140" height="6" rx="3" fill="#CBD5E1"/>
      <!-- Barcode -->
      <g transform="translate(15, 85)">
        ${Array.from({length: 25}, (_, i) =>
          `<rect x="${i*8}" y="0" width="${Math.random() > 0.3 ? 4 : 2}" height="35" fill="${BRAND.black}"/>`
        ).join('')}
      </g>
      <text x="90" y="140" font-family="monospace" font-size="11" fill="${BRAND.gray}">SP-2024-001-LABEL</text>
      <rect x="200" y="125" width="65" height="25" rx="5" fill="${BRAND.yellow}"/>
      <text x="232" y="142" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">CUSTOM</text>
    </g>
    <!-- Floating small labels -->
    <g transform="translate(80, 100) rotate(-15)" filter="url(#shadow2)">
      <rect width="100" height="60" rx="8" fill="${BRAND.yellow}" opacity="0.9"/>
      <text x="50" y="25" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">PREMIUM</text>
      <text x="50" y="42" font-family="Arial,sans-serif" font-size="10" fill="${BRAND.black}" text-anchor="middle">QUALITY</text>
    </g>
    <g transform="translate(600, 320) rotate(10)" filter="url(#shadow2)">
      <ellipse cx="45" cy="45" rx="45" ry="45" fill="${BRAND.red}" opacity="0.9"/>
      <text x="45" y="40" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="white" text-anchor="middle">FROM</text>
      <text x="45" y="58" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="${BRAND.yellow}" text-anchor="middle">R1.50</text>
    </g>
    <!-- Brand footer -->
    <rect x="0" y="${HEIGHT-60}" width="${WIDTH}" height="60" fill="${BRAND.black}" opacity="0.9"/>
    <text x="30" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.white}">SPEEDY</text>
    <text x="120" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.red}">PRINT</text>
    <text x="${WIDTH-30}" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="14" fill="${BRAND.gray}" text-anchor="end">Custom Labels &amp; Stickers</text>
  </svg>`
}

function svgVinylStickers() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#EFF6FF"/>
        <stop offset="100%" style="stop-color:#DBEAFE"/>
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="3" dy="4" stdDeviation="6" flood-color="#00000020"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <!-- Water droplets (to show waterproof) -->
    <g opacity="0.08">
      <circle cx="120" cy="100" r="15" fill="#3B82F6"/>
      <circle cx="650" cy="80" r="20" fill="#3B82F6"/>
      <circle cx="700" cy="450" r="12" fill="#3B82F6"/>
      <circle cx="80" cy="400" r="18" fill="#3B82F6"/>
    </g>
    <!-- Sticker sheet (grid of stickers) -->
    <g transform="translate(180, 60)" filter="url(#shadow)">
      <rect width="440" height="420" rx="8" fill="${BRAND.white}" stroke="#E2E8F0" stroke-width="1"/>
      <!-- Grid of stickers -->
      <!-- Row 1 -->
      <g transform="translate(20, 20)">
        <rect width="120" height="80" rx="10" fill="${BRAND.red}" stroke="${BRAND.darkRed}" stroke-width="1"/>
        <text x="60" y="35" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">SPEEDY</text>
        <text x="60" y="55" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="${BRAND.yellow}" text-anchor="middle">PRINT</text>
      </g>
      <g transform="translate(160, 20)">
        <rect width="120" height="80" rx="10" fill="${BRAND.yellow}" stroke="#F59E0B" stroke-width="1"/>
        <text x="60" y="35" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">PREMIUM</text>
        <text x="60" y="55" font-family="Arial,sans-serif" font-size="11" fill="${BRAND.black}" text-anchor="middle">QUALITY</text>
      </g>
      <g transform="translate(300, 20)">
        <rect width="120" height="80" rx="10" fill="${BRAND.black}" stroke="#0F172A" stroke-width="1"/>
        <text x="60" y="35" font-family="Arial,sans-serif" font-size="10" fill="${BRAND.gray}" text-anchor="middle">WATERPROOF</text>
        <text x="60" y="55" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">VINYL</text>
      </g>
      <!-- Row 2 -->
      <g transform="translate(20, 120)">
        <ellipse cx="60" cy="50" rx="55" ry="45" fill="#22C55E" stroke="#16A34A" stroke-width="1"/>
        <text x="60" y="45" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="white" text-anchor="middle">ORGANIC</text>
        <text x="60" y="62" font-family="Arial,sans-serif" font-size="9" fill="white" text-anchor="middle">CERTIFIED</text>
      </g>
      <g transform="translate(160, 120)">
        <rect width="120" height="90" rx="45" fill="#8B5CF6" stroke="#7C3AED" stroke-width="1"/>
        <text x="60" y="50" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">BRAND</text>
      </g>
      <g transform="translate(300, 120)">
        <rect width="120" height="90" rx="10" fill="${BRAND.red}" stroke="${BRAND.darkRed}" stroke-width="1"/>
        <text x="60" y="40" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">50%</text>
        <text x="60" y="60" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="${BRAND.yellow}" text-anchor="middle">OFF</text>
      </g>
      <!-- Row 3 -->
      <g transform="translate(20, 230)">
        <rect width="120" height="80" rx="10" fill="#0EA5E9" stroke="#0284C7" stroke-width="1"/>
        <text x="60" y="35" font-family="Arial,sans-serif" font-size="10" fill="white" text-anchor="middle">UV RESISTANT</text>
        <text x="60" y="55" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">OUTDOOR</text>
      </g>
      <g transform="translate(160, 230)">
        <rect width="120" height="80" rx="10" fill="#F97316" stroke="#EA580C" stroke-width="1"/>
        <text x="60" y="45" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">SALE!</text>
      </g>
      <g transform="translate(300, 230)">
        <rect width="120" height="80" rx="10" fill="${BRAND.black}" stroke="#334155" stroke-width="1"/>
        <text x="60" y="30" font-family="Arial,sans-serif" font-size="9" fill="${BRAND.yellow}" text-anchor="middle">★ ★ ★ ★ ★</text>
        <text x="60" y="50" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="white" text-anchor="middle">5 STAR</text>
        <text x="60" y="68" font-family="Arial,sans-serif" font-size="9" fill="${BRAND.gray}" text-anchor="middle">RATED</text>
      </g>
      <!-- Peel effect -->
      <g transform="translate(300, 330)">
        <path d="M120,0 L120,70 Q120,80 110,80 L0,80 L0,0 Z" fill="${BRAND.white}" stroke="#E2E8F0" stroke-width="1"/>
        <path d="M120,0 L120,70 Q120,80 110,80 L80,80 Q95,75 100,60 L100,0 Z" fill="#F8FAFC"/>
        <path d="M100,60 Q95,75 80,80 L120,80 Q120,70 120,70 L120,0 L100,0 Z" fill="#E2E8F0" opacity="0.5"/>
      </g>
    </g>
    <!-- Brand footer -->
    <rect x="0" y="${HEIGHT-60}" width="${WIDTH}" height="60" fill="${BRAND.black}" opacity="0.9"/>
    <text x="30" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.white}">SPEEDY</text>
    <text x="120" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.red}">PRINT</text>
    <text x="${WIDTH-30}" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="14" fill="${BRAND.gray}" text-anchor="end">Vinyl Stickers • Waterproof</text>
  </svg>`
}

function svgAcrylicSigns() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F0F9FF"/>
        <stop offset="100%" style="stop-color:#E0F2FE"/>
      </linearGradient>
      <linearGradient id="acrylic" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:0.95"/>
        <stop offset="50%" style="stop-color:#F8FAFC;stop-opacity:0.9"/>
        <stop offset="100%" style="stop-color:#E2E8F0;stop-opacity:0.85"/>
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="115%" height="115%">
        <feDropShadow dx="4" dy="6" stdDeviation="8" flood-color="#00000025"/>
      </filter>
      <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <!-- Wall texture -->
    <g opacity="0.04">
      ${Array.from({length: 30}, (_, i) =>
        `<line x1="0" y1="${i*20}" x2="${WIDTH}" y2="${i*20}" stroke="#94A3B8" stroke-width="0.5"/>`
      ).join('')}
    </g>
    <!-- Main acrylic sign -->
    <g transform="translate(150, 60)" filter="url(#shadow)">
      <!-- Acrylic panel -->
      <rect width="500" height="350" rx="4" fill="url(#acrylic)" stroke="#CBD5E1" stroke-width="1"/>
      <!-- Glass reflection effect -->
      <rect x="0" y="0" width="500" height="120" rx="4" fill="white" opacity="0.15"/>
      <!-- Mounting holes -->
      <circle cx="30" cy="30" r="6" fill="none" stroke="#94A3B8" stroke-width="2"/>
      <circle cx="470" cy="30" r="6" fill="none" stroke="#94A3B8" stroke-width="2"/>
      <circle cx="30" cy="320" r="6" fill="none" stroke="#94A3B8" stroke-width="2"/>
      <circle cx="470" cy="320" r="6" fill="none" stroke="#94A3B8" stroke-width="2"/>
      <!-- Sign content -->
      <rect x="60" y="60" width="380" height="230" rx="4" fill="none" stroke="${BRAND.red}" stroke-width="2"/>
      <!-- Logo area -->
      <rect x="170" y="80" width="160" height="50" rx="6" fill="${BRAND.red}"/>
      <text x="250" y="108" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">SPEEDY</text>
      <text x="250" y="124" font-family="Arial,sans-serif" font-size="10" fill="${BRAND.yellow}" text-anchor="middle" letter-spacing="4">PRINT</text>
      <!-- Company name -->
      <text x="250" y="170" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">YOUR BUSINESS</text>
      <text x="250" y="200" font-family="Arial,sans-serif" font-size="16" fill="${BRAND.gray}" text-anchor="middle">Professional Acrylic Signage</text>
      <!-- Decorative line -->
      <line x1="160" y1="220" x2="340" y2="220" stroke="${BRAND.red}" stroke-width="2"/>
      <text x="250" y="250" font-family="Arial,sans-serif" font-size="12" fill="${BRAND.gray}" text-anchor="middle">Suite 100 • Floor 3 • Reception</text>
      <text x="250" y="272" font-family="Arial,sans-serif" font-size="11" fill="${BRAND.gray}" text-anchor="middle">☎ +27 (0)12 345 6789</text>
    </g>
    <!-- Small sample signs -->
    <g transform="translate(50, 440)" filter="url(#shadow)">
      <rect width="150" height="80" rx="3" fill="url(#acrylic)" stroke="#CBD5E1" stroke-width="1"/>
      <text x="75" y="35" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">CONFERENCE</text>
      <text x="75" y="55" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">ROOM A</text>
    </g>
    <g transform="translate(230, 440)" filter="url(#shadow)">
      <rect width="150" height="80" rx="3" fill="url(#acrylic)" stroke="#CBD5E1" stroke-width="1"/>
      <text x="75" y="35" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="${BRAND.red}" text-anchor="middle">PRIVATE</text>
      <text x="75" y="55" font-family="Arial,sans-serif" font-size="10" fill="${BRAND.gray}" text-anchor="middle">Staff Only</text>
    </g>
    <!-- Brand footer -->
    <rect x="0" y="${HEIGHT-60}" width="${WIDTH}" height="60" fill="${BRAND.black}" opacity="0.9"/>
    <text x="30" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.white}">SPEEDY</text>
    <text x="120" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.red}">PRINT</text>
    <text x="${WIDTH-30}" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="14" fill="${BRAND.gray}" text-anchor="end">Laser-Cut Acrylic Signs</text>
  </svg>`
}

function svgWoodenPlaques() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FFFBEB"/>
        <stop offset="100%" style="stop-color:#FEF3C7"/>
      </linearGradient>
      <linearGradient id="wood" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#8B6914"/>
        <stop offset="20%" style="stop-color:#A0782C"/>
        <stop offset="40%" style="stop-color:#8B6914"/>
        <stop offset="60%" style="stop-color:#A0782C"/>
        <stop offset="80%" style="stop-color:#926E1A"/>
        <stop offset="100%" style="stop-color:#A0782C"/>
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="115%" height="115%">
        <feDropShadow dx="4" dy="6" stdDeviation="8" flood-color="#00000030"/>
      </filter>
      <filter id="engrave">
        <feFlood flood-color="#5C3D0E" flood-opacity="1"/>
        <feComposite in2="SourceGraphic" operator="in"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <!-- Main wooden plaque -->
    <g transform="translate(160, 50)" filter="url(#shadow)">
      <rect width="480" height="360" rx="12" fill="url(#wood)"/>
      <!-- Wood grain lines -->
      <g opacity="0.15">
        ${Array.from({length: 20}, (_, i) =>
          `<line x1="0" y1="${i*18+5}" x2="480" y2="${i*18+8}" stroke="#5C3D0E" stroke-width="0.8"/>`
        ).join('')}
      </g>
      <!-- Engraved border -->
      <rect x="20" y="20" width="440" height="320" rx="6" fill="none" stroke="#5C3D0E" stroke-width="2" opacity="0.6"/>
      <rect x="30" y="30" width="420" height="300" rx="4" fill="none" stroke="#5C3D0E" stroke-width="1" opacity="0.3"/>
      <!-- Engraved content -->
      <text x="240" y="80" font-family="Georgia,serif" font-size="14" fill="#5C3D0E" text-anchor="middle" letter-spacing="3" opacity="0.8">CERTIFICATE OF</text>
      <text x="240" y="120" font-family="Georgia,serif" font-size="32" font-weight="bold" fill="#4A2C05" text-anchor="middle">EXCELLENCE</text>
      <!-- Decorative line -->
      <line x1="100" y1="140" x2="380" y2="140" stroke="#5C3D0E" stroke-width="1.5" opacity="0.5"/>
      <text x="240" y="175" font-family="Georgia,serif" font-size="15" fill="#5C3D0E" text-anchor="middle" opacity="0.7">Awarded to</text>
      <text x="240" y="210" font-family="Georgia,serif" font-size="22" font-weight="bold" fill="#4A2C05" text-anchor="middle" font-style="italic">Your Name Here</text>
      <line x1="130" y1="225" x2="350" y2="225" stroke="#5C3D0E" stroke-width="0.8" opacity="0.4"/>
      <text x="240" y="260" font-family="Georgia,serif" font-size="12" fill="#5C3D0E" text-anchor="middle" opacity="0.6">In recognition of outstanding achievement</text>
      <text x="240" y="282" font-family="Georgia,serif" font-size="12" fill="#5C3D0E" text-anchor="middle" opacity="0.6">and dedication to excellence</text>
      <!-- Date and signature lines -->
      <line x1="60" y1="320" x2="180" y2="320" stroke="#5C3D0E" stroke-width="1" opacity="0.4"/>
      <text x="120" y="338" font-family="Georgia,serif" font-size="10" fill="#5C3D0E" text-anchor="middle" opacity="0.5">Date</text>
      <line x1="300" y1="320" x2="420" y2="320" stroke="#5C3D0E" stroke-width="1" opacity="0.4"/>
      <text x="360" y="338" font-family="Georgia,serif" font-size="10" fill="#5C3D0E" text-anchor="middle" opacity="0.5">Signature</text>
    </g>
    <!-- Small sample plaque -->
    <g transform="translate(50, 440)" filter="url(#shadow)">
      <rect width="180" height="100" rx="8" fill="url(#wood)"/>
      <g opacity="0.15">
        ${Array.from({length: 6}, (_, i) =>
          `<line x1="0" y1="${i*18+5}" x2="180" y2="${i*18+8}" stroke="#5C3D0E" stroke-width="0.8"/>`
        ).join('')}
      </g>
      <text x="90" y="40" font-family="Georgia,serif" font-size="12" font-weight="bold" fill="#4A2C05" text-anchor="middle">EMPLOYEE</text>
      <text x="90" y="60" font-family="Georgia,serif" font-size="14" font-weight="bold" fill="#4A2C05" text-anchor="middle">OF THE MONTH</text>
      <text x="90" y="82" font-family="Georgia,serif" font-size="10" fill="#5C3D0E" text-anchor="middle">March 2026</text>
    </g>
    <!-- Brand footer -->
    <rect x="0" y="${HEIGHT-60}" width="${WIDTH}" height="60" fill="${BRAND.black}" opacity="0.9"/>
    <text x="30" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.white}">SPEEDY</text>
    <text x="120" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.red}">PRINT</text>
    <text x="${WIDTH-30}" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="14" fill="${BRAND.gray}" text-anchor="end">Laser-Engraved Wooden Plaques</text>
  </svg>`
}

function svgRaceBibs() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F0FDF4"/>
        <stop offset="100%" style="stop-color:#DCFCE7"/>
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="115%" height="115%">
        <feDropShadow dx="3" dy="4" stdDeviation="6" flood-color="#00000020"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <!-- Track lines in background -->
    <g opacity="0.06">
      ${Array.from({length: 8}, (_, i) =>
        `<line x1="0" y1="${50+i*75}" x2="${WIDTH}" y2="${50+i*75}" stroke="#22C55E" stroke-width="3"/>`
      ).join('')}
    </g>
    <!-- Main race bib -->
    <g transform="translate(200, 40)" filter="url(#shadow)">
      <rect width="400" height="280" rx="4" fill="${BRAND.white}" stroke="#D1D5DB" stroke-width="1"/>
      <!-- Safety pin holes -->
      <circle cx="20" cy="20" r="5" fill="none" stroke="#9CA3AF" stroke-width="1.5"/>
      <circle cx="380" cy="20" r="5" fill="none" stroke="#9CA3AF" stroke-width="1.5"/>
      <circle cx="20" cy="260" r="5" fill="none" stroke="#9CA3AF" stroke-width="1.5"/>
      <circle cx="380" cy="260" r="5" fill="none" stroke="#9CA3AF" stroke-width="1.5"/>
      <!-- Event logo/name -->
      <rect x="100" y="15" width="200" height="40" rx="4" fill="${BRAND.red}"/>
      <text x="200" y="42" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">COMRADES 2026</text>
      <!-- BIG NUMBER -->
      <text x="200" y="190" font-family="Arial,sans-serif" font-size="120" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">1247</text>
      <!-- Runner name -->
      <text x="200" y="225" font-family="Arial,sans-serif" font-size="16" fill="${BRAND.gray}" text-anchor="middle">JOHN SMITH</text>
      <!-- Sponsor bar -->
      <rect x="0" y="240" width="400" height="40" fill="${BRAND.yellow}"/>
      <text x="200" y="265" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">Powered by SpeedyPrint • Tyvek Material • Waterproof</text>
      <!-- Timing chip area -->
      <rect x="150" y="210" width="100" height="20" rx="3" fill="none" stroke="#D1D5DB" stroke-width="1" stroke-dasharray="4,2"/>
      <text x="200" y="224" font-family="Arial,sans-serif" font-size="8" fill="#9CA3AF" text-anchor="middle">TIMING CHIP</text>
    </g>
    <!-- Stack of bibs in background -->
    <g transform="translate(60, 360)" filter="url(#shadow)">
      <rect width="200" height="140" rx="3" fill="${BRAND.white}" stroke="#D1D5DB" stroke-width="1"/>
      <rect x="45" y="10" width="110" height="25" rx="3" fill="#22C55E"/>
      <text x="100" y="28" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="white" text-anchor="middle">CAPE TOWN 10K</text>
      <text x="100" y="90" font-family="Arial,sans-serif" font-size="56" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">503</text>
      <rect x="0" y="115" width="200" height="25" fill="${BRAND.yellow}"/>
      <text x="100" y="132" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">SpeedyPrint • Race Bibs</text>
    </g>
    <g transform="translate(300, 370)" filter="url(#shadow)">
      <rect width="200" height="140" rx="3" fill="${BRAND.white}" stroke="#D1D5DB" stroke-width="1"/>
      <rect x="30" y="10" width="140" height="25" rx="3" fill="${BRAND.red}"/>
      <text x="100" y="28" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="white" text-anchor="middle">TWO OCEANS ULTRA</text>
      <text x="100" y="90" font-family="Arial,sans-serif" font-size="56" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">89</text>
      <rect x="0" y="115" width="200" height="25" fill="${BRAND.yellow}"/>
      <text x="100" y="132" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">SpeedyPrint • Tyvek</text>
    </g>
    <!-- Brand footer -->
    <rect x="0" y="${HEIGHT-60}" width="${WIDTH}" height="60" fill="${BRAND.black}" opacity="0.9"/>
    <text x="30" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.white}">SPEEDY</text>
    <text x="120" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.red}">PRINT</text>
    <text x="${WIDTH-30}" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="14" fill="${BRAND.gray}" text-anchor="end">Race Bibs • Tyvek Waterproof</text>
  </svg>`
}

function svgEventTags() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FAF5FF"/>
        <stop offset="100%" style="stop-color:#F3E8FF"/>
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="115%" height="115%">
        <feDropShadow dx="3" dy="4" stdDeviation="6" flood-color="#00000020"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <!-- Lanyard -->
    <g>
      <path d="M400,0 Q400,80 370,120 L370,180" stroke="${BRAND.red}" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M400,0 Q400,80 430,120 L430,180" stroke="${BRAND.red}" stroke-width="16" fill="none" stroke-linecap="round"/>
      <text x="400" y="100" font-family="Arial,sans-serif" font-size="8" fill="white" text-anchor="middle" transform="rotate(-15, 400, 100)">SPEEDYPRINT</text>
      <!-- Clip -->
      <rect x="375" y="175" width="50" height="20" rx="3" fill="#94A3B8"/>
      <rect x="385" y="190" width="30" height="8" rx="2" fill="#64748B"/>
    </g>
    <!-- Main badge -->
    <g transform="translate(270, 195)" filter="url(#shadow)">
      <rect width="260" height="340" rx="12" fill="${BRAND.white}" stroke="#E2E8F0" stroke-width="1"/>
      <!-- Event header -->
      <rect x="0" y="0" width="260" height="80" rx="12" fill="${BRAND.red}"/>
      <rect x="0" y="40" width="260" height="40" fill="${BRAND.red}"/>
      <text x="130" y="30" font-family="Arial,sans-serif" font-size="10" fill="${BRAND.yellow}" text-anchor="middle" letter-spacing="3">TECH CONFERENCE</text>
      <text x="130" y="55" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">SUMMIT 2026</text>
      <text x="130" y="72" font-family="Arial,sans-serif" font-size="9" fill="rgba(255,255,255,0.8)" text-anchor="middle">Cape Town ICC • 15-17 March</text>
      <!-- Photo area -->
      <rect x="80" y="95" width="100" height="100" rx="50" fill="#F1F5F9" stroke="#E2E8F0" stroke-width="1"/>
      <text x="130" y="150" font-family="Arial,sans-serif" font-size="30" fill="#CBD5E1" text-anchor="middle">👤</text>
      <!-- Name -->
      <text x="130" y="225" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">Jane Doe</text>
      <text x="130" y="248" font-family="Arial,sans-serif" font-size="13" fill="${BRAND.gray}" text-anchor="middle">Senior Developer</text>
      <text x="130" y="268" font-family="Arial,sans-serif" font-size="12" fill="${BRAND.gray}" text-anchor="middle">TechCorp Inc.</text>
      <!-- Badge type -->
      <rect x="80" y="285" width="100" height="28" rx="14" fill="#22C55E"/>
      <text x="130" y="304" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">SPEAKER</text>
      <!-- QR placeholder -->
      <rect x="210" y="290" width="35" height="35" rx="4" fill="${BRAND.black}"/>
      <text x="228" y="312" font-family="Arial,sans-serif" font-size="8" fill="white" text-anchor="middle">QR</text>
    </g>
    <!-- Small badges stack -->
    <g transform="translate(60, 250)" filter="url(#shadow)">
      <rect width="160" height="220" rx="10" fill="${BRAND.white}" stroke="#E2E8F0" stroke-width="1"/>
      <rect x="0" y="0" width="160" height="50" rx="10" fill="${BRAND.yellow}"/>
      <rect x="0" y="25" width="160" height="25" fill="${BRAND.yellow}"/>
      <text x="80" y="30" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">WORKSHOP</text>
      <text x="80" y="45" font-family="Arial,sans-serif" font-size="8" fill="${BRAND.black}" text-anchor="middle">DAY PASS</text>
      <rect x="40" y="65" width="80" height="80" rx="40" fill="#F1F5F9"/>
      <text x="80" y="110" font-family="Arial,sans-serif" font-size="24" fill="#CBD5E1" text-anchor="middle">👤</text>
      <text x="80" y="170" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">Attendee</text>
      <rect x="30" y="190" width="100" height="20" rx="10" fill="#3B82F6"/>
      <text x="80" y="204" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="white" text-anchor="middle">VIP ACCESS</text>
    </g>
    <!-- Brand footer -->
    <rect x="0" y="${HEIGHT-60}" width="${WIDTH}" height="60" fill="${BRAND.black}" opacity="0.9"/>
    <text x="30" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.white}">SPEEDY</text>
    <text x="120" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.red}">PRINT</text>
    <text x="${WIDTH-30}" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="14" fill="${BRAND.gray}" text-anchor="end">Event Tags &amp; Badges</text>
  </svg>`
}

function svgMTBBoards() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ECFDF5"/>
        <stop offset="100%" style="stop-color:#D1FAE5"/>
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="115%" height="115%">
        <feDropShadow dx="3" dy="4" stdDeviation="6" flood-color="#00000025"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <!-- Mountain silhouette background -->
    <g opacity="0.08">
      <path d="M0,400 L100,250 L200,300 L350,150 L500,280 L650,200 L800,350 L800,600 L0,600 Z" fill="#22C55E"/>
    </g>
    <!-- Main MTB number board -->
    <g transform="translate(200, 50)" filter="url(#shadow)">
      <rect width="400" height="320" rx="16" fill="${BRAND.white}" stroke="${BRAND.black}" stroke-width="3"/>
      <!-- Top bar with event branding -->
      <rect x="0" y="0" width="400" height="70" rx="16" fill="${BRAND.red}"/>
      <rect x="0" y="35" width="400" height="35" fill="${BRAND.red}"/>
      <text x="200" y="28" font-family="Arial,sans-serif" font-size="12" fill="${BRAND.yellow}" text-anchor="middle" letter-spacing="2">CAPE EPIC</text>
      <text x="200" y="52" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">MTB CHALLENGE</text>
      <!-- BIG NUMBER -->
      <text x="200" y="210" font-family="Arial,sans-serif" font-size="130" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">42</text>
      <!-- Bottom bar -->
      <rect x="0" y="260" width="400" height="60" rx="0" fill="${BRAND.black}"/>
      <rect x="0" y="300" width="400" height="20" rx="16" fill="${BRAND.black}"/>
      <text x="200" y="290" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="${BRAND.yellow}" text-anchor="middle">Printed by SpeedyPrint</text>
      <text x="200" y="310" font-family="Arial,sans-serif" font-size="10" fill="${BRAND.gray}" text-anchor="middle">UV Resistant • Lightweight • Durable</text>
      <!-- Cable tie holes -->
      <circle cx="30" cy="160" r="8" fill="none" stroke="#9CA3AF" stroke-width="2"/>
      <circle cx="370" cy="160" r="8" fill="none" stroke="#9CA3AF" stroke-width="2"/>
      <circle cx="30" cy="240" r="8" fill="none" stroke="#9CA3AF" stroke-width="2"/>
      <circle cx="370" cy="240" r="8" fill="none" stroke="#9CA3AF" stroke-width="2"/>
    </g>
    <!-- Smaller board samples -->
    <g transform="translate(40, 400)" filter="url(#shadow)">
      <rect width="200" height="160" rx="12" fill="${BRAND.white}" stroke="${BRAND.black}" stroke-width="2"/>
      <rect x="0" y="0" width="200" height="40" rx="12" fill="#22C55E"/>
      <rect x="0" y="20" width="200" height="20" fill="#22C55E"/>
      <text x="100" y="28" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">TRAIL RUN</text>
      <text x="100" y="110" font-family="Arial,sans-serif" font-size="60" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">178</text>
    </g>
    <g transform="translate(280, 400)" filter="url(#shadow)">
      <rect width="200" height="160" rx="12" fill="${BRAND.white}" stroke="${BRAND.black}" stroke-width="2"/>
      <rect x="0" y="0" width="200" height="40" rx="12" fill="#F97316"/>
      <rect x="0" y="20" width="200" height="20" fill="#F97316"/>
      <text x="100" y="28" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">ENDURO</text>
      <text x="100" y="110" font-family="Arial,sans-serif" font-size="60" font-weight="bold" fill="${BRAND.black}" text-anchor="middle">7</text>
    </g>
    <!-- Brand footer -->
    <rect x="0" y="${HEIGHT-60}" width="${WIDTH}" height="60" fill="${BRAND.black}" opacity="0.9"/>
    <text x="30" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.white}">SPEEDY</text>
    <text x="120" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.red}">PRINT</text>
    <text x="${WIDTH-30}" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="14" fill="${BRAND.gray}" text-anchor="end">MTB Number Boards</text>
  </svg>`
}

function svgSelfInkingStamps() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FDF4FF"/>
        <stop offset="100%" style="stop-color:#FAE8FF"/>
      </linearGradient>
      <linearGradient id="stamp-body" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#374151"/>
        <stop offset="50%" style="stop-color:#1F2937"/>
        <stop offset="100%" style="stop-color:#111827"/>
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="115%" height="115%">
        <feDropShadow dx="3" dy="4" stdDeviation="6" flood-color="#00000025"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <!-- Stamp impressions on paper -->
    <g opacity="0.08">
      <rect x="50" y="100" width="180" height="60" rx="4" fill="none" stroke="${BRAND.red}" stroke-width="3" transform="rotate(-5, 140, 130)"/>
      <rect x="580" y="400" width="150" height="50" rx="4" fill="none" stroke="#3B82F6" stroke-width="3" transform="rotate(8, 655, 425)"/>
    </g>
    <!-- Main stamp (3D view) -->
    <g transform="translate(250, 50)" filter="url(#shadow)">
      <!-- Stamp body -->
      <rect x="0" y="0" width="300" height="100" rx="8" fill="url(#stamp-body)"/>
      <!-- Grip area -->
      <rect x="10" y="10" width="280" height="30" rx="4" fill="#4B5563"/>
      <text x="150" y="30" font-family="Arial,sans-serif" font-size="11" fill="#9CA3AF" text-anchor="middle">COLOP • SELF-INKING</text>
      <!-- Color pad indicator -->
      <rect x="120" y="50" width="60" height="15" rx="4" fill="${BRAND.red}"/>
      <!-- Bottom platform -->
      <rect x="20" y="85" width="260" height="15" rx="2" fill="#0F172A"/>
      <!-- Stamp face (bottom) -->
      <rect x="20" y="100" width="260" height="60" rx="4" fill="${BRAND.black}"/>
      <!-- Rubber text (reversed/mirrored look) -->
      <text x="150" y="125" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#374151" text-anchor="middle">SPEEDY PRINT (PTY) LTD</text>
      <text x="150" y="148" font-family="Arial,sans-serif" font-size="10" fill="#374151" text-anchor="middle">Tel: +27 12 345 6789 • info@speedyprint.co.za</text>
    </g>
    <!-- Stamp impression on paper -->
    <g transform="translate(180, 240)">
      <rect width="440" height="250" rx="4" fill="${BRAND.white}" filter="url(#shadow)"/>
      <!-- Paper lines -->
      <g opacity="0.1">
        ${Array.from({length: 10}, (_, i) =>
          `<line x1="30" y1="${30+i*22}" x2="410" y2="${30+i*22}" stroke="#94A3B8" stroke-width="0.5"/>`
        ).join('')}
      </g>
      <!-- Stamp impression -->
      <g transform="translate(100, 50) rotate(-3, 120, 50)">
        <rect width="240" height="90" rx="4" fill="none" stroke="${BRAND.red}" stroke-width="3"/>
        <text x="120" y="30" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="${BRAND.red}" text-anchor="middle">SPEEDY PRINT</text>
        <text x="120" y="50" font-family="Arial,sans-serif" font-size="11" fill="${BRAND.red}" text-anchor="middle">(PTY) LTD</text>
        <line x1="20" y1="60" x2="220" y2="60" stroke="${BRAND.red}" stroke-width="1"/>
        <text x="120" y="78" font-family="Arial,sans-serif" font-size="10" fill="${BRAND.red}" text-anchor="middle">Tel: +27 12 345 6789 • info@speedyprint.co.za</text>
      </g>
      <!-- Additional stamp impressions -->
      <g transform="translate(50, 160) rotate(2)">
        <rect width="120" height="40" rx="4" fill="none" stroke="#3B82F6" stroke-width="2.5"/>
        <text x="60" y="26" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="#3B82F6" text-anchor="middle">APPROVED</text>
      </g>
      <g transform="translate(250, 155) rotate(-5)">
        <rect width="140" height="40" rx="20" fill="none" stroke="#22C55E" stroke-width="2.5"/>
        <text x="70" y="27" font-family="Arial,sans-serif" font-size="13" font-weight="bold" fill="#22C55E" text-anchor="middle">RECEIVED</text>
      </g>
    </g>
    <!-- Brand footer -->
    <rect x="0" y="${HEIGHT-60}" width="${WIDTH}" height="60" fill="${BRAND.black}" opacity="0.9"/>
    <text x="30" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.white}">SPEEDY</text>
    <text x="120" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.red}">PRINT</text>
    <text x="${WIDTH-30}" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="14" fill="${BRAND.gray}" text-anchor="end">Self-Inking Rubber Stamps</text>
  </svg>`
}

function svgCoffeeSleeves() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FFFBEB"/>
        <stop offset="100%" style="stop-color:#FEF3C7"/>
      </linearGradient>
      <linearGradient id="coffee-cup" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#FFFFFF"/>
        <stop offset="100%" style="stop-color:#F1F5F9"/>
      </linearGradient>
      <linearGradient id="kraft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#B8860B"/>
        <stop offset="30%" style="stop-color:#D4A03C"/>
        <stop offset="60%" style="stop-color:#C49428"/>
        <stop offset="100%" style="stop-color:#B8860B"/>
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="115%" height="115%">
        <feDropShadow dx="3" dy="4" stdDeviation="6" flood-color="#00000025"/>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <!-- Coffee beans background -->
    <g opacity="0.05">
      ${[{x:100,y:80},{x:650,y:120},{x:200,y:450},{x:700,y:400},{x:50,y:300}].map(p =>
        `<ellipse cx="${p.x}" cy="${p.y}" rx="15" ry="10" fill="#8B4513" transform="rotate(${Math.random()*360}, ${p.x}, ${p.y})"/>
         <line x1="${p.x-8}" y1="${p.y}" x2="${p.x+8}" y2="${p.y}" stroke="#FFFBEB" stroke-width="2"/>`
      ).join('')}
    </g>
    <!-- Main coffee cup -->
    <g transform="translate(280, 20)" filter="url(#shadow)">
      <!-- Cup body (tapered) -->
      <path d="M40,0 L200,0 L185,380 L55,380 Z" fill="url(#coffee-cup)" stroke="#E2E8F0" stroke-width="1"/>
      <!-- Lid -->
      <ellipse cx="120" cy="5" rx="90" ry="15" fill="#6B7280"/>
      <ellipse cx="120" cy="5" rx="80" ry="10" fill="#9CA3AF"/>
      <rect x="95" y="-15" width="50" height="15" rx="5" fill="#6B7280"/>
      <!-- Sleeve -->
      <path d="M52,120 L188,120 L183,260 L57,260 Z" fill="url(#kraft)"/>
      <!-- Kraft paper texture -->
      <g opacity="0.1">
        ${Array.from({length: 15}, (_, i) =>
          `<line x1="55" y1="${125+i*9}" x2="186" y2="${125+i*9}" stroke="#5C3D0E" stroke-width="0.5"/>`
        ).join('')}
      </g>
      <!-- Sleeve branding -->
      <rect x="75" y="140" width="90" height="35" rx="4" fill="${BRAND.red}"/>
      <text x="120" y="158" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="white" text-anchor="middle">SPEEDY</text>
      <text x="120" y="170" font-family="Arial,sans-serif" font-size="8" fill="${BRAND.yellow}" text-anchor="middle" letter-spacing="2">PRINT</text>
      <text x="120" y="200" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#5C3D0E" text-anchor="middle">YOUR CAFE</text>
      <text x="120" y="215" font-family="Arial,sans-serif" font-size="8" fill="#5C3D0E" text-anchor="middle">EST. 2020</text>
      <text x="120" y="245" font-family="Arial,sans-serif" font-size="7" fill="#5C3D0E" text-anchor="middle">♻ Recycled • Eco-Friendly</text>
      <!-- Steam -->
      <g opacity="0.15">
        <path d="M100,-30 Q95,-50 105,-70" fill="none" stroke="#9CA3AF" stroke-width="3" stroke-linecap="round"/>
        <path d="M120,-25 Q125,-50 115,-75" fill="none" stroke="#9CA3AF" stroke-width="3" stroke-linecap="round"/>
        <path d="M140,-30 Q135,-55 145,-70" fill="none" stroke="#9CA3AF" stroke-width="3" stroke-linecap="round"/>
      </g>
    </g>
    <!-- Flat sleeve (unfolded) -->
    <g transform="translate(30, 260)" filter="url(#shadow)">
      <rect width="220" height="80" rx="6" fill="url(#kraft)"/>
      <g opacity="0.1">
        ${Array.from({length: 8}, (_, i) =>
          `<line x1="5" y1="${5+i*10}" x2="215" y2="${5+i*10}" stroke="#5C3D0E" stroke-width="0.5"/>`
        ).join('')}
      </g>
      <rect x="50" y="15" width="120" height="50" rx="4" fill="none" stroke="${BRAND.red}" stroke-width="2"/>
      <text x="110" y="37" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="${BRAND.red}" text-anchor="middle">ARTISAN CAFE</text>
      <text x="110" y="55" font-family="Arial,sans-serif" font-size="8" fill="#5C3D0E" text-anchor="middle">Freshly Roasted Daily</text>
    </g>
    <!-- Stack of sleeves -->
    <g transform="translate(30, 380)" filter="url(#shadow)">
      <rect x="4" y="4" width="220" height="80" rx="6" fill="#C49428"/>
      <rect x="2" y="2" width="220" height="80" rx="6" fill="#D4A03C"/>
      <rect width="220" height="80" rx="6" fill="url(#kraft)"/>
      <text x="110" y="35" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#5C3D0E" text-anchor="middle">FULL COLOR</text>
      <text x="110" y="55" font-family="Arial,sans-serif" font-size="9" fill="#5C3D0E" text-anchor="middle">Custom Printed Sleeves</text>
      <text x="110" y="72" font-family="Arial,sans-serif" font-size="8" fill="${BRAND.red}" text-anchor="middle">from R2.50 each</text>
    </g>
    <!-- Brand footer -->
    <rect x="0" y="${HEIGHT-60}" width="${WIDTH}" height="60" fill="${BRAND.black}" opacity="0.9"/>
    <text x="30" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.white}">SPEEDY</text>
    <text x="120" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.red}">PRINT</text>
    <text x="${WIDTH-30}" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="14" fill="${BRAND.gray}" text-anchor="end">Branded Coffee Sleeves</text>
  </svg>`
}

function svgAwardTrophies() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FFF7ED"/>
        <stop offset="100%" style="stop-color:#FFEDD5"/>
      </linearGradient>
      <linearGradient id="acrylic-clear" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:0.95"/>
        <stop offset="30%" style="stop-color:#F0F9FF;stop-opacity:0.9"/>
        <stop offset="70%" style="stop-color:#E0F2FE;stop-opacity:0.85"/>
        <stop offset="100%" style="stop-color:#BAE6FD;stop-opacity:0.8"/>
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#FCD34D"/>
        <stop offset="50%" style="stop-color:#F59E0B"/>
        <stop offset="100%" style="stop-color:#D97706"/>
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="115%" height="115%">
        <feDropShadow dx="3" dy="4" stdDeviation="6" flood-color="#00000025"/>
      </filter>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    <!-- Sparkle effects -->
    <g opacity="0.15">
      <text x="150" y="100" font-size="20" fill="${BRAND.yellow}">✦</text>
      <text x="650" y="150" font-size="16" fill="${BRAND.yellow}">✦</text>
      <text x="100" y="350" font-size="14" fill="${BRAND.yellow}">✦</text>
      <text x="720" y="380" font-size="18" fill="${BRAND.yellow}">✦</text>
    </g>
    <!-- Main trophy (acrylic) -->
    <g transform="translate(280, 30)" filter="url(#shadow)">
      <!-- Trophy shape (shield/angular) -->
      <path d="M120,0 L240,40 L220,320 L120,350 L20,320 L0,40 Z" fill="url(#acrylic-clear)" stroke="#93C5FD" stroke-width="1"/>
      <!-- Glass reflection -->
      <path d="M120,0 L240,40 L230,120 L30,100 L0,40 Z" fill="white" opacity="0.2"/>
      <!-- Engraved content -->
      <text x="120" y="80" font-family="Georgia,serif" font-size="12" fill="${BRAND.red}" text-anchor="middle" letter-spacing="2" opacity="0.9">★ AWARD ★</text>
      <text x="120" y="120" font-family="Georgia,serif" font-size="22" font-weight="bold" fill="${BRAND.black}" text-anchor="middle" opacity="0.85">BEST</text>
      <text x="120" y="150" font-family="Georgia,serif" font-size="22" font-weight="bold" fill="${BRAND.black}" text-anchor="middle" opacity="0.85">PERFORMER</text>
      <line x1="50" y1="170" x2="190" y2="170" stroke="${BRAND.red}" stroke-width="1.5" opacity="0.6"/>
      <text x="120" y="200" font-family="Georgia,serif" font-size="14" fill="${BRAND.gray}" text-anchor="middle" opacity="0.7">2026</text>
      <text x="120" y="230" font-family="Georgia,serif" font-size="11" fill="${BRAND.gray}" text-anchor="middle" opacity="0.6">Presented to</text>
      <text x="120" y="255" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="${BRAND.black}" text-anchor="middle" opacity="0.8" font-style="italic">Your Name</text>
      <!-- SpeedyPrint logo on trophy -->
      <text x="120" y="310" font-family="Arial,sans-serif" font-size="8" fill="${BRAND.gray}" text-anchor="middle" opacity="0.5">SpeedyPrint</text>
      <!-- Base -->
      <rect x="40" y="345" width="160" height="20" rx="4" fill="#1F2937"/>
      <rect x="30" y="360" width="180" height="30" rx="4" fill="${BRAND.black}"/>
      <text x="120" y="380" font-family="Arial,sans-serif" font-size="9" fill="${BRAND.gray}" text-anchor="middle">Custom Engraved</text>
    </g>
    <!-- Second trophy (smaller, star shape) -->
    <g transform="translate(50, 150)" filter="url(#shadow)">
      <!-- Star trophy -->
      <polygon points="80,10 95,60 150,60 105,90 120,140 80,110 40,140 55,90 10,60 65,60" fill="url(#gold)" filter="url(#glow)"/>
      <text x="80" y="85" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">★</text>
      <!-- Base -->
      <rect x="50" y="145" width="60" height="12" rx="3" fill="#374151"/>
      <rect x="40" y="155" width="80" height="20" rx="3" fill="${BRAND.black}"/>
      <text x="80" y="169" font-family="Arial,sans-serif" font-size="7" fill="#9CA3AF" text-anchor="middle">GOLD STAR</text>
    </g>
    <!-- Third trophy (circular/medal style) -->
    <g transform="translate(580, 200)" filter="url(#shadow)">
      <circle cx="80" cy="80" r="70" fill="url(#acrylic-clear)" stroke="#93C5FD" stroke-width="1"/>
      <circle cx="80" cy="80" r="55" fill="none" stroke="${BRAND.red}" stroke-width="1.5" opacity="0.6"/>
      <text x="80" y="70" font-family="Georgia,serif" font-size="10" font-weight="bold" fill="${BRAND.black}" text-anchor="middle" opacity="0.8">EMPLOYEE</text>
      <text x="80" y="88" font-family="Georgia,serif" font-size="10" font-weight="bold" fill="${BRAND.black}" text-anchor="middle" opacity="0.8">OF THE YEAR</text>
      <text x="80" y="105" font-family="Georgia,serif" font-size="9" fill="${BRAND.gray}" text-anchor="middle">2026</text>
      <!-- Base -->
      <rect x="45" y="155" width="70" height="12" rx="3" fill="#374151"/>
      <rect x="35" y="165" width="90" height="20" rx="3" fill="${BRAND.black}"/>
    </g>
    <!-- Brand footer -->
    <rect x="0" y="${HEIGHT-60}" width="${WIDTH}" height="60" fill="${BRAND.black}" opacity="0.9"/>
    <text x="30" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.white}">SPEEDY</text>
    <text x="120" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="20" font-weight="bold" fill="${BRAND.red}">PRINT</text>
    <text x="${WIDTH-30}" y="${HEIGHT-28}" font-family="Arial,sans-serif" font-size="14" fill="${BRAND.gray}" text-anchor="end">Custom Acrylic Trophies</text>
  </svg>`
}

// --- Product Map ---
const products = [
  { slug: 'custom-labels', name: 'Custom Labels', svg: svgCustomLabels },
  { slug: 'vinyl-stickers', name: 'Vinyl Stickers', svg: svgVinylStickers },
  { slug: 'acrylic-signs', name: 'Acrylic Signs', svg: svgAcrylicSigns },
  { slug: 'wooden-plaques', name: 'Wooden Plaques', svg: svgWoodenPlaques },
  { slug: 'race-bibs', name: 'Race Bibs', svg: svgRaceBibs },
  { slug: 'event-tags', name: 'Event Tags', svg: svgEventTags },
  { slug: 'mtb-number-boards', name: 'MTB Number Boards', svg: svgMTBBoards },
  { slug: 'self-inking-stamps', name: 'Self-Inking Stamps', svg: svgSelfInkingStamps },
  { slug: 'coffee-cup-sleeves', name: 'Coffee Cup Sleeves', svg: svgCoffeeSleeves },
  { slug: 'award-trophies', name: 'Award Trophies', svg: svgAwardTrophies },
]

// --- Generate all images ---
async function main() {
  console.log('🎨 Generating SpeedyPrint product images...\n')

  for (const product of products) {
    const svgContent = product.svg()
    const outputPath = join(OUTPUT_DIR, `${product.slug}.png`)

    try {
      await sharp(Buffer.from(svgContent))
        .png({ quality: 90, compressionLevel: 6 })
        .toFile(outputPath)

      console.log(`  ✅ ${product.name} → ${product.slug}.png`)
    } catch (err) {
      console.error(`  ❌ ${product.name} failed:`, err.message)
    }
  }

  console.log(`\n🎉 Done! Generated ${products.length} images in public/images/products/`)

  // Also generate a SpeedyPrint logo
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
    <rect width="200" height="60" rx="6" fill="${BRAND.black}"/>
    <text x="15" y="40" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="${BRAND.white}">SPEEDY</text>
    <text x="125" y="40" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="${BRAND.red}">PRINT</text>
  </svg>`

  const logoOutputDir = join(OUTPUT_DIR, '..')
  await sharp(Buffer.from(logoSvg))
    .png({ quality: 90 })
    .toFile(join(logoOutputDir, 'logo.png'))

  // Logo on white background
  const logoWhiteSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
    <rect width="200" height="60" rx="6" fill="${BRAND.white}"/>
    <text x="15" y="40" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="${BRAND.black}">SPEEDY</text>
    <text x="125" y="40" font-family="Arial,sans-serif" font-size="28" font-weight="bold" fill="${BRAND.red}">PRINT</text>
  </svg>`
  await sharp(Buffer.from(logoWhiteSvg))
    .png({ quality: 90 })
    .toFile(join(logoOutputDir, 'logo-white.png'))

  console.log('  ✅ Logo variants generated')
}

main().catch(console.error)
