#!/usr/bin/env npx tsx
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
/**
 * Research Stage — gathers and stores evidence before article writing.
 *
 * Produces a structured research file with:
 * - Source passages (actual excerpts from guidelines, studies, etc.)
 * - Source metadata (URL, publication, date)
 * - Claims each source supports
 * - Suggested article outline grounded in the sources
 *
 * Usage:
 *   npx tsx scripts/research.ts --domain eyes --stage 0-1mo
 *   npx tsx scripts/research.ts --domain eyes --overview
 *   npx tsx scripts/research.ts --domain sleep --stage 2-5yr --refresh
 */
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-6";

const SYSTEM_PROMPT = `You are a medical research assistant for Parent Guidebook (parentguidebook.org), a bilingual health education site for parents.

Your job is to gather evidence-based source material that will be used to write a parent-facing article. The article must be traceable — every claim needs a supporting source passage.

## What you produce

For the given domain and age stage (or domain overview), research and output:

1. **Relevant sources** — Find 8-15 high-quality sources. Prioritize:
   - Clinical practice guidelines (AAP, WHO, CDC, NICE, RCPCH)
   - Systematic reviews and meta-analyses
   - Major pediatric textbooks (Nelson's, Palpalardo's)
   - Government health agency publications
   - Peer-reviewed journal articles from the last 10 years

2. **Key passages** — For each source, extract the most relevant passages (exact quotes or faithful paraphrases clearly marked). These are the evidence the article will be built on.

3. **Claims mapping** — For each passage, state what parent-facing claims it supports. Be specific.

4. **Suggested outline** — Based on the evidence gathered, suggest an article structure with sections. Each section should note which sources support it.

5. **Red flags and nuances** — Note any areas where:
   - Sources disagree
   - Evidence is weak or limited
   - Common misconceptions exist that the article should address
   - Cultural considerations (relevant for a bilingual EN/ZH audience)

## Output format

Return a markdown document with this structure:

---
domain: "<domain>"
stage: "<stage or 'overview'>"
researched_date: "<today's date>"
source_count: <number>
---

## Research Brief

<2-3 sentence summary of what this article should cover and why it matters for parents>

## Sources

### Source 1: <title>
- **Publication:** <journal/org name>
- **Date:** <year>
- **URL:** <url if available, or "Print publication">
- **Type:** <guideline | systematic-review | cohort-study | textbook | government-publication>

**Key passages:**
> "<exact quote or faithful paraphrase>"

> "<another passage>"

**Claims supported:**
- <claim 1>
- <claim 2>

### Source 2: ...
(repeat for all sources)

## Suggested Outline

### Section 1: <title>
- Key points: ...
- Supported by: Source 1, Source 3
- Parent-facing angle: ...

### Section 2: ...

## Red Flags & Nuances

- <disagreement, weak evidence, cultural note, or common misconception>

## Claims Checklist

A flat list of every factual claim the article should make, each with its source number:
- [ ] Claim 1 (Source 1)
- [ ] Claim 2 (Source 1, Source 3)
- ...

This checklist will be used by the fact-checker to verify the final article.`;

function getResearchPath(domain: string, stage: string): string {
	return resolve(`src/content/research/${domain}/${stage}.md`);
}

function buildPrompt(
	domain: string,
	stage: string,
	isOverview: boolean,
): string {
	if (isOverview) {
		return `Research the domain "${domain}" for a parent-facing overview article.

This is a DOMAIN OVERVIEW — it should cover all age stages (0-18 years) at a high level. The overview introduces the domain, explains why it matters, and guides parents to age-specific articles for details.

Domain: ${domain}
Type: Overview (all ages)
Audience: Parents (not medical professionals)
Tone: Warm, clear, evidence-based — not clinical, not scary`;
	}

	return `Research the domain "${domain}" at age stage "${stage}" for a parent-facing article.

This is a CELL ARTICLE — it covers one specific domain at one specific age stage. It should be practical, actionable, and scoped tightly to what parents need to know about this domain during this age period.

Domain: ${domain}
Age stage: ${stage}
Audience: Parents (not medical professionals)
Tone: Warm, clear, evidence-based — not clinical, not scary

Age stage reference:
- 0-1mo: Newborn (first 30 days)
- 1-6mo: Infant (months 1-6)
- 6mo-2yr: Baby/toddler (6 months to 2 years)
- 2-5yr: Toddler/preschool (ages 2-5)
- 5-12yr: School-age (ages 5-12)
- 12-18yr: Adolescent/teen (ages 12-18)`;
}

