#!/usr/bin/env npx tsx
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
/**
 * Fact Checker — verifies medical claims, statistics, and source citations.
 * Works on both EN and ZH articles.
 *
 * Usage:
 *   npx tsx scripts/fact-check.ts src/content/articles/en/white-pupil-leukocoria.md
 */
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-6";

const SYSTEM_PROMPT = `You are a medical fact checker for Parent Guidebook (parentguidebook.org), a bilingual health education site for parents. Your job is to verify the factual accuracy of articles about children's health.

## What you check

1. **Statistics and numbers** — Every percentage, age range, incidence rate, and timeline must be plausible and consistent with medical literature. Flag any number that seems wrong, exaggerated, or unsupported.

2. **Source citations** — Every claim tagged with [Source: srcN] or [来源：srcN] must be supported by the cited source listed at the bottom. Check that:
   - Every cited source in the text has a corresponding entry in the Sources section
   - Source entries look like real, verifiable publications (real journals, real organizations, plausible URLs)
   - Claims match what the cited source would reasonably say
   - No orphaned citations (srcN referenced but not listed) or unused sources (listed but never referenced)

3. **Research cross-reference** — If a research file is provided, cross-reference the article's claims against the research brief's source passages. Check that:
   - Every major factual claim in the article traces back to a source passage in the research file
   - The article does not contain medical claims that are absent from the research
   - Claims are not distorted or exaggerated relative to what the source passages actually say
   - Flag any claim that has no corresponding entry in the research file's Claims Checklist

4. **Medical accuracy** — Check for:
   - Correct medical terminology and definitions
   - Accurate descriptions of conditions, symptoms, and treatments
   - No dangerous oversimplifications (e.g., claiming something is harmless when it may not be)
   - No dangerous overstatements (e.g., claiming something is always fatal when survival rates are high)
   - Treatment timelines and urgency levels that align with medical consensus
   - Correct anatomy and physiology descriptions

5. **Recommendation safety** — Check that:
   - Urgency of recommendations matches the condition (critical conditions = "see doctor within days", not "consider mentioning at next visit")
   - No recommendations that could delay necessary treatment
   - No recommendations that could cause unnecessary panic
   - Medical disclaimers are present and appropriate

6. **Internal consistency** — Check that:
   - The same condition is described the same way throughout the article
   - Numbers don't contradict each other within the article
   - Urgency framing is consistent

## What you do NOT check

- Style, tone, or inclusive language (that's the linter's job)
- Translation accuracy (that's the auditor's job)
- Grammar or formatting

## Output format

Return a JSON object with this structure:
{
  "pass": true/false,
  "violations": [
    {
      "severity": "critical" | "warning",
      "category": "statistic" | "citation" | "research_traceability" | "medical_accuracy" | "recommendation_safety" | "internal_consistency",
      "location": "brief description of where in the article",
      "issue": "what's wrong",
      "suggestion": "how to fix it"
    }
  ],
  "summary": "1-2 sentence overall assessment"
}

- "critical" severity = must be fixed before publication (factual errors, dangerous claims, missing citations)
- "warning" severity = should be reviewed but may be acceptable (imprecise phrasing, minor inconsistencies)
- An article passes only if there are ZERO critical violations
- Return ONLY the JSON, no other text`;

