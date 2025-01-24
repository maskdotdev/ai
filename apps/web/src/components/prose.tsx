import clsx from 'clsx'

export function Prose({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={clsx(className, 'prose dark:prose-invert prose-a:text-teal-500 dark:prose-a:text-teal-400 prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900 prose-pre:overflow-auto  prose-pre:leading-normal')} {...props} />
  )
}
