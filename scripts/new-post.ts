#!/usr/bin/env npx tsx

/**
 * Create a new blog post with proper frontmatter and image directory.
 *
 * Usage:
 *   npm run new-post "Your Post Title"
 *   npm run new-post "Your Post Title" -- --draft --featured --tags rust,programming
 *   npm run new-post "Your Post Title" -- --subpost-of parent-slug
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const BLOG_DIR = join(import.meta.dirname, '..', 'src', 'content', 'blog')
const IMAGES_DIR = join(import.meta.dirname, '..', 'public', 'content', 'images')

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseArgs(rawArgs: string[]) {
  const args = rawArgs.filter((a) => a !== '--')
  const title = args.find((a) => !a.startsWith('--'))
  if (!title) {
    console.error('Usage: npm run new-post "Your Post Title"')
    console.error('Options:')
    console.error('  --draft           Mark as draft (hidden from listings)')
    console.error('  --featured        Show in featured section on homepage')
    console.error('  --tags a,b,c      Comma-separated tags')
    console.error('  --subpost-of slug Create as subpost of existing post')
    process.exit(1)
  }

  const flags = {
    title,
    draft: args.includes('--draft'),
    featured: args.includes('--featured'),
    tags: [] as string[],
    subpostOf: null as string | null,
  }

  const tagsIdx = args.indexOf('--tags')
  if (tagsIdx !== -1 && args[tagsIdx + 1]) {
    flags.tags = args[tagsIdx + 1].split(',').map((t) => t.trim())
  }

  const subpostIdx = args.indexOf('--subpost-of')
  if (subpostIdx !== -1 && args[subpostIdx + 1]) {
    flags.subpostOf = args[subpostIdx + 1]
  }

  return flags
}

function buildFrontmatter(flags: ReturnType<typeof parseArgs>): string {
  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const slug = slugify(flags.title)
  const imagePath = `/content/images/${year}/${month}/${slug}.png`

  const lines: string[] = [
    '---',
    `title: "${flags.title}"`,
    `description: ""`,
    `date: ${date}`,
    `image: ${imagePath}`,
    'authors:',
    '  - jack-klimov',
  ]

  if (flags.tags.length > 0) {
    lines.push('tags:')
    flags.tags.forEach((tag) => lines.push(`  - ${tag}`))
  } else {
    lines.push('tags: []')
  }

  if (flags.draft) lines.push('draft: true')
  if (flags.featured) lines.push('featured: true')
  if (flags.subpostOf) lines.push('order: 1')

  lines.push('---', '')

  return lines.join('\n')
}

function buildBody(): string {
  return `
Write your introduction here.

## Section Title

Your content here.
`.trimStart()
}

function main() {
  const args = process.argv.slice(2)
  const flags = parseArgs(args)
  const slug = slugify(flags.title)
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  // Determine file path
  let filePath: string
  if (flags.subpostOf) {
    const subpostDir = join(BLOG_DIR, flags.subpostOf)
    if (!existsSync(subpostDir)) {
      mkdirSync(subpostDir, { recursive: true })
    }
    filePath = join(subpostDir, `${slug}.mdx`)
  } else {
    filePath = join(BLOG_DIR, `${slug}.mdx`)
  }

  if (existsSync(filePath)) {
    console.error(`Error: Post already exists at ${filePath}`)
    process.exit(1)
  }

  // Create image directory
  const imageDir = join(IMAGES_DIR, String(year), month)
  if (!existsSync(imageDir)) {
    mkdirSync(imageDir, { recursive: true })
  }

  // Write post file
  const content = buildFrontmatter(flags) + buildBody()
  writeFileSync(filePath, content, 'utf-8')

  const relativePath = filePath.replace(
    join(import.meta.dirname, '..') + '/',
    '',
  )
  const relativeImageDir = imageDir.replace(
    join(import.meta.dirname, '..') + '/',
    '',
  )

  console.log(`\nCreated: ${relativePath}`)
  console.log(`Images:  ${relativeImageDir}/`)
  console.log(`URL:     /blog/${flags.subpostOf ? flags.subpostOf + '/' : ''}${slug}`)
  if (flags.draft) console.log(`Status:  draft (won't appear in listings)`)
  console.log(`\nNext steps:`)
  console.log(`  1. Fill in the description in frontmatter`)
  console.log(`  2. Drop a cover image in ${relativeImageDir}/${slug}.png`)
  console.log(`  3. Write your post`)
  console.log(`  4. Remove "draft: true" when ready to publish`)
}

main()
