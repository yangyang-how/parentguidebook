#!/usr/bin/env npx tsx
/**
 * Style Linter — checks for inclusive language, bias, and stereotypes.
 * Works on both EN and ZH articles.
 *
 * Usage:
 *   npx tsx scripts/lint.ts src/content/articles/en/white-pupil-leukocoria.md
 *   npx tsx scripts/lint.ts src/content/articles/zh/white-pupil-leukocoria.md
 */
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';

const MODEL = 'claude-haiku-4-5';

// Load inclusive language guidelines from file
function loadGuidelines(): string {
  const guidelinesPath = join(dirname(dirname(resolve(import.meta.url.replace('file://', '')))), 'guidelines', 'inclusive-language.md');
  // Fallback: try relative to cwd
  const paths = [
    guidelinesPath,
    resolve('guidelines/inclusive-language.md'),
    resolve(join(dirname(process.argv[1] || ''), '..', 'guidelines', 'inclusive-language.md')),
  ];
  for (const p of paths) {
    if (existsSync(p)) return readFileSync(p, 'utf-8');
  }
  console.error('Could not find guidelines/inclusive-language.md');
  process.exit(1);
}

const GUIDELINES = loadGuidelines();

const SYSTEM_PROMPT = `You are an inclusive language linter for Parent Guidebook (parentguidebook.org), a bilingual health education site for parents. Your job is to scan articles for bias, stereotypes, and non-inclusive language.

## Guidelines

You check against these specific guidelines:

${GUIDELINES}

## What you check

For each of the 8 categories in the guidelines above, scan the article for violations. Specifically look for:

1. **Family structure** — 父母 instead of 家长, assumptions about two-parent households, gendered caregiver assumptions
2. **Gender roles** — gendered pronouns for generic caregivers, stereotyped task assignments
3. **Disability language** — non-person-first language, "suffers from", "defect", "normal vs disabled"
4. **Blame & guilt** — "if only you had", "you should have noticed", parenting-choice blame
5. **Emotional register** — dismissive ("don't worry"), alarmist ("terrifying"), militaristic ("fight/battle")
6. **Socioeconomic assumptions** — assuming access to specialists, transportation, insurance
7. **Cultural sensitivity** — centering one region, mocking traditional medicine, political commentary
8. **Age & development** — "developmentally delayed" as label, "normal" as benchmark, rigid milestone language

## What you do NOT check

- Medical accuracy (that's the fact checker's job)
- Translation alignment (that's the auditor's job)
- Grammar or spelling

## Output format

Return a JSON object:
{
  "pass": true/false,
  "violations": [
    {
      "severity": "critical" | "warning",
      "category": "family_structure" | "gender_roles" | "disability_language" | "blame_guilt" | "emotional_register" | "socioeconomic" | "cultural_sensitivity" | "age_development",
      "location": "the specific text that violates (quote it)",
      "issue": "what guideline it violates",
      "suggestion": "replacement text or approach"
    }
  ],
  "summary": "1-2 sentence overall assessment"
}

- "critical" = clear bias, stereotype, or harmful language that must be fixed
- "warning" = could be improved but not harmful
- Passes only if ZERO critical violations
- Return ONLY the JSON, no other text`;

async function lint(articlePath: string) {
  const absPath = resolve(articlePath);
  if (!existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  const content = readFileSync(absPath, 'utf-8');
  const client = new Anthropic();

  console.log(`Linting: ${absPath}`);
  console.log(`Using model: ${MODEL}`);
  const start = Date.now();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Check this article for inclusive language violations:\n\n${content}`,
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
      console.log(`  [${v.category}] "${v.location}"`);
      console.log(`    Issue: ${v.issue}`);
      console.log(`    Fix: ${v.suggestion}\n`);
    }
  }

  if (warnings.length > 0) {
    console.log('WARNINGS:');
    for (const v of warnings) {
      console.log(`  [${v.category}] "${v.location}"`);
      console.log(`    Issue: ${v.issue}`);
      console.log(`    Fix: ${v.suggestion}\n`);
    }
  }

  console.log(`Summary: ${result.summary}`);

  if (!result.pass) process.exit(1);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: npx tsx scripts/lint.ts <article.md>');
  process.exit(1);
}
lint(filePath);