const SAFE_SLUG = /^[a-z0-9-]+$/;

function validateSlug(value: string, label: string): void {
	if (!SAFE_SLUG.test(value)) {
		console.error(
			`Invalid ${label}: "${value}". Only lowercase letters, digits, and hyphens allowed.`,
		);
		process.exit(1);
	}
}

async function research(
	domain: string,
	stage: string,
	isOverview: boolean,
	refresh: boolean,
) {
	validateSlug(domain, "domain");
	if (!isOverview) validateSlug(stage, "stage");

	const outPath = getResearchPath(domain, isOverview ? "overview" : stage);

	if (existsSync(outPath) && !refresh) {
		console.log(`Research file already exists: ${outPath}`);
		console.log("Use --refresh to regenerate.");
		process.exit(0);
	}

	// Ensure directory exists
	mkdirSync(dirname(outPath), { recursive: true });

	const client = new Anthropic();
	const prompt = buildPrompt(domain, stage, isOverview);

	console.log(`Researching: ${domain} × ${isOverview ? "overview" : stage}`);
	console.log(`Using model: ${MODEL}`);
	console.log(`Output: ${outPath}`);
	const start = Date.now();

	const response = await client.messages.create({
		model: MODEL,
		max_tokens: 16000,
		thinking: { type: "adaptive" },
		system: SYSTEM_PROMPT,
		messages: [
			{
				role: "user",
				content: prompt,
			},
		],
	});

	const elapsed = ((Date.now() - start) / 1000).toFixed(1);
	const textBlock = response.content.find((b) => b.type === "text");
	const output = textBlock?.type === "text" ? textBlock.text : "";

	if (!output.trim()) {
		console.error(`Empty response from model (${elapsed}s)`);
		process.exit(1);
	}

	writeFileSync(outPath, output, "utf-8");

	console.log(`\nDone in ${elapsed}s`);
	console.log(`✅ Research saved to: ${outPath}`);

	// Quick stats
	const sourceCount = (output.match(/^### Source \d+/gm) || []).length;
	const claimCount = (output.match(/^- \[ \]/gm) || []).length;
	console.log(`   ${sourceCount} sources, ${claimCount} claims identified`);
}

// --- CLI ---
const args = process.argv.slice(2);
let domain = "";
let stage = "";
let isOverview = false;
let refresh = false;

for (let i = 0; i < args.length; i++) {
	switch (args[i]) {
		case "--domain":
			domain = args[++i] || "";
			break;
		case "--stage":
			stage = args[++i] || "";
			break;
		case "--overview":
			isOverview = true;
			break;
		case "--refresh":
			refresh = true;
			break;
		default:
			console.error(`Unknown argument: ${args[i]}`);
			process.exit(1);
	}
}

if (!domain) {
	console.log(`Research Stage — Parent Guidebook

Usage:
  npx tsx scripts/research.ts --domain <domain> --stage <stage>
    Research a specific domain × age stage

  npx tsx scripts/research.ts --domain <domain> --overview
    Research a domain overview (all ages)

Options:
  --refresh    Regenerate even if research file exists

Examples:
  npx tsx scripts/research.ts --domain eyes --stage 0-1mo
  npx tsx scripts/research.ts --domain sleep --overview
  npx tsx scripts/research.ts --domain teeth --stage 2-5yr --refresh`);
	process.exit(1);
}

if (!stage && !isOverview) {
	console.error("Must specify either --stage <stage> or --overview");
	process.exit(1);
}

research(domain, stage, isOverview, refresh);
