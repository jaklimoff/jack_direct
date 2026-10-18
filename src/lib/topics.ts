import type { CollectionEntry } from 'astro:content'

// Topics shown in the timeline filter, in priority order. A post's topic is
// the first of these that appears in its tags.
export const TOPICS = [
  'claude-code',
  'protocols',
  'agents',
  'databases',
  'rust',
  'python',
  'solidity',
  'management',
] as const

export type Topic = (typeof TOPICS)[number]

export function getPostTopic(post: CollectionEntry<'blog'>): string {
  const tags = post.data.tags ?? []
  return TOPICS.find((t) => tags.includes(t)) ?? tags[0] ?? 'notes'
}

export function topicColor(topic: string): string {
  return (TOPICS as readonly string[]).includes(topic)
    ? `var(--topic-${topic})`
    : 'var(--faint)'
}

export function shortReadTime(readTime: string): string {
  return readTime.replace(/ read$/, '')
}
