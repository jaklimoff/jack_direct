// Render G2 post covers to PNG (1200x630) for social previews.
//
// Needs the dev server running (npm run dev), then:
//   node scripts/render-covers.mjs [post-id ...]
//
// Env: BASE_URL (default http://localhost:1234), THEME (dark|light, default dark),
//      SCALE (device pixel ratio, default 2), CHROME (custom Chromium binary),
//      BARE=1: the cover as the post page shows it (no text) to
//      public/content/images/covers/_preview/<id>-hero.png, gitignored, for the
//      jack_direct dashboard; the site itself draws it as HTML.
import { mkdirSync, readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const base = process.env.BASE_URL ?? 'http://localhost:1234'
const theme = process.env.THEME ?? 'dark'
const scale = Number(process.env.SCALE ?? 2)
const bare = process.env.BARE === '1'
const outDir = new URL(
  bare ? '../public/content/images/covers/_preview/' : '../public/content/images/covers/',
  import.meta.url,
)

const source = readFileSync(
  new URL('../src/lib/covers.ts', import.meta.url),
  'utf8',
)
const allIds = [...source.matchAll(/^  '([a-z0-9-]+)': \{$/gm)].map((m) => m[1])
const ids = process.argv.slice(2).length ? process.argv.slice(2) : allIds

mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch(
  process.env.CHROME ? { executablePath: process.env.CHROME } : {},
)
const page = await browser.newPage({
  viewport: { width: 1200, height: bare ? 500 : 630 },
  deviceScaleFactor: scale,
})

for (const id of ids) {
  const url = `${base}/covers/${id}${bare ? '--bare' : ''}?theme=${theme}`
  await page.goto(url, { waitUntil: 'networkidle' })
  // Fonts use font-display: optional, so load twice to render with Geist
  await page.reload({ waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const cover = page.locator('.cv').first()
  const file = new URL(bare ? `${id}-hero.png` : `${id}.png`, outDir)
  await cover.screenshot({ path: file.pathname })
  console.log(`✓ ${id}`)
}

await browser.close()
