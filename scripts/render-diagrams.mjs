#!/usr/bin/env node

/**
 * Render the ```mermaid blocks in blog posts to images, before a build.
 *
 * Usage:
 *   pnpm diagrams            render new or changed diagrams
 *   pnpm diagrams --force    render all of them again
 *
 * A block in a post looks like this (alt is required, caption is optional):
 *
 *   ```mermaid alt="What the diagram shows, for screen readers" caption="Shown under it"
 *   flowchart LR
 *     A --> B
 *   ```
 *
 * For each block it writes to public/content/diagrams/:
 *   <key>-light.svg, <key>-dark.svg   shown on the site, one per theme
 *   <key>.png                         light on white, 2x, for Medium and LinkedIn
 * <key> is a hash of the diagram text, so editing a diagram makes new files.
 * Sizes go to src/lib/diagram-manifest.json; src/lib/remark-mermaid.ts reads
 * it and swaps each block for the images. The build fails on a block that
 * was not rendered, so commit the files this writes.
 *
 * Colors and font live in scripts/diagram-theme.json; changing it, or the
 * mermaid version, renders everything again. Files no post uses are deleted.
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const ROOT = join(import.meta.dirname, '..')
const BLOG_DIR = join(ROOT, 'src/content/blog')
const OUT = join(ROOT, 'public/content/diagrams')
const MANIFEST = join(ROOT, 'src/lib/diagram-manifest.json')
const MERMAID_DIR = join(ROOT, 'node_modules/mermaid')
const THEME = JSON.parse(readFileSync(join(import.meta.dirname, 'diagram-theme.json'), 'utf8'))
// Bump to force a re-render after changing how this script draws
const REVISION = 1

const sha = (text) => createHash('sha256').update(text).digest('hex').slice(0, 12)
// Keep in sync with diagramKey() in src/lib/remark-mermaid.ts
const diagramKey = (source) => sha(source.trim())

const version = JSON.parse(readFileSync(join(MERMAID_DIR, 'package.json'), 'utf8')).version
const stamp = sha(`${version}\n${JSON.stringify(THEME)}\n${REVISION}`)
const force = process.argv.includes('--force')

/** Every mermaid block in every post: key -> { source, posts } */
function findDiagrams() {
  const found = new Map()
  for (const file of readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'))) {
    const text = readFileSync(join(BLOG_DIR, file), 'utf8')
    for (const m of text.matchAll(/^```mermaid([^\n]*)\n([\s\S]*?)\n```[ \t]*$/gm)) {
      if (!/\balt="[^"]+"/.test(m[1])) {
        throw new Error(`${file}: a mermaid block needs alt="..." after \`\`\`mermaid`)
      }
      const key = diagramKey(m[2])
      const entry = found.get(key) ?? { source: m[2], posts: [] }
      entry.posts.push(file.replace(/\.mdx$/, ''))
      found.set(key, entry)
    }
  }
  return found
}

/** Give the SVG a fixed size instead of width="100%", so an <img> knows it. */
function sized(svg) {
  const box = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/)
  if (!box) throw new Error('rendered SVG has no viewBox')
  const width = Math.ceil(Number(box[3]))
  const height = Math.ceil(Number(box[4]))
  const out = svg
    .replace(/^<svg([^>]*?) width="[^"]*"/, '<svg$1')
    .replace(/^<svg([^>]*?) style="[^"]*"/, '<svg$1')
    .replace(/^<svg/, `<svg width="${width}" height="${height}"`)
  return { svg: out, width, height }
}

const old = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { stamp: '', diagrams: {} }
const diagrams = findDiagrams()
const manifest = { stamp, mermaid: version, diagrams: {} }
const todo = []
for (const [key, { source, posts }] of diagrams) {
  const files = ['light.svg', 'dark.svg'].map((s) => join(OUT, `${key}-${s}`)).concat(join(OUT, `${key}.png`))
  const fresh = !force && old.stamp === stamp && old.diagrams[key] && files.every((f) => existsSync(f))
  if (fresh) manifest.diagrams[key] = { ...old.diagrams[key], posts }
  else todo.push({ key, source, posts })
}

mkdirSync(OUT, { recursive: true })
if (todo.length) {
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {})
  const page = await browser.newPage({ deviceScaleFactor: 2 })
  await page.setContent('<!doctype html><html><body></body></html>')
  await page.addScriptTag({ path: join(MERMAID_DIR, 'dist/mermaid.min.js') })

  for (const { key, source, posts } of todo) {
    const out = {}
    for (const variant of ['light', 'dark']) {
      const config = { ...THEME.config, startOnLoad: false, themeVariables: THEME[variant] }
      const result = await page.evaluate(
        async ({ source, config, id }) => {
          try {
            window.mermaid.initialize(config)
            return { svg: (await window.mermaid.render(id, source)).svg }
          } catch (err) {
            return { error: String(err?.message ?? err) }
          }
        },
        { source, config, id: `d${key}${variant}` },
      )
      if (result.error) {
        await browser.close()
        throw new Error(`${posts.join(', ')}: mermaid failed on "${source.split('\n')[0]}": ${result.error}`)
      }
      out[variant] = sized(result.svg)
      writeFileSync(join(OUT, `${key}-${variant}.svg`), out[variant].svg)
    }

    // PNG for Medium and LinkedIn: light, on white, with some air around it
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:#fff"><div id="d" style="display:inline-block;padding:24px;background:#fff">${out.light.svg}</div></body></html>`,
    )
    await page.locator('#d').screenshot({ path: join(OUT, `${key}.png`) })
    await page.setContent('<!doctype html><html><body></body></html>')
    await page.addScriptTag({ path: join(MERMAID_DIR, 'dist/mermaid.min.js') })

    manifest.diagrams[key] = { width: out.light.width, height: out.light.height, posts }
    console.log(`rendered ${key} (${posts.join(', ')})`)
  }
  await browser.close()
}

// Delete files no post uses any more
for (const file of readdirSync(OUT)) {
  const key = file.match(/^([0-9a-f]{12})(-light\.svg|-dark\.svg|\.png)$/)?.[1]
  if (key && !diagrams.has(key)) {
    rmSync(join(OUT, file))
    console.log(`deleted ${file}`)
  }
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
console.log(`${diagrams.size} diagrams, ${todo.length} rendered`)
