import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function calculateWordCountFromHtml(
  html: string | null | undefined,
): number {
  if (!html) return 0
  const textOnly = html.replace(/<[^>]+>/g, '')
  return textOnly.split(/\s+/).filter(Boolean).length
}

export function readingTime(wordCount: number): string {
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200))
  return `${readingTimeMinutes} min read`
}

export function getHeadingMargin(depth: number): string {
  const margins: Record<number, string> = {
    3: 'ml-4',
    4: 'ml-8',
    5: 'ml-12',
    6: 'ml-16',
  }
  return margins[depth] || ''
}

/**
 * Get the appropriate badge variant, custom classes, and tooltip for a tag
 * @param tag - The tag name
 * @returns Object with variant, className, and optional tooltip for styling
 */
export function getTagVariant(tag: string): {
  variant: 'default' | 'muted' | 'destructive' | 'outline'
  className?: string
  tooltip?: string
} {
  const normalizedTag = tag.toLowerCase().trim()

  switch (normalizedTag) {
    case 'experimental':
      return {
        variant: 'default',
        className: 'bg-amber-500 border-amber-500/50 text-white hover:!bg-amber-500 hover:!text-white dark:bg-amber-600 dark:border-amber-600/50 dark:hover:!bg-amber-600',
      }
    default:
      return {
        variant: 'muted',
      }
  }
}