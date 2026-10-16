#!/usr/bin/env node

/**
 * Notify IndexNow (Bing, Yandex, Seznam, ...) about pages changed by a push.
 *
 * Usage:
 *   node scripts/indexnow.mjs <before-sha> <after-sha>
 *
 * Only blog posts touched in the range are submitted. Template or config
 * changes affect every page, so those submit every post instead.
 */

import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const SITE = 'https://jack.direct'
const HOST = 'jack.direct'
const ROOT = join(import.meta.dirname, '..')
const BLOG_DIR = 'src/content/blog/'

const key = readdirSync(join(ROOT, 'public'))
  .map((file) => file.match(/^([0-9a-f]{32})\.txt$/)?.[1])
  .find(Boolean)
if (!key) throw new Error('No IndexNow key file found in public/')

const postUrl = (slug) => `${SITE}/blog/${slug}/`
const allPostUrls = () =>
  readdirSync(join(ROOT, BLOG_DIR))
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => postUrl(file.replace(/\.mdx$/, '')))

function changedFiles(before, after) {
  // A new branch or force push has no usable "before"; treat it as a full change
  if (!before || /^0+$/.test(before)) return null
  try {
    return execFileSync('git', ['diff', '--name-only', before, after], {
      cwd: ROOT,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)
  } catch {
    return null
  }
}

const [before, after = 'HEAD'] = process.argv.slice(2)
const files = changedFiles(before, after)
const touchesTemplates = (file) =>
  (file.startsWith('src/') && !file.startsWith(BLOG_DIR)) ||
  file.startsWith('astro.config')

let urls
if (!files || files.some(touchesTemplates)) {
  urls = allPostUrls()
} else {
  // Deleted posts are included on purpose: IndexNow wants removals too
  urls = files
    .filter((file) => file.startsWith(BLOG_DIR) && file.endsWith('.mdx'))
    .map((file) => postUrl(file.slice(BLOG_DIR.length).replace(/\.mdx$/, '')))
}

if (urls.length === 0) {
  console.log('IndexNow: no page changes, nothing to submit')
  process.exit(0)
}
urls.push(`${SITE}/`, `${SITE}/blog/`)

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: HOST,
    key,
    keyLocation: `${SITE}/${key}.txt`,
    urlList: urls,
  }),
})

console.log(`IndexNow: ${response.status} for ${urls.length} URLs`)
urls.forEach((url) => console.log(`  ${url}`))
// 200 = accepted, 202 = accepted pending key validation
if (!response.ok) process.exit(1)
