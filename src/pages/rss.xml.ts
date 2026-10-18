import { SITE } from '@/consts'
import { getAllPosts } from '@/lib/data-utils'
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx'
import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import { loadRenderers } from 'astro:container'
import { render } from 'astro:content'

// Feed readers need absolute URLs and no page scripts or styles
function cleanForFeed(html: string, site: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/(\s(?:href|src|srcset)=")\/(?!\/)/g, `$1${site}/`)
}

export async function GET(context: APIContext) {
  const site = (context.site ?? new URL(SITE.href)).href.replace(/\/$/, '')
  const posts = await getAllPosts()
  const renderers = await loadRenderers([getMDXRenderer()])
  const container = await AstroContainer.create({ renderers })

  const items = await Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post)
      const html = await container.renderToString(Content)
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.date,
        link: `/blog/${post.id}/`,
        categories: post.data.tags ?? [],
        author: 'Jack Klimov',
        content: cleanForFeed(html, site),
      }
    }),
  )

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.href,
    items,
    customData: `<language>${SITE.locale.toLowerCase()}</language>`,
  })
}
