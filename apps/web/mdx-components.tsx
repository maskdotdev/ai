import Image, { type ImageProps } from 'next/image'
import type { MDXComponents } from 'mdx/types.js'
import 'katex/dist/katex.min.css'

type HTMLProps = React.HTMLAttributes<HTMLElement> & {
  className?: string
}

// Component for heading elements that shows a floating anchor on hover
const HeadingWithAnchor = ({ as: Component, ...props }: { as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' } & HTMLProps) => {
  return (
    <Component
      {...props}
      className="relative group"
    >
      {props.children}
      <a
        href={`#${props.id}`}
        aria-label="Link to section"
        className="absolute -left-5 opacity-0 group-hover:opacity-100 transition-opacity text-teal-500 dark:text-teal-400 no-underline"
      >
        #
      </a>
    </Component>
  )
}

// Window-style pre component with title bar and traffic light buttons
const WindowPre = (props: HTMLProps) => {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      <pre {...props} className="p-4 m-0 bg-zinc-50 dark:bg-zinc-900 rounded-b-xl rounded-t-none" />
    </div>
  )
}

// Custom anchor component that when hover shows floating on the left 
// of the tag
const A = (props: HTMLProps) => {
  return (
    <a
      {...props}
      className="relative group hover:text-teal-500 dark:hover:text-teal-400 no-underline"
    >
      {props.children}
      <span className="absolute left-[-1.25rem] opacity-0 group-hover:opacity-100 transition-opacity">
        #
      </span>
    </a>
  )
}

export function useMDXComponents(components: MDXComponents) {
  return {
    ...components,
    Image: (props: ImageProps) => <Image {...props} />,
    h1: (props: HTMLProps) => <HeadingWithAnchor as="h1" {...props} />,
    h2: (props: HTMLProps) => <HeadingWithAnchor as="h2" {...props} />,
    h3: (props: HTMLProps) => <HeadingWithAnchor as="h3" {...props} />,
    h4: (props: HTMLProps) => <HeadingWithAnchor as="h4" {...props} />,
    h5: (props: HTMLProps) => <HeadingWithAnchor as="h5" {...props} />,
    h6: (props: HTMLProps) => <HeadingWithAnchor as="h6" {...props} />,
    pre: WindowPre,
    a: A,
    code: (props: HTMLProps) => {
      const language = props.className?.replace('language-', '')
      if (language === 'math') {
        return <code {...props} className="math-inline" />
      }
      return <code {...props} />
    },
  }
}
