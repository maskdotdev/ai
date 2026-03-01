import { Container } from '@/components/container'

export function SimpleLayout({
  title,
  intro,
  children,
}: {
  title: string
  intro: string
  children?: React.ReactNode
}) {
  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-2xl">
        <h1 className="heading-glow font-serif text-4xl tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        <div className="gradient-line animate-reveal-line mt-6 w-16" />
        <p className="mt-6 text-base leading-relaxed font-light text-neutral-500">
          {intro}
        </p>
      </header>
      {children && <div className="mt-16 sm:mt-20">{children}</div>}
    </Container>
  )
}
