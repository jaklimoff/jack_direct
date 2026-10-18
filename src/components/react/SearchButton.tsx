import React, { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import SearchDialog from './SearchDialog'
import { ErrorBoundary } from './ErrorBoundary'

const SearchButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [shortcut, setShortcut] = useState('⌘K')

  useEffect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.userAgent)) {
      setShortcut('Ctrl K')
    }
  }, [])

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !isInput) {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <ErrorBoundary>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="border-border bg-surface text-muted-foreground hover:text-foreground hover:border-strong flex h-9 cursor-pointer items-center gap-2.5 rounded-full border px-[11px] text-[13px] transition-colors sm:px-3.5"
        title={`Search (${shortcut})`}
        aria-label="Search blog posts"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Search className="size-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">Search</span>
        <span className="text-faint hidden font-mono text-[11.5px] tracking-normal sm:inline">
          {shortcut}
        </span>
      </button>
      <ErrorBoundary>
        <SearchDialog open={isOpen} onOpenChange={setIsOpen} />
      </ErrorBoundary>
    </ErrorBoundary>
  )
}

export default SearchButton
