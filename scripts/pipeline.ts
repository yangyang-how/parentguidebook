#!/usr/bin/env npx tsx
/**
 * Content Pipeline — orchestrates the full review process.
 *
 * Usage:
 *   npx tsx scripts/pipeline.ts research --domain eyes --stage 0-1mo
 *     → gather sources and produce a research brief
 *
 *   npx tsx scripts/pipeline.ts check-en src/content/articles/en/article.md
 *     → verify research exists, then fact-check + lint the EN article
 *
 *   npx tsx scripts/pipeline.ts translate src/content/articles/en/article.md
 *     → translate EN→ZH, then fact-check ZH, audit ZH vs EN, lint both
 *
 *   npx tsx scripts/pipeline.ts review src/content/articles/en/article.md
 *     → full pipeline: verify research, fact-check EN, lint EN, translate,
 *       fact-check ZH, audit, lint ZH
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

const MAX_RETRIES = 2;

function run(cmd: string, label: string): boolean {
	console.log(`\n${"=".repeat(60)}`);
	console.log(`▶ ${label}`);
	console.log("=".repeat(60));
	try {
		execSync(cmd, { stdio: "inherit", timeout: 600_000 });
		return true;
	} catch {
		return false;
	}
}

function getZhPath(enPath: string): string {
	const abs = resolve(enPath);
	const dir = dirname(abs);
	const zhDir = dir.replace(/\/en(\/?)$/, "/zh$1");
	return resolve(zhDir, basename(abs));
}

/**
 * Extract domain and stage from article frontmatter.
 * Returns { domain, stage, isOverview } or null if not parseable.
 */
function parseFrontmatter(
	articlePath: string,
): { domain: string; stage: string; isOverview: boolean } | null {
	const content = readFileSync(resolve(articlePath), "utf-8");
	const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!fmMatch) return null;

	const fm = fmMatch[1];
	const domainMatch = fm.match(/^domain:\s*"?([^"\n]+)"?/m);
	const stageMatch = fm.match(/^stage:\s*"?([^"\n]+)"?/m);
	const overviewMatch = fm.match(/^is_overview:\s*(true)/m);

	if (!domainMatch) return null;

	return {
		domain: domainMatch[1].trim(),
		stage: stageMatch ? stageMatch[1].trim() : "",
		isOverview: !!overviewMatch,
	};
}

/**
 * Get the research file path for an article.
 */
function getResearchPath(
	domain: string,
	stage: string,
	isOverview: boolean,
): string {
	const filename = isOverview ? "overview" : stage;
	return resolve(`src/content/research/${domain}/${filename}.md`);
}

/**
 * Verify that a research file exists for the given article.
 * Returns the research file path if found, or null.
 */
function verifyResearch(articlePath: string): string | null {
	const meta = parseFrontmatter(articlePath);
	if (!meta) {
		return null;
	}

	const researchPath = getResearchPath(
		meta.domain,
		meta.stage,
		meta.isOverview,
	);

	if (!existsSync(researchPath)) {
		return null;
	}

	return researchPath;
}

function checkResearch(articlePath: string): boolean {
	console.log("\n📋 PHASE 0: Research Verification\n");

	const researchPath = verifyResearch(articlePath);
	if (!researchPath) {
		const meta = parseFrontmatter(articlePath);
		if (!meta) {
			console.log("❌ Cannot determine domain/stage from article frontmatter.");
			return false;
		}

		if (!meta.isOverview && !meta.stage) {
			console.log(
				"❌ Article has no `stage` and is not marked `is_overview: true`.",
			);
			console.log(
				'   Add `stage: "<stage-slug>"` or `is_overview: true` to frontmatter.',
			);
			return false;
		}

		const expectedPath = getResearchPath(
			meta.domain,
			meta.stage,
			meta.isOverview,
		);
		console.log("❌ RESEARCH FILE NOT FOUND");
		console.log(`   Expected: ${expectedPath}`);
		console.log("");
		console.log("   No article should be written without research.");
		console.log("   Run the research stage first:");
		console.log("");
		if (meta.isOverview) {
			console.log(
				`   npx tsx scripts/pipeline.ts research --domain ${meta.domain} --overview`,
			);
		} else {
			console.log(
				`   npx tsx scripts/pipeline.ts research --domain ${meta.domain} --stage ${meta.stage}`,
			);
		}
		return false;
	}

	console.log(`✅ Research file found: ${researchPath}`);
	return true;
}

function checkEn(enPath: string, researchPath: string | null): boolean {
	console.log("\n📋 PHASE 1: English Article Review\n");

	// Pass research file to fact-checker if available (quote paths for shell safety)
	const q = (s: string) => `'${s.replace(/'/g, "'\\''")}'`;
	const researchArg = researchPath ? ` --research ${q(researchPath)}` : "";

	if (
		!run(
			`npx tsx scripts/fact-check.ts ${q(enPath)}${researchArg}`,
			"Fact-checking EN article" +
				(researchPath ? " (with research cross-reference)" : ""),
		)
	) {
		console.log("\n❌ EN fact check FAILED. Fix the issues and re-run.");
		return false;
	}

	if (!run(`npx tsx scripts/lint.ts ${enPath}`, "Linting EN article")) {
		console.log("\n❌ EN lint FAILED. Fix the issues and re-run.");
		return false;
	}

	console.log("\n✅ EN article passed all checks.");
	return true;
}

