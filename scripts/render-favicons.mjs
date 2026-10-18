// Render favicon PNGs and favicon.ico from public/favicon.svg.
//
//   node scripts/render-favicons.mjs
//
// Env: CHROME (custom Chromium binary).
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const publicDir = new URL('../public/', import.meta.url)
const svg = readFileSync(new URL('favicon.svg', publicDir), 'utf8')
// Apple and maskable icons get cropped by the OS, so they need a full-bleed square
const squareSvg = svg.replace(/ rx="[\d.]+"/, '')

const targets = [
  { file: 'favicon-96x96.png', size: 96, svg },
  { file: 'apple-touch-icon.png', size: 180, svg: squareSvg },
  { file: 'web-app-manifest-192x192.png', size: 192, svg: squareSvg },
  { file: 'web-app-manifest-512x512.png', size: 512, svg: squareSvg },
]
const icoSizes = [16, 32, 48]

const browser = await chromium.launch(
  process.env.CHROME ? { executablePath: process.env.CHROME } : {},
)
const page = await browser.newPage()

async function render(source, size) {
  await page.setViewportSize({ width: size, height: size })
  const sized = source.replace(
    'width="64" height="64"',
    `width="${size}" height="${size}"`,
  )
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${sized}</body></html>`,
  )
  return page.screenshot({ omitBackground: true })
}

for (const { file, size, svg: source } of targets) {
  writeFileSync(new URL(file, publicDir), await render(source, size))
  console.log(`✓ ${file}`)
}

// ICO with embedded PNGs (supported by every current browser)
const pngs = []
for (const size of icoSizes) pngs.push(await render(svg, size))
const header = Buffer.alloc(6 + 16 * pngs.length)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(pngs.length, 4)
let offset = header.length
pngs.forEach((png, i) => {
  const entry = 6 + 16 * i
  header.writeUInt8(icoSizes[i], entry)
  header.writeUInt8(icoSizes[i], entry + 1)
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(png.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += png.length
})
writeFileSync(new URL('favicon.ico', publicDir), Buffer.concat([header, ...pngs]))
console.log(`✓ favicon.ico (${icoSizes.join(', ')})`)

await browser.close()
