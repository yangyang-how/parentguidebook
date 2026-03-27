import { getCollection } from "astro:content";
import type {
	CardData,
	CellContent,
	DomainConfig,
} from "../components/matrix/types";
import {
	AGE_STAGES,
	CATEGORIES,
	type CategorySlug,
	DOMAINS_BY_CATEGORY,
} from "../config/domains";
import type { Lang } from "../i18n/ui";

/**
 * Build all matrix data at Astro build time.
 *
 * Returns:
 * - cellMap: domain×stage → CardData | PlaceholderData
 * - rowHeaders: domain → overview article card (or null)
 * - colHeaders: stage → timeline article card (or null)
 */
export async function buildMatrixData(lang: Lang) {
	const contentLang = lang === "zh" ? "zh-Hans" : "en";

	const allArticles = await getCollection("articles");
	const allTimeline = await getCollection("timeline");

	const articles = allArticles.filter((a) => a.data.lang === contentLang);
	const timeline = allTimeline.filter((t) => t.data.lang === contentLang);

	// --- Column headers: timeline articles ---
	const colHeaders: Record<string, CardData | null> = {};
	for (const stage of AGE_STAGES) {
		const entry = timeline.find((t) => t.data.stage === stage.slug);
		if (entry) {
			colHeaders[stage.slug] = {
				title: entry.data.title,
				hook: entry.data.hook || "",
				url: `/${lang}/timeline/${stage.slug}/`,
				type: "timeline",
			};
		} else {
			colHeaders[stage.slug] = null;
		}
	}

	// --- Row headers: domain overview articles (is_overview: true) ---
	const rowHeaders: Record<string, CardData | null> = {};
	for (const [catSlug, domains] of Object.entries(DOMAINS_BY_CATEGORY)) {
		for (const domain of domains) {
			const overview = articles.find(
				(a) => a.data.domain === domain.slug && a.data.is_overview,
			);
			if (overview) {
				rowHeaders[domain.slug] = {
					title: overview.data.title,
					hook: overview.data.hook || "",
					url: `/${lang}/${catSlug}/${domain.slug}/`,
					type: "domain",
				};
			} else {
				rowHeaders[domain.slug] = null;
			}
		}
	}

	// --- Cell map: domain × stage articles ---
	const cellMap: Record<string, Record<string, CellContent>> = {};

	for (const [_catSlug, domains] of Object.entries(DOMAINS_BY_CATEGORY)) {
		for (const domain of domains) {
			cellMap[domain.slug] = {};

			for (const stage of AGE_STAGES) {
				// Look for a cell article with both domain + stage
				const cellArticle = articles.find(
					(a) =>
						a.data.domain === domain.slug &&
						a.data.stage === stage.slug &&
						!a.data.is_overview,
				);

				if (cellArticle) {
					const catSlug =
						Object.entries(DOMAINS_BY_CATEGORY).find(([_, ds]) =>
							ds.some((d) => d.slug === domain.slug),
						)?.[0] || "";
					cellMap[domain.slug][stage.slug] = {
						title: cellArticle.data.title,
						hook: cellArticle.data.hook || "",
						url: `/${lang}/${catSlug}/${domain.slug}/`,
						type: "cell",
					};
				} else {
					cellMap[domain.slug][stage.slug] = {
						type: "placeholder",
						domainLabel: domain.labelKey,
					};
				}
			}
		}
	}

	return { cellMap, rowHeaders, colHeaders };
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
