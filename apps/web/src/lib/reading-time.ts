export function getReadingTimeMinutes(content: string, wordsPerMinute = 200) {
  const words = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length

  return Math.max(1, Math.ceil(words / wordsPerMinute))
}
