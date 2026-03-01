import 'katex/dist/katex.min.css'

type HTMLProps = React.HTMLAttributes<HTMLElement> & {
  className?: string
  id?: string
}

const HeadingWithAnchor = ({
  as: Component,
  ...props
}: { as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' } & HTMLProps) => {
  return (
    <Component {...props} className="group relative">
      {props.children}
      {props.id && (
        <a
          href={`#${props.id}`}
          aria-label="Link to section"
          className="absolute -left-5 text-neutral-500 no-underline opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
        >
          #
        </a>
      )}
    </Component>
  )
}

const WindowPre = (props: HTMLProps) => {
  return (
    <div className="overflow-hidden rounded-xl border border-white/5">
      <div className="flex items-center gap-1.5 bg-neutral-900 px-4 py-2">
        <div className="h-3 w-3 rounded-full bg-neutral-700" />
        <div className="h-3 w-3 rounded-full bg-neutral-700" />
        <div className="h-3 w-3 rounded-full bg-neutral-700" />
      </div>
      <pre
        {...props}
        className="m-0 rounded-t-none rounded-b-xl bg-neutral-950 p-4"
      />
    </div>
  )
}

const A = (props: HTMLProps) => {
  return (
    <a
      {...props}
      className="group relative text-neutral-300 no-underline underline decoration-neutral-600 underline-offset-2 transition-colors hover:text-white"
    >
      {props.children}
    </a>
  )
}

const Image = (
  props: React.ImgHTMLAttributes<HTMLImageElement> & { src: unknown },
) => {
  const src =
    typeof props.src === 'string'
      ? props.src
      : typeof props.src === 'object' && props.src && 'src' in props.src
        ? String((props.src as { src: string }).src)
        : ''

  return <img {...props} src={src} />
}

export function useMDXComponents(components: Record<string, unknown>) {
  return {
    ...components,
    Image,
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
