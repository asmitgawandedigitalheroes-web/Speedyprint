'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCart } from '@/hooks/useCart'
import {
  MATERIALS,
  FINISHES,
  ADHESION_TYPES,
  SHAPES,
  CURRENCY_SYMBOL,
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  DIVISIONS,
  VAT_RATE,
} from '@/lib/utils/constants'
import {
  calculateQuickPrice,
  type QuickPriceInput,
} from '@/lib/pricing/quick-calculator'

interface QuickOrderFormProps {
  division?: string
  initialWidth?: number
  initialHeight?: number
  initialQuantity?: number
  initialMaterial?: string
  initialDoming?: boolean
}

export function QuickOrderForm({
  division = 'labels',
  initialWidth = 100,
  initialHeight = 100,
  initialQuantity = 100,
  initialMaterial = 'white-vinyl',
  initialDoming = false,
}: QuickOrderFormProps) {
  const router = useRouter()
  const addItem = useCart((s) => s.addItem)

  const activeDivision = useMemo(() => 
    DIVISIONS.find(d => d.key === division) || DIVISIONS[0],
    [division]
  )

  const [width, setWidth] = useState(initialWidth)
  const [height, setHeight] = useState(initialHeight)
  const [quantity, setQuantity] = useState(initialQuantity)
  const [material, setMaterial] = useState(initialMaterial)
  const [finish, setFinish] = useState('gloss')
  const [adhesion, setAdhesion] = useState('standard')
  const [shape, setShape] = useState('standard')
  const [doming3d, setDoming3d] = useState(initialDoming)
  const [artworkFile, setArtworkFile] = useState<File | null>(null)
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null)

  const priceInput: QuickPriceInput = useMemo(
    () => ({
      widthMm: width,
      heightMm: height,
      quantity,
      material,
      finish,
      adhesion,
      shape,
      doming3d,
    }),
    [width, height, quantity, material, finish, adhesion, shape, doming3d]
  )

  const price = useMemo(() => calculateQuickPrice(priceInput), [priceInput])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        toast.error('Please upload a PNG, JPEG, or SVG file')
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error('File is too large. Maximum size is 50MB')
        return
      }

      setArtworkFile(file)

      // Preview
      const reader = new FileReader()
      reader.onload = (ev) => setArtworkPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    },
    []
  )

  const removeArtwork = () => {
    setArtworkFile(null)
    setArtworkPreview(null)
  }

  const handleAddToCart = () => {
    const materialLabel =
      MATERIALS.find((m) => m.value === material)?.label ?? material

    const productName = activeDivision.name

    addItem({
      product_group_id: `quick-order-${division}`,
      product_template_id: 'quick-order',
      product_name: `${productName} (${width}x${height}mm)`,
      template_name: `${materialLabel} - Qty ${quantity}`,
      quantity,
      unit_price: price.unitPrice,
      selected_params: {
        division,
        width,
        height,
        material,
        finish,
        adhesion,
        shape,
        doming3d,
      },
    })

    toast.success('Added to cart!')
    router.push('/cart')
  }

  const isStickerLabel = division === 'labels' || division === 'mtb-boards'
  const showDoming = division === 'labels'
  const showAdhesion = division === 'labels'

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Form */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-heading text-2xl font-black tracking-tight text-brand-text sm:text-3xl">
            Configure Your {activeDivision.name}
          </h2>

          <div className="mt-6 space-y-6">
            {/* Size */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-text-muted">
                Dimensions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="order-width">Width (mm)</Label>
                  <Input
                    id="order-width"
                    type="number"
                    min={10}
                    max={2000}
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value) || 10)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="order-height">Height (mm)</Label>
                  <Input
                    id="order-height"
                    type="number"
                    min={10}
                    max={2000}
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value) || 10)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <Label htmlFor="order-qty">Quantity</Label>
              <Input
                id="order-qty"
                type="number"
                min={1}
                max={100000}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                className="mt-1"
              />
              {(() => {
                const discountItem = price.breakdown.find(item => item.label.includes('Volume discount'))
                const discountPercent = discountItem ? Math.round((1 - (discountItem.value)) * 100) : 0
                return discountPercent > 0 ? (
                  <p className="mt-1 text-xs font-semibold text-brand-primary animate-in fade-in slide-in-from-top-1 duration-300">
                    {discountPercent}% Bulk Discount Applied!
                  </p>
                ) : null
              })()}
            </div>

            {/* Material & Finish */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>{division === 'labels' ? 'Material / Vinyl' : 'Material'}</Label>
                <Select value={material} onValueChange={setMaterial}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIALS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                        {m.multiplier > 1 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (+{Math.round((m.multiplier - 1) * 100)}%)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Finish</Label>
                <Select value={finish} onValueChange={setFinish}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FINISHES.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Adhesion & Shape */}
            <div className={`grid grid-cols-1 gap-4 ${showAdhesion ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
              {showAdhesion && (
                <div>
                  <Label>Adhesion</Label>
                  <Select value={adhesion} onValueChange={setAdhesion}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ADHESION_TYPES.map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Shape / Cut</Label>
                <Select value={shape} onValueChange={setShape}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHAPES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 3D Doming */}
            {showDoming && (
              <div className="rounded-lg border bg-brand-bg p-4">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={doming3d}
                    onChange={(e) => setDoming3d(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <div>
                    <span className="font-medium text-brand-text">
                      Add 3D Doming
                    </span>
                    <p className="text-sm text-brand-text-muted">
                      Premium raised resin finish (+{CURRENCY_SYMBOL}3.50/unit)
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Artwork Upload */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-brand-text-muted">
                Artwork (Optional)
              </h3>
              {artworkPreview ? (
                <div className="space-y-1 mt-1">
                  <div className="relative inline-block group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={artworkPreview}
                      alt="Artwork preview"
                      className="h-32 rounded-lg border object-contain bg-white shadow-sm"
                    />
                    <button
                      onClick={removeArtwork}
                      className="absolute -right-2 -top-2 h-6 w-6 flex items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors z-10"
                      title="Remove artwork"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-brand-text-muted truncate max-w-[200px]" title={artworkFile?.name}>
                    {artworkFile?.name}
                  </p>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-brand-primary hover:bg-brand-primary/5">
                  <Upload className="h-8 w-8 text-brand-text-muted" />
                  <p className="mt-2 text-sm font-medium text-brand-text">
                    Drop your artwork here or click to upload
                  </p>
                  <p className="mt-1 text-xs text-brand-text-muted">
                    PNG, JPEG, SVG up to 50MB
                  </p>
                  <input
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Price Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="font-heading text-lg font-bold text-brand-text">
            {activeDivision.name.replace('Speedy ', '')} Summary
          </h3>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-muted">Dimensions</span>
              <span>{width} x {height}mm</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-text-muted">Quantity</span>
              <span>{quantity.toLocaleString()}</span>
            </div>

            {/* Price Breakdown Details */}
            <div className="border-t border-dashed pt-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-muted mb-2">Price Breakdown</p>
              {price.breakdown.filter(item => ['multiplier', 'surcharge', 'subtotal'].includes(item.type) && !['Subtotal', 'Total'].includes(item.label)).map((item, idx) => {
                const isBase = item.label.startsWith('Base price')
                return (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className={isBase ? "text-brand-text font-medium" : "text-brand-text-muted"}>
                      {item.label}
                    </span>
                    <span className="font-mono">
                      {item.type === 'multiplier' 
                        ? (item.value < 1 ? `-${Math.round((1-item.value)*100)}%` : `x${item.value.toFixed(2)}`)
                        : `${CURRENCY_SYMBOL}${item.value.toFixed(2)}`}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-brand-text">Unit Price</span>
                <span className="text-brand-primary">
                  {CURRENCY_SYMBOL}{price.unitPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-brand-text-muted">Subtotal</span>
                <span>
                  {CURRENCY_SYMBOL}{price.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-brand-text-muted">GST ({Math.round(VAT_RATE * 100)}%)</span>
                <span>
                  {CURRENCY_SYMBOL}{price.vat.toFixed(2)}
                </span>
              </div>
              {price.freeDelivery && (
                <div className="mt-1 flex justify-between text-sm">
                  <span className="text-brand-text-muted">Delivery</span>
                  <span className="font-medium text-brand-primary">FREE</span>
                </div>
              )}
            </div>

            <div className="border-t pt-3">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-brand-text">Total</span>
                <span className="text-2xl font-bold text-brand-primary">
                  {CURRENCY_SYMBOL}{price.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              onClick={handleAddToCart}
              className="w-full bg-brand-primary text-white hover:bg-brand-primary-dark"
              size="lg"
            >
              Add to Cart
            </Button>
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => router.push('/templates')}
            >
              Design Online Instead
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
