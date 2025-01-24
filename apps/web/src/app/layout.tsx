import type { Metadata } from 'next'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/layout'
import { CommandMenu } from '@/components/command-menu'
import { SearchIndexer } from '@/components/search-indexer'
import { getAllArticles } from '@/lib/articles'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
  title: {
    template: '%s - Kiyotaka',
    default: 'Kiyotaka - Software, Artificial Intelligence, and coffee.',
  },
  description:
    "I'm Kiyotaka, a software and AI enthusiast. I'm passionate about building AI systems from the ground up and sharing knowledge with others. I want to help myself and others by understanding the inner workings of artificial intelligence.",
  alternates: {
    types: {
      'application/rss+xml': `${process.env.NEXT_PUBLIC_SITE_URL}/feed.xml`,
    },
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const articles = await getAllArticles()

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
      <body className="flex h-full bg-zinc-50 dark:bg-black">
        <Providers>
          <div className="flex w-full">
            <Layout>{children}</Layout>
          </div>
          <SearchIndexer articles={articles} />
          <CommandMenu />
        </Providers>
      </body>
    </html>
  )
}
