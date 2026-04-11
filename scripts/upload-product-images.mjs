/**
 * Uploads product images from public/images/products/ to Supabase storage
 * and sets image_url on each matching product_groups row.
 *
 * Run: node scripts/upload-product-images.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const SUPABASE_URL = 'https://atqjywawohnhvlnggozu.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0cWp5d2F3b2huaHZsbmdnb3p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY2NjM3MywiZXhwIjoyMDg5MjQyMzczfQ.xjpO4D-fQUeNJf3Vs2D8lnH_XcTjE0iRa7SjLu6vsgI'

const BUCKET = 'products'
const FOLDER = 'product-groups'

// Image filename → product slug mapping
const IMAGE_PRODUCT_MAP = [
  { file: 'acrylic-signs.png',       slug: 'acrylic-signs' },
  { file: 'award-trophies.png',      slug: 'award-trophies' },
  { file: 'coffee-cup-sleeves.png',  slug: 'coffee-cup-sleeves' },
  { file: 'custom-labels.png',       slug: 'custom-labels' },
  { file: 'event-tags.png',          slug: 'event-tags' },
  { file: 'mtb-number-boards.png',   slug: 'mtb-number-boards' },
  { file: 'race-bibs.png',           slug: 'race-bibs' },
  { file: 'self-inking-stamps.png',  slug: 'self-inking-stamps' },
  { file: 'vinyl-stickers.png',      slug: 'vinyl-stickers' },
  { file: 'wooden-plaques.png',      slug: 'wooden-plaques' },
]

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function main() {
  console.log('🚀 Starting product image upload...\n')

  let successCount = 0
  let errorCount = 0

  for (const { file, slug } of IMAGE_PRODUCT_MAP) {
    const localPath = resolve(ROOT, 'public', 'images', 'products', file)
    const storagePath = `${FOLDER}/${file}`

    console.log(`📤 Uploading ${file}...`)

    // Read local file
    let fileBuffer
    try {
      fileBuffer = readFileSync(localPath)
    } catch {
      console.error(`   ❌ File not found: ${localPath}`)
      errorCount++
      continue
    }

    // Upload to Supabase storage (upsert to overwrite if exists)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error(`   ❌ Upload failed: ${uploadError.message}`)
      errorCount++
      continue
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath)

    const publicUrl = urlData.publicUrl
    console.log(`   ✅ Uploaded → ${publicUrl}`)

    // Update product_groups row
    const { data: updated, error: dbError } = await supabase
      .from('product_groups')
      .update({ image_url: publicUrl })
      .eq('slug', slug)
      .select('id, name, slug')

    if (dbError) {
      console.error(`   ❌ DB update failed for slug "${slug}": ${dbError.message}`)
      errorCount++
      continue
    }

    if (!updated || updated.length === 0) {
      console.warn(`   ⚠️  No product found with slug "${slug}" — image uploaded but DB not updated`)
    } else {
      console.log(`   ✅ DB updated → "${updated[0].name}" (${updated[0].id})`)
      successCount++
    }

    console.log()
  }

  console.log('─'.repeat(50))
  console.log(`✅ Done! ${successCount} products updated, ${errorCount} errors`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
