/**
 * TEMPORARY TEST ROUTE — remove before going to production
 * GET /api/courier/gobob/test
 * Tests the Bob Go sandbox API key and rates-at-checkout endpoint.
 */
import { NextResponse } from 'next/server'
import { getBobGoRates, getWarehouseAddress } from '@/lib/gobob/client'

export async function GET() {
  try {
    const rates = await getBobGoRates({
      collection_address: getWarehouseAddress(),
      delivery_address: {
        street_address: '1 Adderley Street',
        local_area: 'Cape Town City Centre',
        city: 'Cape Town',
        zone: 'Western Cape',
        country: 'ZA',
        code: '8001',
      },
      items: [
        {
          description: 'Printed stickers (test)',
          price: 200,
          quantity: 1,
          length_cm: 20,
          width_cm: 15,
          height_cm: 5,
          weight_kg: 1,
        },
      ],
      declared_value: 200,
      handling_time: 1,
    })

    return NextResponse.json({ success: true, ratesCount: rates.length, rates })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
