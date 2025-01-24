'use client'

import { useEffect, useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { type SearchableItem, search } from '@/utils/search'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/command'

// Move HighlightedText outside and memoize it
const HighlightedText = memo(({ text, query }: { text: string; query: string }) => {
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
      <span className="underline decoration-teal-400 dark:decoration-teal-500 decoration-2">{match}</span>
      {after}
    </>
  )
})
HighlightedText.displayName = 'HighlightedText'

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [results, setResults] = useState<SearchableItem[]>([])

  useEffect(() => {
    // Handle keyboard shortcuts
    const down = (e: KeyboardEvent) => {
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
    }
  }, [open])

  // Update search results when query changes
  useEffect(() => {
    const updateSearch = async () => {
      const res = await search(query)
      setResults(res)
    }
    updateSearch()
  }, [query])


  const onSelect = (href: string) => {
    router.push(href)
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command loop defaultValue={results[0]?.title || "toggle theme"}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search articles or type a command..."
        />
        <CommandList>
          {results.length === 0 ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : null}
          <CommandGroup heading="Actions">
            <CommandItem
              key="toggle theme"
              value="toggle theme"
              onSelect={() => {
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                setOpen(false)
              }}
              className="flex items-center justify-between"
            >
              <span className="font-medium">Toggle theme to {resolvedTheme === 'dark' ? 'light' : 'dark'}</span>
              <span className="ml-auto text-xs tracking-widest text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100">⏎</span>
            </CommandItem>
            <CommandItem
              key="go to home"
              value="go to home"
              onSelect={() => {
                router.push('/')
                setOpen(false)
              }}
              className="flex items-center justify-between"
            >
              <span className="font-medium">Go Home</span>
              <span className="ml-auto text-xs tracking-widest text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100">⏎</span>
            </CommandItem>
            <CommandItem
              key="go to articles"
              value="go to articles"
              onSelect={() => {
                router.push('/articles')
                setOpen(false)
              }}
              className="flex items-center justify-between"
            >
              <span className="font-medium">Go to Articles</span>
              <span className="ml-auto text-xs tracking-widest text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100">⏎</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Articles">
            {results.map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.title} ${item.snippet || ''}`}
                onSelect={() => onSelect(item.href)}
                className="flex items-center justify-between gap-2 group"
              >
                <div className="flex flex-col">
                  <span className="text-teal-500 dark:text-teal-400 font-medium text-left">
                    {item.title}
                  </span>
                  {item.snippet && (
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      <HighlightedText text={item.snippet} query={query} />
                    </span>
                  )}
                </div>
                        <span className="ml-auto text-xs tracking-widest text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100">⏎</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
} 
