import { SITE } from '@/consts'
import { getAllPosts } from '@/lib/data-utils'
import { TOPICS, getPostTopic } from '@/lib/topics'
import type { APIRoute } from 'astro'

// llms.txt (https://llmstxt.org): a plain map of the site for AI assistants
export const GET: APIRoute = async () => {
  const posts = await getAllPosts()
  const order = [...TOPICS, 'notes'] as string[]
  const byTopic = new Map<string, typeof posts>()
  for (const post of posts) {
    const topic = getPostTopic(post)
    byTopic.set(topic, [...(byTopic.get(topic) ?? []), post])
  }
  const topics = [...byTopic.keys()].sort(
    (a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99),
  )

  const sections = topics.map((topic) => {
    const lines = byTopic
      .get(topic)!
      .map(
        (post) =>
          `- [${post.data.title}](${SITE.href}/blog/${post.id}/): ${post.data.description}`,
      )
    return `## ${topic}\n\n${lines.join('\n')}`
  })

  const body = `# ${SITE.title}

> ${SITE.description}

Jack Klimov is a software architect and former founder and CTO with 15+ years in distributed systems. Posts are written by him; code samples are meant to be copied and used.

- [About Jack Klimov](${SITE.href}/about/)
- [All posts](${SITE.href}/blog/)
- [RSS feed](${SITE.href}/rss.xml)

${sections.join('\n\n')}
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
