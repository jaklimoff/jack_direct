import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: 'Jack Klimov',
  description:
    'Engineering leader driving AI adoption and building resilient distributed systems. I write about the intersection of technology and leadership, from architecting scalable platforms to navigating the human side of engineering teams.',
  href: 'https://jack.direct',
  author: 'jack-klimov',
  locale: 'en-US',
  featuredPostCount: 4,
  postsPerPage: 10,
}

export const SITE_TITLE = SITE.title

// Google Analytics
export const ANALYTICS = {
  google: import.meta.env.PUBLIC_GOOGLE_ANALYTICS_ID || 'G-EZ7MET9Y54',
}

// Umami Analytics
// Configure via environment variable: PUBLIC_UMAMI_WEBSITE_ID
export const UMAMI = {
  websiteId: import.meta.env.PUBLIC_UMAMI_WEBSITE_ID || '',
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/',
    label: 'Home',
  },
  {
    href: '/blog',
    label: 'Blog',
  },
  {
    href: '/about',
    label: 'About',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://medium.com/@jaklimoff',
    label: 'Medium',
  },
  {
    href: 'https://www.linkedin.com/in/jklimov/',
    label: 'LinkedIn',
  },
  {
    href: 'https://github.com/jaklimoff',
    label: 'GitHub',
  },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'fa-brands:github',
  LinkedIn: 'fa-brands:linkedin',
  Twitter: 'fa-brands:twitter',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
  YouTube: 'fa-brands:youtube',
  Medium: 'fa-brands:medium',
  Instagram: 'fa-brands:instagram',
}

