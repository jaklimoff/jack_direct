import manifest from './image-manifest.json'

// Written by scripts/optimize-images.mjs
export interface ImageInfo {
  width: number
  height: number
  webp: string
}

const images: Record<string, ImageInfo> = manifest

/** Size and WebP copy for a local image path like /content/images/x.png */
export function getImageInfo(src: string | undefined): ImageInfo | undefined {
  if (!src) return undefined
  const path = src.startsWith('http') ? safePathname(src) : src
  return path ? images[path] : undefined
}

function safePathname(url: string): string | undefined {
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'jack.direct' ? parsed.pathname : undefined
  } catch {
    return undefined
  }
}
