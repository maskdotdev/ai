import rehypePrism from '@mapbox/rehype-prism'
import nextMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'

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

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm, remarkMath],
    // Process math blocks before syntax highlighting
    rehypePlugins: [
      [rehypeKatex, { strict: true }],
      [rehypePrism, { ignoreMissing: true }],
    ],
  },
})

export default withMDX(nextConfig)
