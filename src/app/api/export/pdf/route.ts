import { NextRequest, NextResponse } from 'next/server'
import { generatePDF } from '@/lib/pdf/generator'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { canvas_json, print_specs } = body

    if (!canvas_json) {
      return NextResponse.json({ error: 'canvas_json is required' }, { status: 400 })
    }

    // Default print specs if not provided (use artboard dimensions)
    const specs = print_specs ?? {
      print_width_mm: 210,
      print_height_mm: 297,
      bleed_mm: 0,
    }

    const pdfBytes = await generatePDF(canvas_json, specs, {
      isProof: false,
      includeBleed: specs.bleed_mm > 0,
    })

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="design.pdf"',
      },
    })
  } catch (err) {
    console.error('PDF export failed:', err)
    return NextResponse.json(
      { error: 'PDF generation failed' },
      { status: 500 }
    )
  }
}
