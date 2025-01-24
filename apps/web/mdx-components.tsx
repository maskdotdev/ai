import Image, { type ImageProps } from 'next/image'
import type { MDXComponents } from 'mdx/types.js'
import 'katex/dist/katex.min.css'

type HTMLProps = React.HTMLAttributes<HTMLElement> & {
  className?: string
}

export function useMDXComponents(components: MDXComponents) {
  return {
    ...components,
    Image: (props: ImageProps) => <Image {...props} />,
    // Override pre and code components to handle math blocks
    pre: (props: HTMLProps) => <pre {...props} className="math-display" />,
    code: (props: HTMLProps) => {
      const language = props.className?.replace('language-', '')
      if (language === 'math') {
        return <code {...props} className="math-inline" />
      }
      return <code {...props} />
    },
  }
}
