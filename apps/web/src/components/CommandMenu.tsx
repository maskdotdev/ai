'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
        placeholder="Search articles..."
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup>
          {results.map((item) => (
            <CommandItem
              key={item.href}
              value={item.title}
              onSelect={() => onSelect(item.href)}
            >
              <span className="font-medium">{item.title}</span>
              {item.snippet && (
                <span className="text-xs text-muted-foreground line-clamp-2">
                  {item.snippet}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
} 
