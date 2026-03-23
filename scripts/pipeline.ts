#!/usr/bin/env npx tsx
/**
 * Content Pipeline — orchestrates the full review process.
 *
 * Usage:
 *   npx tsx scripts/pipeline.ts check-en src/content/articles/en/article.md
 *     → fact-check + lint the EN article
 *
 *   npx tsx scripts/pipeline.ts translate src/content/articles/en/article.md
 *     → translate EN→ZH, then fact-check ZH, audit ZH vs EN, lint both
 *
 *   npx tsx scripts/pipeline.ts review src/content/articles/en/article.md
 *     → full pipeline: fact-check EN, lint EN, translate, fact-check ZH, audit, lint ZH
 */
import { execSync } from 'node:child_process';
import { resolve, dirname, basename } from 'node:path';
import { existsSync } from 'node:fs';

const MAX_RETRIES = 2;

function run(cmd: string, label: string): boolean {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`▶ ${label}`);
  console.log('='.repeat(60));
  try {
    execSync(cmd, { stdio: 'inherit', timeout: 300_000 });
    return true;
  } catch {
    return false;
  }
}

function getZhPath(enPath: string): string {
  const abs = resolve(enPath);
  const dir = dirname(abs);
  const zhDir = dir.replace(/\/en(\/?)$/, '/zh$1');
  return resolve(zhDir, basename(abs));
}

function checkEn(enPath: string): boolean {
  console.log('\n📋 PHASE 1: English Article Review\n');

  if (!run(`npx tsx scripts/fact-check.ts ${enPath}`, 'Fact-checking EN article')) {
    console.log('\n❌ EN fact check FAILED. Fix the issues and re-run.');
    return false;
  }

  if (!run(`npx tsx scripts/lint.ts ${enPath}`, 'Linting EN article')) {
    console.log('\n❌ EN lint FAILED. Fix the issues and re-run.');
    return false;
  }

  console.log('\n✅ EN article passed all checks.');
  return true;
}

function translateAndReview(enPath: string): boolean {
  const zhPath = getZhPath(enPath);

  // Phase 2: Translate
  console.log('\n📋 PHASE 2: Translation\n');

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    if (attempt > 1) {
      console.log(`\n🔄 Translation retry ${attempt - 1}/${MAX_RETRIES}`);
    }

    if (!run(`npx tsx scripts/translate.ts ${enPath}`, 'Translating EN → ZH')) {
      console.log('\n❌ Translation failed.');
      if (attempt > MAX_RETRIES) return false;
      continue;
    }

    // Phase 3: Fact-check ZH
    console.log('\n📋 PHASE 3: ZH Fact Check\n');

    if (!run(`npx tsx scripts/fact-check.ts ${zhPath}`, 'Fact-checking ZH article')) {
      console.log('\n❌ ZH fact check FAILED. Re-translating...');
      if (attempt > MAX_RETRIES) {
        console.log('Max retries reached. Manual review required.');
        return false;
      }
      continue;
    }

    break;
  }

  // Phase 4: Audit ZH vs EN
  console.log('\n📋 PHASE 4: Translation Audit\n');

  if (!run(`npx tsx scripts/audit.ts ${enPath} ${zhPath}`, 'Auditing ZH vs EN alignment')) {
    console.log('\n❌ Audit FAILED. ZH translation has alignment issues.');
    console.log('Manual review required — check the violations above.');
    return false;
  }

  // Phase 5: Lint both
  console.log('\n📋 PHASE 5: Inclusive Language Check\n');

  if (!run(`npx tsx scripts/lint.ts ${enPath}`, 'Linting EN article')) {
    console.log('\n❌ EN lint FAILED.');
    return false;
  }

  if (!run(`npx tsx scripts/lint.ts ${zhPath}`, 'Linting ZH article')) {
    console.log('\n❌ ZH lint FAILED.');
    return false;
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL CHECKS PASSED — both articles ready for human review');
  console.log('='.repeat(60));
  console.log(`\n  EN: ${resolve(enPath)}`);
  console.log(`  ZH: ${zhPath}\n`);
  return true;
}

// --- CLI ---
const [command, filePath] = process.argv.slice(2);

if (!command || !filePath) {
  console.log(`Content Pipeline — Parent Guidebook

Usage:
  npx tsx scripts/pipeline.ts check-en <en-article.md>
    Fact-check and lint an English article

  npx tsx scripts/pipeline.ts translate <en-article.md>
    Translate EN→ZH, then fact-check, audit, and lint

  npx tsx scripts/pipeline.ts review <en-article.md>
    Full pipeline: check EN, translate, check ZH, audit, lint both`);
  process.exit(1);
}

if (!existsSync(resolve(filePath))) {
  console.error(`File not found: ${resolve(filePath)}`);
  process.exit(1);
}

switch (command) {
  case 'check-en': {
    const ok = checkEn(filePath);
    process.exit(ok ? 0 : 1);
    break;
  }
  case 'translate': {
    const ok = translateAndReview(filePath);
    process.exit(ok ? 0 : 1);
    break;
  }
  case 'review': {
    if (!checkEn(filePath)) process.exit(1);
    const ok = translateAndReview(filePath);
    process.exit(ok ? 0 : 1);
    break;
  }
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Commands: check-en, translate, review');
    process.exit(1);
}
