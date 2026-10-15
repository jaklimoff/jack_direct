import { readdirSync } from 'node:fs'

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

import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections'
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers'

import tailwindcss from '@tailwindcss/vite'

const blogSlugs = readdirSync(new URL('./src/content/blog', import.meta.url))
  .filter((file) => file.endsWith('.mdx'))
  .map((file) => file.replace(/\.mdx$/, ''))

// Legacy Ghost URLs: posts lived at the site root, plus a few renamed slugs
const legacyRedirects: Record<string, string> = {
  ...Object.fromEntries(
    blogSlugs.map((slug) => [`/${slug}`, `/blog/${slug}/`]),
  ),
  '/cap-theorem-for-developers-what-it-is-and-how-it-affects-distributed-systems':
    '/blog/cap-theorem-for-developers/',
  '/reflections-on-kotters-8-step-change-model-a-practical-guide-for-navigating-transformation':
    '/blog/reflections-on-kotters-8-step-change-model/',
  '/author/jack': '/about/',
  '/author/jack/page/2': '/about/',
  '/author/jaklimoff': '/about/',
  '/page/2': '/blog/2/',
  '/page/3': '/blog/2/',
}

const redirectPaths = new Set(
  Object.keys(legacyRedirects).map((path) => `https://jack.direct${path}/`),
)

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
    sitemap({ filter: (page) => !redirectPaths.has(page) }),
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
          rel: ['nofollow', 'noreferrer', 'noopener'],
        },
      ],
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
