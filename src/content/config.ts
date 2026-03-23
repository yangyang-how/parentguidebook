import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    lang: z.enum(['en', 'zh-Hans']),
    domain: z.string(),
    category: z.string(),
    urgency: z.enum(['critical', 'important', 'good-to-know']),
    last_updated: z.string(),
    age_groups: z.array(z.string()).default([]),
  }),
});

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    lang: z.enum(['en', 'zh-Hans']),
  }),
});

export const collections = { articles, pages };

