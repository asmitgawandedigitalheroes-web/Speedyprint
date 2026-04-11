import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getGoBobQuotes,
  buildGoBobDeliveryAddress,
  getCollectionAddress,
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
    const collectionAddress = getCollectionAddress()
    const deliveryAddress = buildGoBobDeliveryAddress(shippingAddress)

    const quotes = await getGoBobQuotes({
      collection_address: collectionAddress,
      delivery_address: deliveryAddress,
      parcels: [
        {
          // ⚠️ PLACEHOLDER: Derive weight/dimensions from cart items in a future phase
          weight_kg: 1,
          length_cm: 20,
          width_cm: 15,
          height_cm: 5,
          description: 'Printed stickers and labels',
          value: cartSubtotal ?? 0,
        },
      ],
    })

    return NextResponse.json({ quotes })
  } catch (err: any) {
    console.error('GoBob quote error:', err)
    // Fallback to flat rate if GoBob API is unavailable
    return NextResponse.json({
      quotes: [],
      fallback: true,
      fallbackRate: FLAT_SHIPPING_RATE,
    })
  }
}
