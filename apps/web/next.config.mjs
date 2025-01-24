import rehypeShiki from '@shikijs/rehype'
import nextMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { createHighlighter } from 'shiki'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  experimental: {
    outputFileTracingIncludes: {
      '/articles/*': ['./src/app/articles/**/*.mdx'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.mask.dev',
        port: '',
        pathname: '/**',
        search: '',
      },
    ],
  },
  // Add webpack configuration for KaTeX fonts
  webpack: (config) => {
    config.module.rules.push({
      test: /\.woff2$/,
      type: 'asset/resource',
    })
    return config
  },
}

// Initialize the highlighter once at startup
const getShikiHighlighter = async () => {
  return await createHighlighter({
    themes: ['tokyo-night', 'catppuccin-latte'],
    langs: [
      'javascript',
      'typescript',
      'jsx',
      'tsx',
      'css',
      'json',
      'bash',
      'markdown',
      'python',
      'html',
      'c',
      'c++',
    ],
  })
}

const highlighter = await getShikiHighlighter()

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm, remarkMath],
    // Process math blocks before syntax highlighting
    rehypePlugins: [
      [rehypeKatex, { strict: true }],
      [
        rehypeShiki,
        {
          highlighter,
          themes: {
            light: 'tokyo-night',
            dark: 'catppuccin-latte',
          },
          cssVariablePrefix: '--shiki-',
        },
      ],
    ],
  },
})

export default withMDX(nextConfig)
