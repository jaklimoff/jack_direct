import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NAV_LINKS } from '@/consts'
import { Menu, ExternalLink } from 'lucide-react'

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleViewTransitionStart = () => {
      setIsOpen(false)
    }
    document.addEventListener('astro:before-swap', handleViewTransitionStart)
    return () => {
      document.removeEventListener('astro:before-swap', handleViewTransitionStart)
    }
  }, [])

  const isExternalLink = (href: string) => {
    return href.startsWith('http')
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={(val) => setIsOpen(val)}>
      <DropdownMenuTrigger asChild onClick={() => setIsOpen((val) => !val)}>
        <Button variant="outline" size="icon" className="md:hidden size-9 rounded-full border-border bg-surface dark:bg-surface dark:border-border text-muted-foreground" title="Menu">
          <Menu className="size-4" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-surface rounded-xl">
        {NAV_LINKS.map((item) => {
          const isExternal = isExternalLink(item.href)
          const isInsideLink = item.label.toLowerCase() === 'inside'
          return (
            <DropdownMenuItem key={item.href} asChild>
              <a
                href={item.href}
                target={isExternal ? '_blank' : '_self'}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className={`w-full text-lg font-medium capitalize flex items-center gap-2 ${
                  isInsideLink ? 'text-primary hover:text-primary/80' : isExternal ? 'text-primary/90 hover:text-primary' : ''
                }`}
                onClick={() => setIsOpen(false)}
              >
                <span>{item.label}</span>
                {isExternal && (
                  <ExternalLink className={`h-4 w-4 opacity-80 flex-shrink-0 ${isInsideLink ? 'text-primary' : ''}`} aria-hidden="true" />
                )}
              </a>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default MobileMenu
