import { defineCollection, z } from 'astro:content'

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().default('Kiyotaka'),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
  }),
})

export const collections = {
  articles,
}
