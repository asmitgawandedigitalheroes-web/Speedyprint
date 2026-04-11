/**
 * Uploads new gallery product images from public/images/products/gallery/
 * to Supabase storage and updates image_url on the matching product_groups row.
 *
 * Run: node scripts/upload-gallery-images.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { resolve, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const SUPABASE_URL = 'https://atqjywawohnhvlnggozu.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0cWp5d2F3b2huaHZsbmdnb3p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY2NjM3MywiZXhwIjoyMDg5MjQyMzczfQ.xjpO4D-fQUeNJf3Vs2D8lnH_XcTjE0iRa7SjLu6vsgI'

const BUCKET = 'products'
const GALLERY_ROOT = resolve(ROOT, 'public', 'images', 'products', 'gallery')

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function main() {
  console.log('🚀 Starting gallery image upload...\n')

  // Each subfolder name = product slug
  const productFolders = readdirSync(GALLERY_ROOT)

  for (const slug of productFolders) {
    const folderPath = resolve(GALLERY_ROOT, slug)
    const files = readdirSync(folderPath)

    console.log(`📂 Product: "${slug}" (${files.length} image${files.length !== 1 ? 's' : ''})`)

    const uploadedUrls = []

    for (const file of files) {
      const ext = extname(file).toLowerCase()
      const contentType = CONTENT_TYPES[ext] ?? 'image/jpeg'
      const storagePath = `product-groups/${slug}/${file}`
      const localPath = resolve(folderPath, file)

      let buffer
      try {
        buffer = readFileSync(localPath)
      } catch {
        console.error(`   ❌ Cannot read file: ${localPath}`)
        continue
      }

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType, upsert: true })

      if (uploadError) {
        console.error(`   ❌ Upload failed (${file}): ${uploadError.message}`)
        continue
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath)

      uploadedUrls.push(urlData.publicUrl)
      console.log(`   ✅ Uploaded: ${file}`)
    }

    if (uploadedUrls.length === 0) {
      console.warn(`   ⚠️  No images uploaded for "${slug}", skipping DB update\n`)
      continue
    }

    // Use the first uploaded image as the primary product image
    const primaryUrl = uploadedUrls[0]

    const { data: updated, error: dbError } = await supabase
      .from('product_groups')
      .update({ image_url: primaryUrl })
      .eq('slug', slug)
      .select('id, name, slug')

    if (dbError) {
      console.error(`   ❌ DB update failed: ${dbError.message}`)
    } else if (!updated || updated.length === 0) {
      console.warn(`   ⚠️  No product found with slug "${slug}" in DB`)
    } else {
      console.log(`   ✅ DB image_url set → "${updated[0].name}"`)
      console.log(`      Primary: ${primaryUrl}`)
    }

    console.log()
  }

  console.log('─'.repeat(60))
  console.log('✅ Done!')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
