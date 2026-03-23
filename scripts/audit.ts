#!/usr/bin/env npx tsx
/**
 * Auditor — compares ZH translation against EN original for alignment.
 * Ensures nothing is added, removed, softened, or strengthened.
 *
 * Usage:
 *   npx tsx scripts/audit.ts src/content/articles/en/white-pupil-leukocoria.md src/content/articles/zh/white-pupil-leukocoria.md
 */
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const MODEL = 'claude-sonnet-4-6';

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

## What you do NOT check

- Whether the facts themselves are correct (that's the fact checker's job)
- Inclusive language, bias, or stereotypes (that's the linter's job)
- Whether the Chinese reads naturally (subjective style)

## Output format

Return a JSON object:
{
  "pass": true/false,
  "violations": [
    {
      "severity": "critical" | "warning",
      "category": "omission" | "addition" | "meaning_drift" | "citation_mismatch" | "structural" | "frontmatter",
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

async function audit(enPath: string, zhPath: string) {
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

  const enContent = readFileSync(enAbs, 'utf-8');
  const zhContent = readFileSync(zhAbs, 'utf-8');
  const client = new Anthropic();

  console.log(`Auditing:`);
  console.log(`  EN: ${enAbs}`);
  console.log(`  ZH: ${zhAbs}`);
  console.log(`Using model: ${MODEL}`);
  const start = Date.now();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Compare these two articles for translation alignment.\n\n## ENGLISH ORIGINAL\n\n${enContent}\n\n---\n\n## CHINESE TRANSLATION\n\n${zhContent}`,
      },
    ],
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock?.type === 'text' ? textBlock.text : '';

  let result: { pass: boolean; violations: Array<{ severity: string; category: string; en_location: string; zh_location: string; issue: string; suggestion: string }>; summary: string };
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
      console.log(`  [${v.category}] EN: ${v.en_location} → ZH: ${v.zh_location}`);
      console.log(`    Issue: ${v.issue}`);
      console.log(`    Fix: ${v.suggestion}\n`);
    }
  }

  if (warnings.length > 0) {
    console.log('WARNINGS:');
    for (const v of warnings) {
      console.log(`  [${v.category}] EN: ${v.en_location} → ZH: ${v.zh_location}`);
      console.log(`    Issue: ${v.issue}`);
      console.log(`    Fix: ${v.suggestion}\n`);
    }
  }

  console.log(`Summary: ${result.summary}`);

  if (!result.pass) process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: npx tsx scripts/audit.ts <en-article.md> <zh-article.md>');
  process.exit(1);
}
audit(args[0], args[1]);
