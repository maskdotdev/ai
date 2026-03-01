import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import react from '@astrojs/react'

import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'

const prettyCodeOptions = {
  theme: {
    dark: 'tokyo-night',
    light: 'catppuccin-latte',
  },
  keepBackground: false,
  defaultLang: 'plaintext',
}

export default defineConfig({
  integrations: [
    mdx({
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [
        [rehypePrettyCode, prettyCodeOptions],
        [rehypeKatex, { strict: true }],
        rehypeSlug,
      ],
    }),
    react(),
  ],
})
