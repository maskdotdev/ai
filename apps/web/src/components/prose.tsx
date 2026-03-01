import clsx from 'clsx'

export function Prose({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={clsx(
        className,
        'prose dark:prose-invert prose-a:text-neutral-300 prose-a:underline prose-a:decoration-neutral-600 prose-a:underline-offset-2 hover:prose-a:text-white hover:prose-a:decoration-neutral-400 dark:prose-a:text-neutral-300 dark:hover:prose-a:text-white prose-pre:overflow-auto prose-pre:bg-neutral-900 prose-pre:leading-normal prose-pre:ring-1 prose-pre:ring-white/5 dark:prose-pre:bg-neutral-900/50',
      )}
      {...props}
    />
  )
}