function translateAndReview(enPath: string): boolean {
	const zhPath = getZhPath(enPath);

	// Phase 2: Translate
	console.log("\n📋 PHASE 2: Translation\n");

	for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
		if (attempt > 1) {
			console.log(`\n🔄 Translation retry ${attempt - 1}/${MAX_RETRIES}`);
		}

		if (!run(`npx tsx scripts/translate.ts ${enPath}`, "Translating EN → ZH")) {
			console.log("\n❌ Translation failed.");
			if (attempt > MAX_RETRIES) return false;
			continue;
		}

		// Phase 3: Fact-check ZH
		console.log("\n📋 PHASE 3: ZH Fact Check\n");

		if (
			!run(
				`npx tsx scripts/fact-check.ts ${zhPath}`,
				"Fact-checking ZH article",
			)
		) {
			console.log("\n❌ ZH fact check FAILED. Re-translating...");
			if (attempt > MAX_RETRIES) {
				console.log("Max retries reached. Manual review required.");
				return false;
			}
			continue;
		}

		break;
	}

	// Phase 4: Audit ZH vs EN
	console.log("\n📋 PHASE 4: Translation Audit\n");

	if (
		!run(
			`npx tsx scripts/audit.ts ${enPath} ${zhPath}`,
			"Auditing ZH vs EN alignment",
		)
	) {
		console.log("\n❌ Audit FAILED. ZH translation has alignment issues.");
		console.log("Manual review required — check the violations above.");
		return false;
	}

	// Phase 5: Lint both
	console.log("\n📋 PHASE 5: Inclusive Language Check\n");

	if (!run(`npx tsx scripts/lint.ts ${enPath}`, "Linting EN article")) {
		console.log("\n❌ EN lint FAILED.");
		return false;
	}

	if (!run(`npx tsx scripts/lint.ts ${zhPath}`, "Linting ZH article")) {
		console.log("\n❌ ZH lint FAILED.");
		return false;
	}

	console.log("\n" + "=".repeat(60));
	console.log("✅ ALL CHECKS PASSED — both articles ready for human review");
	console.log("=".repeat(60));
	console.log(`\n  EN: ${resolve(enPath)}`);
	console.log(`  ZH: ${zhPath}\n`);
	return true;
}

// --- CLI ---
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
	console.log(`Content Pipeline — Parent Guidebook

Usage:
  npx tsx scripts/pipeline.ts research --domain <domain> --stage <stage>
    Gather sources and produce a research brief

  npx tsx scripts/pipeline.ts research --domain <domain> --overview
    Research a domain overview

  npx tsx scripts/pipeline.ts check-en <en-article.md>
    Verify research exists, fact-check and lint an English article

  npx tsx scripts/pipeline.ts translate <en-article.md>
    Translate EN→ZH, then fact-check, audit, and lint

  npx tsx scripts/pipeline.ts review <en-article.md>
    Full pipeline: verify research, check EN, translate, check ZH, audit, lint

Pipeline order:
  1. research   → gather evidence (MUST come before writing)
  2. review     → validate EN, translate, validate ZH (run after writing EN article)`);
	process.exit(1);
}

if (command === "research") {
	// Forward to research script
	const researchArgs = args.slice(1).join(" ");
	if (!researchArgs) {
		console.error(
			"Usage: npx tsx scripts/pipeline.ts research --domain <domain> --stage <stage>",
		);
		console.error(
			"       npx tsx scripts/pipeline.ts research --domain <domain> --overview",
		);
		process.exit(1);
	}
	const ok = run(
		`npx tsx scripts/research.ts ${researchArgs}`,
		"Researching sources",
	);
	process.exit(ok ? 0 : 1);
}

const filePath = args[1];
if (!filePath) {
	console.error(
		`Usage: npx tsx scripts/pipeline.ts ${command} <en-article.md>`,
	);
	process.exit(1);
}

if (!existsSync(resolve(filePath))) {
	console.error(`File not found: ${resolve(filePath)}`);
	process.exit(1);
}

switch (command) {
	case "check-en": {
		if (!checkResearch(filePath)) process.exit(1);
		const researchPath = verifyResearch(filePath);
		const ok = checkEn(filePath, researchPath);
		process.exit(ok ? 0 : 1);
		break;
	}
	case "translate": {
		const ok = translateAndReview(filePath);
		process.exit(ok ? 0 : 1);
		break;
	}
	case "review": {
		if (!checkResearch(filePath)) process.exit(1);
		const researchPath = verifyResearch(filePath);
		if (!checkEn(filePath, researchPath)) process.exit(1);
		const ok = translateAndReview(filePath);
		process.exit(ok ? 0 : 1);
		break;
	}
	default:
		console.error(`Unknown command: ${command}`);
		console.error("Commands: research, check-en, translate, review");
		process.exit(1);
}
