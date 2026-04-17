import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getBobGoRates,
  buildBobGoDeliveryAddress,
  getWarehouseAddress,
} from '@/lib/gobob/client'
import { FLAT_SHIPPING_RATE } from '@/lib/utils/constants'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { shippingAddress, cartSubtotal } = await req.json()

  if (!shippingAddress) {
    return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 })
  }

  try {
    const collectionAddress = getWarehouseAddress()
    const deliveryAddress = buildBobGoDeliveryAddress(shippingAddress)

    const rates = await getBobGoRates({
      collection_address: collectionAddress,
      delivery_address: deliveryAddress,
      items: [
        {
          // ⚠️ PLACEHOLDER: Derive weight/dimensions from cart items in a future phase
          description: 'Printed stickers and labels',
          price: cartSubtotal ?? 0,
          quantity: 1,
          length_cm: 20,
          width_cm: 15,
          height_cm: 5,
          weight_kg: 1,
        },
      ],
      declared_value: cartSubtotal ?? 0,
      handling_time: 1, // 1 business day handling before dispatch
    })

    return NextResponse.json({ rates })
  } catch (err: any) {
    console.error('Bob Go quote error:', err)
    // Fallback to flat rate if Bob Go API is unavailable
    return NextResponse.json({
      rates: [],
      fallback: true,
      fallbackRate: FLAT_SHIPPING_RATE,
    })
  }
}
