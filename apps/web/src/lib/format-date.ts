export function formatDate(value: string | Date) {
  const date =
    value instanceof Date
      ? value
      : new Date(value.includes('T') ? value : `${value}T00:00:00Z`)

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
