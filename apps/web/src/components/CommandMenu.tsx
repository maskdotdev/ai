'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { type SearchableItem, search } from '@/utils/search'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/Command'

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
      const results = await search(query)
      setResults(results)
    }
    updateSearch()
  }, [query])

  const onSelect = (href: string) => {
    router.push(href)
    setOpen(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search articles or type a command..."
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
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
        </CommandGroup>
        <CommandGroup heading="Articles">
          {results.map((item) => (
            <CommandItem
              key={item.href}
              value={item.title}
              onSelect={() => onSelect(item.href)}
              className="flex items-center justify-between gap-2 group"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-teal-500 dark:text-teal-400 font-medium text-left">{item.title}</span>
                {item.snippet && (
                  <span className="text-xs text-muted-foreground line-clamp-2">
                    {item.snippet}
                  </span>
                )}
              </div>
              <span className="ml-auto text-xs tracking-widest text-muted-foreground opacity-0 group-data-[selected=true]:opacity-100">⏎</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
} 
