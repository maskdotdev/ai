import { getCollection } from 'astro:content'

import { getReadingTimeMinutes } from '@/lib/reading-time'

interface Article {
  title: string
  description: string
  author: string
  date: string
  draft?: boolean
  readingTimeMinutes: number
}

export interface ArticleWithSlug extends Article {
  slug: string
}

export async function getAllArticles(
  includeDrafts = import.meta.env.DEV,
): Promise<ArticleWithSlug[]> {
  const entries = await getCollection('articles')

  const articles: ArticleWithSlug[] = entries
    .map((entry) => ({
      slug: entry.slug,
      ...entry.data,
      date: entry.data.date.toISOString().slice(0, 10),
      readingTimeMinutes: getReadingTimeMinutes(entry.body),
    }))
    .filter((article) => includeDrafts || !article.draft)
    .sort((a, z) => +new Date(z.date) - +new Date(a.date))

  return articles
}
