'use client'

import { useEffect } from 'react'
import { addToIndex } from '@/utils/search'

interface Article {
  title: string
  slug: string
  description: string
  draft?: boolean
}

export function SearchIndexer({ articles }: { articles: Article[] }) {
  useEffect(() => {
    // Only index non-draft articles in production
    const articlesToIndex = process.env.NODE_ENV === 'development' 
      ? articles 
      : articles.filter(article => !article.draft)

    // Index all articles
    for (const article of articlesToIndex) {
      addToIndex({
        title: article.title,
        href: `/articles/${article.slug}`,
        content: article.description
      })
    }
  }, [articles])

  return null
} 