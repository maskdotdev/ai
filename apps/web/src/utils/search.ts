'use client'

import FlexSearch from 'flexsearch'

export interface SearchableItem {
  title: string
  href: string
  content?: string
  snippet?: string
}

// Create a document index for multi-field search
const index = new FlexSearch.Document({
  document: {
    id: 'href',
    index: [
      {
        field: 'title',
        tokenize: 'forward', // Good for title autocomplete
        optimize: true,
        resolution: 9,
        cache: true
      },
      {
        field: 'content',
        tokenize: 'strict', // Better for content search
        optimize: true,
        resolution: 5,
        context: {
          depth: 2,
          resolution: 9
        }
      }
    ],
    store: ['title', 'content'] // Store these fields for snippet generation
  },
  tokenize: 'full',
  charset: 'latin:extra', // Better character handling
  language: 'en'
})

export function addToIndex(item: SearchableItem) {
  if (!item.content) return

  index.add({
    href: item.href,
    title: item.title,
    content: item.content
  })
}

function findSnippet(content: string, query: string): string {
  const lowerContent = content.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const index = lowerContent.indexOf(lowerQuery)

  if (index === -1) {
    // If no exact match found, return first 100 chars
    return `${content.slice(0, 100)}...`
  }

  // Get surrounding context
  const start = Math.max(0, index - 50)
  const end = Math.min(content.length, index + query.length + 50)
  const snippet = content.slice(start, end)

  return `${start > 0 ? '...' : ''}${snippet}${end < content.length ? '...' : ''}`
}

interface StoredDoc {
  title: string
  content: string
}

interface SearchResult {
  field: string
  result: Array<{
    id: string | string[]
    doc: StoredDoc
    score: number
  }>
}

export async function search(query: string): Promise<SearchableItem[]> {
  if (!query || query.length < 2) return []

  const results = await index.searchAsync(query, {
    enrich: true,
    limit: 5,
    bool: 'or'
  }) as SearchResult[]

  const searchResults: SearchableItem[] = []
  const seenHrefs = new Set<string>()

  for (const result of results) {
    for (const { id, doc } of result.result) {
      const href = Array.isArray(id) ? id[0] : id
      if (seenHrefs.has(href)) continue
      seenHrefs.add(href)

      searchResults.push({
        title: doc.title,
        href,
        snippet: findSnippet(doc.content, query)
      })
    }
  }

  return searchResults
}

