'use client'

import FlexSearch from 'flexsearch'

export interface SearchableItem {
  title: string
  href: string
  content?: string
  snippet?: string
}

interface SearchResult {
  field: string
  result: string[]
}

// Keep a mapping of href to content and title
const contentMap = new Map<string, { title: string; content: string }>()

const searchIndex = new FlexSearch.Document({
  document: {
    id: 'href',
    index: ['title', 'content']
  },
  tokenize: 'full',
  cache: true
})

export function addToIndex(item: SearchableItem) {
  contentMap.set(item.href, { 
    title: item.title, 
    content: item.content || '' 
  })
  
  searchIndex.add({
    href: item.href,
    title: item.title,
    content: item.content
  })
}

function findSnippet(content: string, query: string): string {
  const lowerContent = content.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerContent.indexOf(lowerQuery)
  
  if (index === -1) return content.slice(0, 100) + '...' // If no exact match, return start of content
  
  const start = Math.max(0, index - 50)
  const end = Math.min(content.length, index + query.length + 50)
  const snippet = content.slice(start, end)
  
  return (start > 0 ? '...' : '') + snippet + (end < content.length ? '...' : '')
}

export async function search(query: string): Promise<SearchableItem[]> {
  if (!query) return []

  const searchResults = await searchIndex.search(query) as SearchResult[]
  const seenHrefs = new Set<string>()
  const results: SearchableItem[] = []

  for (const result of searchResults) {
    for (const href of result.result) {
      if (seenHrefs.has(href)) continue
      seenHrefs.add(href)

      const content = contentMap.get(href)
      if (!content) continue

      results.push({
        title: content.title,
        href,
        snippet: findSnippet(content.content, query)
      })
    }
  }

  return results
} 