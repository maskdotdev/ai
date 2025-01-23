import Image, { type ImageProps } from 'next/image'
import type { MDXComponents } from 'mdx/types.js'

export function useMDXComponents(components: MDXComponents) {
  return {
    ...components,
    Image: (props: ImageProps) => <Image {...props} />,
  }
}
