#!/usr/bin/env npx tsx
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
/**
 * Auditor — compares ZH translation against EN original for alignment.
 * Ensures nothing is added, removed, softened, or strengthened.
 *
 * Usage:
 *   npx tsx scripts/audit.ts src/content/articles/en/white-pupil-leukocoria.md src/content/articles/zh/white-pupil-leukocoria.md
 */
import { callClaude, extractJson } from "./lib/claude.ts";

const SYSTEM_PROMPT = `You are a translation auditor for Parent Guidebook (parentguidebook.org). You compare an English original article against its Chinese (zh-Hans) translation to verify they are aligned and faithful.

## What you check

1. **Completeness** — Every section, paragraph, bullet point, and piece of information in the EN version must be present in the ZH version. Nothing should be omitted.

2. **No additions** — The ZH version should not contain medical claims, statistics, or recommendations that are not in the EN version. The only acceptable additions are:
   - Regional screening information for China/Taiwan (when the EN version mentions other countries' screening programs)
   - Chinese-language glosses for medical terms
   - Pronunciation guides for medical terminology

3. **Meaning preservation** — Check that:
   - Urgency levels are preserved (if EN says "see a doctor within days", ZH should convey equal urgency)
   - Statistics are identical (60% stays 60%, not "about half" or "most")
   - Medical terms are correctly translated (not confused with similar conditions)
   - Ages, timelines, dosages are exact
   - Recommendations are neither softened nor strengthened
   - Emotional tone is comparable (reassuring stays reassuring, urgent stays urgent)

4. **Citation alignment** — Every [Source: srcN] in the EN must have a corresponding [来源：srcN] in the ZH at the equivalent location. Check that:
   - Same number of citations in both versions
   - Citations appear at the same logical points
   - Source list entries correspond correctly

5. **Structural alignment** — Check that:
   - Same heading hierarchy
   - Same number of sections
   - Same bullet point structure
   - Tables match (same rows, same columns, same data)
   - Internal links are correctly translated (/en/... → /zh/...)

6. **Frontmatter** — Check that:
   - title is translated (not kept in English)
   - lang is "zh-Hans" (not "en")
   - domain, category, urgency, last_updated, age_groups are identical to EN

7. **Naturalness** — The Chinese version must read as if it were originally written in Chinese by a native Chinese speaker, not translated from English. Check for:
   - Sentence structures that follow English grammar patterns instead of Chinese ones (e.g., long subordinate clauses before the main verb, passive voice overuse, subject-heavy sentences that Chinese would express with topic-comment structure)
   - Word choices that are literal translations rather than natural Chinese expressions (e.g., translating "make sure" as "确保" when "记得" or simply restructuring would be more natural)
   - Awkward collocations that a native speaker would never use
   - Sentences that feel stiff, formal, or "translated" — even if technically correct
   - If a sentence could appear in a translated UN document but not in a Chinese parenting magazine, it needs rewriting
   - English idioms/metaphors that don't exist in Chinese must be replaced with natural Chinese expressions, NOT literally translated. For example, "milk-drunk face" is an English parenting idiom — Chinese parents would say "吃饱后满足的小脸" not "醉醺醺的脸". "Feature, not a bug" is an English tech metaphor — find an equivalent Chinese expression or explain the concept plainly.

   When suggesting fixes for naturalness issues, your suggestions MUST:
   - Sound like something a Chinese parent or parenting magazine would actually write
   - Not introduce new metaphors that are equally unnatural (e.g., don't replace one awkward metaphor with another)
   - Prefer plain, warm, colloquial Chinese over clever wordplay
   - Consider: would a 30-year-old Chinese parent in Beijing or Taipei say this out loud? If not, rewrite it.

8. **Clarity and unambiguity** — Every sentence in the Chinese version must have exactly one possible interpretation. A Chinese reader should be immediately clear about what is being said. Check for:
   - Pronouns with unclear referents (especially when 宝宝 and 家长 appear in the same paragraph — who does "应该" refer to?)
   - Medical instructions that could be misread (e.g., "每天3到6次" — 3 to 6 times per day, or 3 times to 6 times? Use "每天3至6次" for unambiguity)
   - Negations that could be misunderstood (e.g., double negatives, or "不一定不" constructions)
   - Sentences where the subject/object relationship is unclear due to Chinese allowing subject-dropping
   - Quantifier scope ambiguity (e.g., "所有孩子不需要" vs "不是所有孩子都需要")
   - Any sentence where a worried, sleep-deprived parent reading at 3am might misunderstand what to do

## What you do NOT check

- Whether the facts themselves are correct (that's the fact checker's job)
- Inclusive language, bias, or stereotypes (that's the linter's job)

## Output format

Return a JSON object:
{
  "pass": true/false,
  "violations": [
    {
      "severity": "critical" | "warning",
      "category": "omission" | "addition" | "meaning_drift" | "citation_mismatch" | "structural" | "frontmatter" | "naturalness" | "ambiguity",
      "en_location": "where in the EN article",
      "zh_location": "where in the ZH article (or 'missing')",
      "issue": "what's wrong",
      "suggestion": "how to fix it"
    }
  ],
  "summary": "1-2 sentence overall assessment"
}

- "critical" = content omitted, meaning changed, or facts altered
- "warning" = minor structural difference, acceptable variation
- Passes only if ZERO critical violations
- Return ONLY the JSON, no other text`;

function audit(enPath: string, zhPath: string) {
	const enAbs = resolve(enPath);
	const zhAbs = resolve(zhPath);

	if (!existsSync(enAbs)) {
		console.error(`EN file not found: ${enAbs}`);
		process.exit(1);
	}
	if (!existsSync(zhAbs)) {
		console.error(`ZH file not found: ${zhAbs}`);
		process.exit(1);
	}

	const enContent = readFileSync(enAbs, "utf-8");
	const zhContent = readFileSync(zhAbs, "utf-8");

	console.log(`Auditing:`);
	console.log(`  EN: ${enAbs}`);
	console.log(`  ZH: ${zhAbs}`);
	console.log(`Using model: sonnet`);
	const start = Date.now();

	const raw = callClaude({
		model: "sonnet",
		systemPrompt: SYSTEM_PROMPT,
		userMessage: `Compare these two articles for translation alignment.\n\n## ENGLISH ORIGINAL\n\n${enContent}\n\n---\n\n## CHINESE TRANSLATION\n\n${zhContent}`,
		timeout: 600_000,
	});

	const elapsed = ((Date.now() - start) / 1000).toFixed(1);

	let result: {
		pass: boolean;
		violations: Array<{
			severity: string;
			category: string;
			en_location: string;
			zh_location: string;
			issue: string;
			suggestion: string;
		}>;
		summary: string;
	};
	try {
		result = extractJson<typeof result>(raw);
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
			console.log(
				`  [${v.category}] EN: ${v.en_location} → ZH: ${v.zh_location}`,
			);
			console.log(`    Issue: ${v.issue}`);
			console.log(`    Fix: ${v.suggestion}\n`);
		}
	}

	if (warnings.length > 0) {
		console.log("WARNINGS:");
		for (const v of warnings) {
			console.log(
				`  [${v.category}] EN: ${v.en_location} → ZH: ${v.zh_location}`,
			);
			console.log(`    Issue: ${v.issue}`);
			console.log(`    Fix: ${v.suggestion}\n`);
		}
	}

	console.log(`Summary: ${result.summary}`);

	if (!result.pass) process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) {
	console.error(
		"Usage: npx tsx scripts/audit.ts <en-article.md> <zh-article.md>",
	);
	process.exit(1);
}
audit(args[0], args[1]);
