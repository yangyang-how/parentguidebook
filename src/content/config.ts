import { defineCollection, z } from "astro:content";

const articles = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		lang: z.enum(["en", "zh-Hans"]),
		domain: z.string(),
		category: z.string(),
		urgency: z.enum(["critical", "important", "good-to-know"]),
		last_updated: z.string(),
		age_groups: z.array(z.string()).default([]),
		/** If set, this article is a cell article scoped to one domain × one age stage. */
		stage: z.string().optional(),
		/** Short one-line hook shown on the matrix card (≤80 chars). */
		hook: z.string().optional(),
		/** If true, this is the domain overview article (row header in the matrix). */
		is_overview: z.boolean().default(false),
	}),
});

const timeline = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		lang: z.enum(["en", "zh-Hans"]),
		stage: z.string(),
		stage_label: z.string(),
		stage_order: z.number(),
		domains_covered: z.array(z.string()).default([]),
		last_updated: z.string(),
		/** Short one-line hook shown on the matrix column header card (≤80 chars). */
		hook: z.string().optional(),
	}),
});

const pages = defineCollection({
	type: "content",
	schema: z.object({
		title: z.string(),
		lang: z.enum(["en", "zh-Hans"]),
	}),
});

export const collections = { articles, timeline, pages };
