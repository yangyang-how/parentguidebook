#!/usr/bin/env npx tsx
/**
 * Fact Checker — verifies medical claims, statistics, and source citations.
 * Works on both EN and ZH articles.
 *
 * Usage:
 *   npx tsx scripts/fact-check.ts src/content/articles/en/white-pupil-leukocoria.md
 */
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MODEL = 'claude-opus-4-6';

const SYSTEM_PROMPT = `You are a medical fact checker for Parent Guidebook (parentguidebook.org), a bilingual health education site for parents. Your job is to verify the factual accuracy of articles about children's health.

## What you check

1. **Statistics and numbers** — Every percentage, age range, incidence rate, and timeline must be plausible and consistent with medical literature. Flag any number that seems wrong, exaggerated, or unsupported.

2. **Source citations** — Every claim tagged with [Source: srcN] or [来源：srcN] must be supported by the cited source listed at the bottom. Check that:
   - Every cited source in the text has a corresponding entry in the Sources section
   - Source entries look like real, verifiable publications (real journals, real organizations, plausible URLs)
   - Claims match what the cited source would reasonably say
   - No orphaned citations (srcN referenced but not listed) or unused sources (listed but never referenced)

3. **Medical accuracy** — Check for:
   - Correct medical terminology and definitions
   - Accurate descriptions of conditions, symptoms, and treatments
   - No dangerous oversimplifications (e.g., claiming something is harmless when it may not be)
   - No dangerous overstatements (e.g., claiming something is always fatal when survival rates are high)
   - Treatment timelines and urgency levels that align with medical consensus
   - Correct anatomy and physiology descriptions

4. **Recommendation safety** — Check that:
   - Urgency of recommendations matches the condition (critical conditions = "see doctor within days", not "consider mentioning at next visit")
   - No recommendations that could delay necessary treatment
   - No recommendations that could cause unnecessary panic
   - Medical disclaimers are present and appropriate

5. **Internal consistency** — Check that:
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
      "category": "statistic" | "citation" | "medical_accuracy" | "recommendation_safety" | "internal_consistency",
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

async function factCheck(articlePath: string) {
  const absPath = resolve(articlePath);
  if (!existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  const content = readFileSync(absPath, 'utf-8');
  const client = new Anthropic();

  console.log(`Fact-checking: ${absPath}`);
  console.log(`Using model: ${MODEL}`);
  const start = Date.now();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Fact-check this article:\n\n${content}`,
      },
    ],
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock?.type === 'text' ? textBlock.text : '';

  let result: { pass: boolean; violations: Array<{ severity: string; category: string; location: string; issue: string; suggestion: string }>; summary: string };
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    result = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    console.error(`Failed to parse response as JSON (${elapsed}s):`);
    console.log(raw);
    process.exit(1);
  }

  console.log(`Done in ${elapsed}s\n`);

  const critical = result.violations.filter((v) => v.severity === 'critical');
  const warnings = result.violations.filter((v) => v.severity === 'warning');

  if (result.pass) {
    console.log('✅ PASS');
  } else {
    console.log('❌ FAIL');
  }
  console.log(`   ${critical.length} critical, ${warnings.length} warnings\n`);

  if (critical.length > 0) {
    console.log('CRITICAL:');
    for (const v of critical) {
      console.log(`  [${v.category}] ${v.location}`);
      console.log(`    Issue: ${v.issue}`);
      console.log(`    Fix: ${v.suggestion}\n`);
    }
  }

  if (warnings.length > 0) {
    console.log('WARNINGS:');
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

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: npx tsx scripts/fact-check.ts <article.md>');
  process.exit(1);
}
factCheck(filePath);
