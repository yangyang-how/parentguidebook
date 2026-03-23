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

const timeline = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    lang: z.enum(['en', 'zh-Hans']),
    stage: z.string(),
    stage_label: z.string(),
    stage_order: z.number(),
    domains_covered: z.array(z.string()).default([]),
    last_updated: z.string(),
  }),
});

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    lang: z.enum(['en', 'zh-Hans']),
  }),
});

export const collections = { articles, timeline, pages };
