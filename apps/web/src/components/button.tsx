import clsx from 'clsx'

const variantStyles = {
  primary:
    'bg-white font-medium text-black hover:bg-neutral-200 active:bg-neutral-300 active:text-black/70',
  secondary:
    'bg-neutral-900 font-light text-neutral-300 hover:bg-neutral-800 hover:text-white active:bg-neutral-900 active:text-neutral-300/70 ring-1 ring-white/10',
}

type ButtonProps = {
  variant?: keyof typeof variantStyles
} & (
  | (React.ComponentPropsWithoutRef<'button'> & { href?: undefined })
  | React.ComponentPropsWithoutRef<'a'>
)

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonProps) {
  className = clsx(
    'inline-flex items-center gap-2 justify-center rounded-md py-2 px-3 text-sm outline-offset-2 transition active:transition-none',
    variantStyles[variant],
    className,
  )

  return typeof (props as { href?: string }).href === 'undefined' ? (
    <button
      className={className}
      {...(props as React.ComponentPropsWithoutRef<'button'>)}
    />
  ) : (
    <a
      className={className}
      {...(props as React.ComponentPropsWithoutRef<'a'>)}
    />
  )
}
