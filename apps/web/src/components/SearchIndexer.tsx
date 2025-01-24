'use client'

import { useEffect } from 'react'
import { addToIndex } from '@/utils/search'

interface Article {
  title: string
  slug: string
  description: string
}

export function SearchIndexer({ articles }: { articles: Article[] }) {
  useEffect(() => {
    // Index all articles
    articles.forEach((article) => {
      addToIndex({
        title: article.title,
        href: `/articles/${article.slug}`,
        content: article.description
      })
    })
  }, [articles])

  return null
} 