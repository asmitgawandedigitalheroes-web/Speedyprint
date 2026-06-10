export type ImageType =
  | 'product_main'
  | 'product_card'
  | 'category_banner'
  | 'hero_banner'
  | 'gallery'
  | 'thumbnail'
  | 'how_to'

export interface ImageSpec {
  width: number
  height: number
  ratio: string
  format: string
  label: string
}

export const IMAGE_SPECS: Record<ImageType, ImageSpec> = {
  product_main: {
    width: 1200,
    height: 1200,
    ratio: '1:1',
    format: 'WebP',
    label: 'Product main image',
  },
  product_card: {
    width: 800,
    height: 800,
    ratio: '1:1',
    format: 'WebP',
    label: 'Product card image',
  },
  category_banner: {
    width: 1600,
    height: 600,
    ratio: 'Wide',
    format: 'WebP',
    label: 'Category banner',
  },
  hero_banner: {
    width: 1920,
    height: 800,
    ratio: '16:9',
    format: 'WebP',
    label: 'Homepage hero banner',
  },
  gallery: {
    width: 1200,
    height: 1200,
    ratio: '1:1',
    format: 'WebP',
    label: 'Product gallery image',
  },
  thumbnail: {
    width: 400,
    height: 400,
    ratio: '1:1',
    format: 'WebP',
    label: 'Small thumbnail',
  },
  how_to: {
    width: 1200,
    height: 675,
    ratio: '16:9',
    format: 'WebP',
    label: 'How-to / process image',
  },
}
