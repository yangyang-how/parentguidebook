import { getCollection } from "astro:content";
import type { CellData, DomainConfig } from "../components/matrix/types";
import {
	AGE_STAGES,
	CATEGORIES,
	type CategorySlug,
	DOMAINS_BY_CATEGORY,
} from "../config/domains";
import type { Lang } from "../i18n/ui";

/**
 * Build the content map at Astro build time.
 * For each domain × stage intersection, determines whether to link to
 * a domain article or fall back to the timeline article.
 */
export async function buildContentMap(lang: Lang) {
	const contentLang = lang === "zh" ? "zh-Hans" : "en";

	const allArticles = await getCollection("articles");
	const allTimeline = await getCollection("timeline");

	const articles = allArticles.filter((a) => a.data.lang === contentLang);
	const timeline = allTimeline.filter((t) => t.data.lang === contentLang);

	// Build set of domains that have at least one article
	const domainsWithArticles = new Set<string>();
	for (const article of articles) {
		domainsWithArticles.add(article.data.domain);
	}

	// Build map of stage → domains_covered from timeline entries
	const timelineCoverage = new Map<string, Set<string>>();
	for (const entry of timeline) {
		timelineCoverage.set(entry.data.stage, new Set(entry.data.domains_covered));
	}

	// Build the content map
	const contentMap: Record<string, Record<string, CellData | null>> = {};

	for (const [catSlug, domains] of Object.entries(DOMAINS_BY_CATEGORY)) {
		for (const domain of domains) {
			contentMap[domain.slug] = {};

			for (const stage of AGE_STAGES) {
				if (domainsWithArticles.has(domain.slug)) {
					contentMap[domain.slug][stage.slug] = {
						type: "domain",
						url: `/${lang}/${catSlug}/${domain.slug}/`,
					};
				} else if (timelineCoverage.get(stage.slug)?.has(domain.slug)) {
					contentMap[domain.slug][stage.slug] = {
						type: "timeline",
						url: `/${lang}/timeline/${stage.slug}/#${domain.slug}`,
					};
				} else {
					contentMap[domain.slug][stage.slug] = null;
				}
			}
		}
	}

	return contentMap;
}

/** Build the flat domain list with category info for the matrix. */
export function buildDomainList(): DomainConfig[] {
	const domains: DomainConfig[] = [];
	for (const cat of CATEGORIES) {
		const catDomains = DOMAINS_BY_CATEGORY[cat.slug as CategorySlug] || [];
		for (const d of catDomains) {
			domains.push({
				slug: d.slug,
				labelKey: d.labelKey,
				ready: d.ready,
				category: cat.slug,
				categoryLabelKey: cat.labelKey,
			});
		}
	}
	return domains;
}
