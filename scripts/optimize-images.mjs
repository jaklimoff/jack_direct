#!/usr/bin/env node

/**
 * Make WebP copies of every local image the site shows, and record sizes.
 *
 * Usage:
 *   node scripts/optimize-images.mjs
 *
 * For each image referenced by a post (frontmatter `image` or a markdown
 * image in the body) it writes a WebP next to the original, capped at
 * MAX_WIDTH. Originals stay untouched: they are still used for og:image,
 * where PNG/JPEG is the safest format for social previews.
 *
 * Sizes go to src/lib/image-manifest.json, which the site reads to add
 * width/height to <img> tags and og:image. Runs before every build and
 * skips images whose WebP is already up to date.
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

// sharp ships with Astro (its default image service), so borrow Astro's copy
const require = createRequire(import.meta.url)
const sharp = createRequire(require.resolve('astro/package.json'))('sharp')

const ROOT = join(import.meta.dirname, '..')
const PUBLIC = join(ROOT, 'public')
const BLOG_DIR = join(ROOT, 'src/content/blog')
const MANIFEST = join(ROOT, 'src/lib/image-manifest.json')
const MAX_WIDTH = 1920
const QUALITY = 80

// Small fixed-size copies for places that show an image tiny
const VARIANTS = [{ src: '/avatar.png', out: '/avatar-256.webp', width: 256 }]

const RASTER = /\.(png|jpe?g|gif)$/i

function referencedImages() {
  const paths = new Set()
  for (const file of readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f))) {
    const text = readFileSync(join(BLOG_DIR, file), 'utf8')
    const cover = text.match(/^image:\s*['"]?(\/[^'"\s]+)/m)?.[1]
    if (cover) paths.add(cover)
    for (const m of text.matchAll(/!\[[^\]]*\]\((\/[^)\s]+)/g)) paths.add(m[1])
  }
  return [...paths].filter((p) => RASTER.test(p) && existsSync(join(PUBLIC, p)))
}

const isFresh = (src, out) =>
  existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs

async function toWebp(srcPath, outPath, width) {
  const animated = /\.gif$/i.test(srcPath)
  await sharp(srcPath, { animated })
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 5 })
    .toFile(outPath)
}

const manifest = {}
let written = 0

for (const path of referencedImages()) {
  const src = join(PUBLIC, path)
  const webpPath = path.replace(RASTER, '.webp')
  const out = join(PUBLIC, webpPath)
  if (!isFresh(src, out)) {
    await toWebp(src, out, MAX_WIDTH)
    written++
  }
  const { width, height, pageHeight } = await sharp(src).metadata()
  manifest[path] = { width, height: pageHeight ?? height, webp: webpPath }
}

for (const { src, out, width } of VARIANTS) {
  const srcPath = join(PUBLIC, src)
  const outPath = join(PUBLIC, out)
  if (!isFresh(srcPath, outPath)) {
    await toWebp(srcPath, outPath, width)
    written++
  }
}

const sorted = Object.fromEntries(
  Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
)
writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + '\n')
console.log(
  `Images: ${Object.keys(sorted).length} tracked, ${written} WebP file(s) written`,
)
