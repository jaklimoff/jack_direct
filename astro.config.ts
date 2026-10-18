import { existsSync, readFileSync, readdirSync } from 'node:fs'

import { defineConfig } from 'astro/config'

import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'

import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import expressiveCode from 'astro-expressive-code'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkEmoji from 'remark-emoji'
import remarkMath from 'remark-math'
import { rehypeOptimizedImages } from './src/lib/rehype-optimized-images'

import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'

import tailwindcss from '@tailwindcss/vite'

// Machine-specific dev hosts live in the gitignored .env, e.g.
// DEV_ALLOWED_HOSTS=myhost.local,other.local
const envFile = new URL('./.env', import.meta.url)
const devAllowedHosts = (
  process.env.DEV_ALLOWED_HOSTS ??
  (existsSync(envFile)
    ? readFileSync(envFile, 'utf8').match(/^DEV_ALLOWED_HOSTS=(.*)$/m)?.[1]
    : undefined) ??
  ''
)
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean)

const blogDir = new URL('./src/content/blog/', import.meta.url)
const blogSlugs = readdirSync(blogDir)
  .filter((file) => file.endsWith('.mdx'))
  .map((file) => file.replace(/\.mdx$/, ''))

// Sitemap lastmod per post: `updated` when set, else the publish date
const frontmatterDate = (text: string, key: string) => {
  const value = text.match(new RegExp(`^${key}:\\s*['"]?([0-9T:.Z+-]+)`, 'm'))?.[1]
  return value ? new Date(value) : undefined
}
const postLastmod = new Map(
  blogSlugs.map((slug) => {
    const text = readFileSync(new URL(`${slug}.mdx`, blogDir), 'utf8')
    const date = frontmatterDate(text, 'updated') ?? frontmatterDate(text, 'date')
    return [`https://jack.direct/blog/${slug}/`, date]
  }),
)
const newestPost = new Date(
  Math.max(...[...postLastmod.values()].map((date) => date?.getTime() ?? 0)),
)

// Legacy Ghost URLs: posts lived at the site root, plus a few renamed slugs
const legacyRedirects: Record<string, string> = {
  ...Object.fromEntries(
    blogSlugs.map((slug) => [`/${slug}`, `/blog/${slug}/`]),
  ),
  '/cap-theorem-for-developers-what-it-is-and-how-it-affects-distributed-systems':
    '/blog/cap-theorem-for-developers/',
  '/reflections-on-kotters-8-step-change-model-a-practical-guide-for-navigating-transformation':
    '/blog/reflections-on-kotters-8-step-change-model/',
  // Renamed so the slug carries the search keyword
  '/blog/the-warning-my-agent-gave-that-i-never-saw':
    '/blog/claude-code-mod-open-questions/',
  '/the-warning-my-agent-gave-that-i-never-saw':
    '/blog/claude-code-mod-open-questions/',
  '/author/jack': '/about/',
  '/author/jack/page/2': '/about/',
  '/author/jaklimoff': '/about/',
  '/page/2': '/blog/2/',
  '/page/3': '/blog/2/',
  // Thin pragma post merged into the variable types guide
  '/mastering-solidity-pragma-6-ways-to-specify-compiler-versions':
    '/blog/understanding-variable-types-in-solidity/#how-do-you-pin-the-solidity-compiler-version-with-pragma',
  '/blog/mastering-solidity-pragma-6-ways-to-specify-compiler-versions':
    '/blog/understanding-variable-types-in-solidity/#how-do-you-pin-the-solidity-compiler-version-with-pragma',
}

const redirectPaths = new Set(
  Object.keys(legacyRedirects).map((path) => `https://jack.direct${path}/`),
)

// Tag and author pages are noindex, so they stay out of the sitemap too
const noindexSections = ['https://jack.direct/tags/', 'https://jack.direct/authors/']

export default defineConfig({
  site: 'https://jack.direct',
  redirects: legacyRedirects,
  // Static output for GitHub Pages
  integrations: [
    expressiveCode({
      themes: ['github-light', 'github-dark'],
      plugins: [pluginCollapsibleSections(), pluginLineNumbers()],
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme="${theme.name.split('-')[1]}"]`,
      defaultProps: {
        wrap: true,
        collapseStyle: 'collapsible-auto',
        overridesByLang: {
          'ansi,bat,bash,batch,cmd,console,powershell,ps,ps1,psd1,psm1,sh,shell,shellscript,shellsession,text,zsh':
            {
              showLineNumbers: false,
            },
        },
      },
      styleOverrides: {
        codeFontSize: '0.75rem',
        borderColor: 'var(--border)',
        codeFontFamily: 'var(--font-mono)',
        codeBackground:
          'color-mix(in oklab, var(--muted) 25%, transparent)',
        frames: {
          editorActiveTabForeground: 'var(--muted-foreground)',
          editorActiveTabBackground:
            'color-mix(in oklab, var(--muted) 25%, transparent)',
          editorActiveTabIndicatorBottomColor: 'transparent',
          editorActiveTabIndicatorTopColor: 'transparent',
          editorTabBorderRadius: '0',
          editorTabBarBackground: 'transparent',
          editorTabBarBorderBottomColor: 'transparent',
          frameBoxShadowCssValue: 'none',
          terminalBackground:
            'color-mix(in oklab, var(--muted) 25%, transparent)',
          terminalTitlebarBackground: 'transparent',
          terminalTitlebarBorderBottomColor: 'transparent',
          terminalTitlebarForeground: 'var(--muted-foreground)',
        },
        lineNumbers: {
          foreground: 'var(--muted-foreground)',
        },
        uiFontFamily: 'var(--font-sans)',
      },
    }),
    mdx(),
    react(),
    sitemap({
      filter: (page) =>
        !redirectPaths.has(page) &&
        !noindexSections.some((section) => page.startsWith(section)),
      serialize: (item) => {
        const listing =
          item.url === 'https://jack.direct/' ||
          item.url === 'https://jack.direct/blog/'
        const lastmod = listing ? newestPost : postLastmod.get(item.url)
        return lastmod ? { ...item, lastmod: lastmod.toISOString() } : item
      },
    }),
    icon(),
  ],
  vite: {
    // Type assertion needed due to Vite plugin type incompatibility between Astro and @tailwindcss/vite
    // This is the recommended approach per Astro documentation for Vite plugins
    plugins: [tailwindcss() as any],
  },
  server: {
    port: 1234,
    host: true,
    allowedHosts: devAllowedHosts,
  },
  devToolbar: {
    enabled: false,
  },
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: ['noreferrer', 'noopener'],
        },
      ],
      rehypeOptimizedImages,
      rehypeHeadingIds,
      rehypeKatex,
      [
        rehypePrettyCode,
        {
          theme: {
            light: 'github-light',
            dark: 'github-dark',
          },
        },
      ],
    ],
    remarkPlugins: [remarkMath, remarkEmoji],
  },
})
