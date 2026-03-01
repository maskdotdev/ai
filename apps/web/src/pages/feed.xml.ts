import { Feed } from 'feed'

import { getAllArticles } from '@/lib/articles'

export async function GET(context: { site?: URL }) {
  const siteUrl =
    context.site?.toString().replace(/\/$/, '') ??
    import.meta.env.PUBLIC_SITE_URL ??
    'http://localhost:4321'

  const author = {
    name: 'Kiyotaka',
    email: 'maskdotdev@gmail.com',
  }

  const feed = new Feed({
    title: author.name,
    description:
      'Exploring artificial intelligence, software development, and personal insights',
    author,
    id: siteUrl,
    link: siteUrl,
    image: `${siteUrl}/favicon.svg`,
    favicon: `${siteUrl}/favicon.svg`,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    feedLinks: {
      rss2: `${siteUrl}/feed.xml`,
    },
  })

  const articles = await getAllArticles(false)

  for (const article of articles) {
    const publicUrl = `${siteUrl}/articles/${article.slug}`

    feed.addItem({
      title: article.title,
      id: publicUrl,
      link: publicUrl,
      description: article.description,
      content: article.description,
      author: [author],
      contributor: [author],
      date: new Date(article.date),
    })
  }

  return new Response(feed.rss2(), {
    status: 200,
    headers: {
      'content-type': 'application/xml',
      'cache-control': 'public, max-age=3600',
    },
  })
}
