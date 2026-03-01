'use client'

import { useEffect, useMemo, useState, memo } from 'react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/command'

interface SearchableItem {
  title: string
  href: string
  snippet?: string
}

interface SearchArticle {
  title: string
  slug: string
  description: string
  draft?: boolean
}

const HighlightedText = memo(
  ({ text, query }: { text: string; query: string }) => {
    if (!query) return <>{text}</>

    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerText.indexOf(lowerQuery)

    if (index === -1) return <>{text}</>

    const before = text.slice(0, index)
    const match = text.slice(index, index + query.length)
    const after = text.slice(index + query.length)

    return (
      <>
        {before}
        <span className="underline decoration-neutral-400 decoration-1">
          {match}
        </span>
        {after}
      </>
    )
  },
)
HighlightedText.displayName = 'HighlightedText'

function getResolvedTheme() {
  const saved = window.localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  window.localStorage.setItem('theme', theme)
}

function buildSnippet(content: string, query: string) {
  const lowerContent = content.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerContent.indexOf(lowerQuery)

  if (index === -1) {
    return `${content.slice(0, 100)}...`
  }

  const start = Math.max(0, index - 50)
  const end = Math.min(content.length, index + query.length + 50)
  const snippet = content.slice(start, end)

  return `${start > 0 ? '...' : ''}${snippet}${end < content.length ? '...' : ''}`
}

export function CommandMenu({ articles }: { articles: SearchArticle[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    setTheme(getResolvedTheme())
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
        e.preventDefault()
        setOpen((value) => !value)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const results = useMemo<SearchableItem[]>(() => {
    if (query.length < 2) return []

    const normalized = query.toLowerCase().trim()

    return articles
      .filter((article) => !article.draft)
      .filter((article) => {
        return (
          article.title.toLowerCase().includes(normalized) ||
          article.description.toLowerCase().includes(normalized)
        )
      })
      .slice(0, 5)
      .map((article) => ({
        title: article.title,
        href: `/articles/${article.slug}`,
        snippet: buildSnippet(article.description, normalized),
      }))
  }, [articles, query])

  const navigateTo = (href: string) => {
    window.location.href = href
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command loop defaultValue={results[0]?.title || 'toggle theme'}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search articles or type a command..."
        />
        <CommandList>
          {results.length === 0 && query.length > 1 ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : null}
          <CommandGroup heading="Actions">
            <CommandItem
              key="toggle theme"
              value="toggle theme"
              onSelect={() => {
                const nextTheme = theme === 'dark' ? 'light' : 'dark'
                setTheme(nextTheme)
                applyTheme(nextTheme)
                setOpen(false)
              }}
              className="flex items-center justify-between"
            >
              <span className="font-medium">
                Toggle theme to {theme === 'dark' ? 'light' : 'dark'}
              </span>
              <span className="ml-auto text-xs tracking-widest text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100">
                &#9166;
              </span>
            </CommandItem>
            <CommandItem
              key="go to home"
              value="go to home"
              onSelect={() => {
                navigateTo('/')
                setOpen(false)
              }}
              className="flex items-center justify-between"
            >
              <span className="font-medium">Go Home</span>
              <span className="ml-auto text-xs tracking-widest text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100">
                &#9166;
              </span>
            </CommandItem>
            <CommandItem
              key="go to articles"
              value="go to articles"
              onSelect={() => {
                navigateTo('/articles')
                setOpen(false)
              }}
              className="flex items-center justify-between"
            >
              <span className="font-medium">Go to Articles</span>
              <span className="ml-auto text-xs tracking-widest text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100">
                &#9166;
              </span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Articles">
            {results.map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.title} ${item.snippet || ''}`}
                onSelect={() => {
                  navigateTo(item.href)
                  setOpen(false)
                }}
                className="group flex items-center justify-between gap-2"
              >
                <div className="flex flex-col">
                  <span className="text-left font-medium text-neutral-200">
                    {item.title}
                  </span>
                  {item.snippet && (
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      <HighlightedText text={item.snippet} query={query} />
                    </span>
                  )}
                </div>
                <span className="ml-auto text-xs tracking-widest text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100">
                  &#9166;
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