async function factCheck(articlePath: string, researchPath?: string) {
	const absPath = resolve(articlePath);
	if (!existsSync(absPath)) {
		console.error(`File not found: ${absPath}`);
		process.exit(1);
	}

	const content = readFileSync(absPath, "utf-8");
	let researchContent = "";
	if (researchPath) {
		const absResearch = resolve(researchPath);
		if (existsSync(absResearch)) {
			researchContent = readFileSync(absResearch, "utf-8");
			console.log(`Research file: ${absResearch}`);
		} else {
			console.log(
				`⚠️  Research file not found: ${absResearch} — proceeding without cross-reference`,
			);
		}
	}

	const client = new Anthropic();

	console.log(`Fact-checking: ${absPath}`);
	console.log(`Using model: ${MODEL}`);
	const start = Date.now();

	let userMessage = `Fact-check this article:\n\n${content}`;
	if (researchContent) {
		// If research file is very large, extract just the Claims Checklist and Sources sections
		// to avoid exceeding model context. Threshold: ~40K chars (~10K tokens).
		let researchForPrompt = researchContent;
		if (researchContent.length > 40000) {
			const claimsIdx = researchContent.indexOf("## Claims Checklist");
			const sourcesIdx = researchContent.indexOf("## Sources");
			if (claimsIdx !== -1) {
				researchForPrompt =
					researchContent.slice(0, sourcesIdx !== -1 ? sourcesIdx : 0) +
					"\n\n[Sources section truncated for length]\n\n" +
					researchContent.slice(claimsIdx);
				console.log(
					`⚠️  Research file truncated (${researchContent.length} chars → ${researchForPrompt.length} chars)`,
				);
			}
		}
		userMessage += `\n\n${"=".repeat(60)}\nRESEARCH FILE (cross-reference claims against these sources):\n${"=".repeat(60)}\n\n${researchForPrompt}`;
	}

	const response = await client.messages.create({
		model: MODEL,
		max_tokens: 8000,
		thinking: { type: "adaptive" },
		system: SYSTEM_PROMPT,
		messages: [
			{
				role: "user",
				content: userMessage,
			},
		],
	});

	const elapsed = ((Date.now() - start) / 1000).toFixed(1);
	const textBlock = response.content.find((b) => b.type === "text");
	const raw = textBlock?.type === "text" ? textBlock.text : "";

	let result: {
		pass: boolean;
		violations: Array<{
			severity: string;
			category: string;
			location: string;
			issue: string;
			suggestion: string;
		}>;
		summary: string;
	};
	try {
		const firstBrace = raw.indexOf("{");
		const lastBrace = raw.lastIndexOf("}");
		if (firstBrace === -1 || lastBrace === -1)
			throw new Error("No JSON object found");
		const jsonStr = raw.slice(firstBrace, lastBrace + 1);
		try {
			result = JSON.parse(jsonStr);
		} catch {
			const passMatch = jsonStr.match(/"pass"\s*:\s*(true|false)/);
			const pass = passMatch ? passMatch[1] === "true" : false;
			result = {
				pass,
				violations: [],
				summary: "JSON parse failed — review raw output. pass=" + pass,
			};
			console.log("⚠️  Partial JSON parse — extracted pass=" + pass);
		}
	} catch {
		console.error(`Failed to parse response as JSON (${elapsed}s):`);
		console.log(raw);
		process.exit(1);
	}

	console.log(`Done in ${elapsed}s\n`);

	const critical = result.violations.filter((v) => v.severity === "critical");
	const warnings = result.violations.filter((v) => v.severity === "warning");

	if (result.pass) {
		console.log("✅ PASS");
	} else {
		console.log("❌ FAIL");
	}
	console.log(`   ${critical.length} critical, ${warnings.length} warnings\n`);

	if (critical.length > 0) {
		console.log("CRITICAL:");
		for (const v of critical) {
			console.log(`  [${v.category}] ${v.location}`);
			console.log(`    Issue: ${v.issue}`);
			console.log(`    Fix: ${v.suggestion}\n`);
		}
	}

	if (warnings.length > 0) {
		console.log("WARNINGS:");
		for (const v of warnings) {
			console.log(`  [${v.category}] ${v.location}`);
			console.log(`    Issue: ${v.issue}`);
			console.log(`    Fix: ${v.suggestion}\n`);
		}
	}

	console.log(`Summary: ${result.summary}`);

	// Exit with code 1 if failed
	if (!result.pass) process.exit(1);
}

const cliArgs = process.argv.slice(2);
let filePath = "";
let researchFile: string | undefined;

for (let i = 0; i < cliArgs.length; i++) {
	if (cliArgs[i] === "--research") {
		const next = cliArgs[i + 1];
		if (!next || next.startsWith("-")) {
			console.error(
				"Usage: npx tsx scripts/fact-check.ts <article.md> [--research <research.md>]",
			);
			process.exit(1);
		}
		researchFile = next;
		i++;
	} else if (!filePath) {
		filePath = cliArgs[i];
	}
}

if (!filePath) {
	console.error(
		"Usage: npx tsx scripts/fact-check.ts <article.md> [--research <research.md>]",
	);
	process.exit(1);
}
factCheck(filePath, researchFile);
