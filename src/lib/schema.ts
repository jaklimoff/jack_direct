import { SITE, SOCIAL_LINKS } from '@/consts'
import { getEntry } from 'astro:content'

// One Person entity, referenced by @id from every page so search engines
// tie all posts, the home page and the About page to the same author.
export const PERSON_ID = `${SITE.href}/#person`
export const WEBSITE_ID = `${SITE.href}/#website`
export const ABOUT_URL = `${SITE.href}/about/`

export async function getPersonSchema() {
  const author = await getEntry('authors', SITE.author)
  const profiles = [
    author?.data.linkedin,
    author?.data.github,
    author?.data.twitter,
    ...SOCIAL_LINKS.map((link) => link.href),
  ].filter((url): url is string => !!url)

  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: author?.data.name ?? SITE.title,
    url: ABOUT_URL,
    image: `${SITE.href}/avatar.png`,
    jobTitle: 'Software Architect',
    description: SITE.description,
    knowsAbout: [
      'AI agents',
      'Agentic coding',
      'Claude Code',
      'Distributed systems',
      'Software architecture',
      'Engineering leadership',
    ],
    sameAs: [...new Set(profiles)],
  }
}

/** Short reference for author/publisher fields; the full entity lives on the home and About pages */
export function personRef(name: string) {
  return { '@type': 'Person', '@id': PERSON_ID, name, url: ABOUT_URL }
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE.title,
    url: `${SITE.href}/`,
    description: SITE.description,
    inLanguage: SITE.locale,
    publisher: { '@id': PERSON_ID },
  }
}

/** "@jaklimoff" from an x.com or twitter.com profile URL */
export function twitterHandle(url: string | undefined) {
  const handle = url?.match(/(?:twitter|x)\.com\/([A-Za-z0-9_]+)/)?.[1]
  return handle ? `@${handle}` : undefined
}
