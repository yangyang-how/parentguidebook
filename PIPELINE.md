# Content Pipeline — Parent Guidebook

Every article goes through these stages **in order**. Each stage is run by Claude Code in-session (or via agents). No external API calls or scripts needed.

**Fail-closed:** An article cannot proceed to the next stage until all critical violations from the current stage are resolved.

---

## Stage 0: Research

**When:** Before writing any article.
**Gate:** A research file must exist at `src/content/research/<domain>/<stage>.md` (or `overview.md`).

Research files are written directly in Claude Code sessions using web search. Each file must contain:
- Research brief (summary of evidence)
- 8–15 sources with key passages
- Claims checklist (every factual claim the article should make, with source numbers)
- Suggested outline with source cross-references
- Red flags and nuances

**No article may be written without a research file.**

---

## Stage 1: Write EN Article

**When:** After research file exists.
**Output:** `src/content/articles/en/<slug>.md`

### Frontmatter schema
```yaml
---
title: "Article Title"
lang: "en"
domain: "<domain-slug>"
category: "guides"
urgency: "critical" | "important" | "good-to-know"
last_updated: "YYYY-MM-DD"
age_groups: ["<stage-slug>"]
stage: "<stage-slug>"           # for cell articles
hook: "One-line card description (≤80 chars)"
is_overview: false              # true only for domain overview articles
---
```

### Article structure
1. Title as H1
2. Quick Summary box (30 seconds) with urgency indicator
3. Narrative sections with `[Source: srcN]` citations
4. Warning signs with red/yellow triage levels
5. Medical disclaimer
6. Sources list (numbered, with URLs)

### Style
- Voice: Clinical-warm — like a knowledgeable pediatrician who is also a parent
- Urgency through facts, not emotion
- Address parent anxiety directly and compassionately
- Short paragraphs, clear headings

---

## Stage 2: Fact-Check EN

**When:** After EN article is written.
**Executor:** Claude Code agent or in-session review.
**Gate:** Zero critical violations.

### What to check

1. **Statistics and numbers** — Every percentage, age range, incidence rate, and timeline must be plausible and consistent with the research file. Flag any number that seems wrong, exaggerated, or unsupported.

2. **Source citations** — Every `[Source: srcN]` must:
   - Have a corresponding entry in the Sources section
   - Look like a real, verifiable publication
   - Actually support the claim being made
   - No orphaned citations (referenced but not listed) or unused sources (listed but never referenced)

3. **Research cross-reference** — Cross-reference claims against the research file:
   - Every major factual claim must trace back to a source passage in the research
   - No medical claims absent from the research
   - Claims not distorted or exaggerated relative to source passages

4. **Medical accuracy** — Check for:
   - Correct terminology and definitions
   - Accurate descriptions of conditions, symptoms, treatments
   - No dangerous oversimplifications or overstatements
   - Treatment timelines and urgency aligned with medical consensus

5. **Recommendation safety** — Check that:
   - Urgency matches the condition (critical = "see doctor within days")
   - No recommendations that could delay necessary treatment or cause unnecessary panic
   - Medical disclaimer present

6. **Internal consistency** — Same condition described the same way throughout; numbers don't contradict each other.

### Severity
- **Critical** = factual errors, dangerous claims, missing citations → must fix
- **Warning** = imprecise phrasing, minor inconsistencies → should review

---

## Stage 3: Translate EN → ZH

**When:** After EN fact-check passes.
**Executor:** Claude Code agent.
**Output:** `src/content/articles/zh/<slug>.md`

### Voice: Clinical-Warm
Write like a knowledgeable, empathetic pediatrician who is also a parent. NOT clinical-cold (textbook), NOT literary (essay).

### Translation rules (all mandatory)

1. **Natural Chinese prose** — restructure for Chinese reading flow. NOT word-for-word. Each sentence should feel originally written in Chinese.

2. **Medical terms** — standard Chinese first, English in parentheses only for uncommon terms. Common terms (白内障, 青光眼, 斜视, 弱视, 近视) need no English gloss.

3. **Tone and pronouns:**
   - Use 你 (not 您)
   - Use 家长 (not 父母)
   - Avoid ALL gendered pronouns (他/她/他们/她们/他的/她的) for generic children — use 宝宝, 孩子, or drop subject

4. **Direct verb+object, never "带来/进行 + verbal noun"** — this is the #1 marker of translated Chinese.
   - ✅ "安抚宝宝" → ❌ "带来安抚"
   - ✅ "操作机器" → ❌ "进行一个机器的操作"

5. **Don't drop subject/object when ambiguous** — "吓宝宝一跳" not "吓一跳"

6. **Chinese word order, not English** — "出生后24小时内任何时候出现黄疸，都不是正常情况"

7. **Cut English filler** — 预期中 → just say 正常现象

8. **Don't literally translate idioms:**
   - "你不是一个人" is INSULTING in Chinese → say "有很多家长跟你一样"
   - "milk-drunk face" → "吃饱后满足得眼睛都睁不开的小脸"

9. **Balanced syllable rhythm** — "独立睡" (2+1) feels wrong → "自己睡小床"

10. **Chinese-native size references** — 乒乓球 not 高尔夫球

11. **Explain spatial relationships for novice parents** — "把尿布往下折，不要盖住脐带残端" not just "折叠尿布"

12. **No abstract metaphors without context** — "你在这个等式里也很重要" → "你自己的状态也同样重要"

### Structural rules

- Source citations: `[Source: src1]` → `[来源：src1]`
- Sources heading: "Sources" → "参考来源"
- Keep original English citation text, add Chinese org names in parentheses
- "Quick Summary (30 seconds)" → "快速摘要（30秒）"
- "Urgency" → "紧急程度"
- Internal links: `/en/` → `/zh/` (NOT `/zh-Hans/`)
- Preserve all headings, lists, tables, bold text, horizontal rules

### Frontmatter changes
- `title`: translate (punchy, warm, prefer 宝宝 over 新生儿)
- `lang`: change to `"zh-Hans"`
- `hook`: translate to Chinese (≤80 chars)
- Everything else: keep exactly as-is

### Do NOT
- Add new sections or structural elements not in the original
- Remove any medical facts, statistics, or source citations
- Change article structure or reorder sections
- Add emoji or decorative elements
- Use overly formal/literary Chinese (no 此, 故, 甚, 乃)
- Use overly casual/internet Chinese (no 哈哈, 666, 绝了)

---

## Stage 4: Audit ZH vs EN

**When:** After translation.
**Executor:** Claude Code agent or in-session review.
**Gate:** Zero critical violations.

### What to check

1. **Completeness** — every section, paragraph, bullet, and piece of information in EN must be present in ZH. Nothing omitted.

2. **No additions** — ZH should not contain claims absent from EN. Acceptable additions:
   - Regional screening info for China/Taiwan
   - Chinese-language glosses for medical terms
   - Pronunciation guides

3. **Meaning preservation:**
   - Urgency levels preserved (if EN says "see doctor within days", ZH must convey equal urgency)
   - Statistics identical (60% stays 60%)
   - Medical terms correctly translated
   - Ages, timelines, dosages exact
   - Recommendations neither softened nor strengthened

4. **Citation alignment** — every `[Source: srcN]` in EN has corresponding `[来源：srcN]` in ZH at the same logical point.

5. **Structural alignment** — same heading hierarchy, sections, bullet structure, tables. Internal links correctly changed `/en/` → `/zh/`.

6. **Frontmatter** — title translated, lang is "zh-Hans", all other fields identical to EN.

7. **Naturalness** — must read as originally written in Chinese, not translated:
   - No English sentence structures (long subordinate clauses before main verb, passive voice overuse)
   - No literal translations of idioms
   - No stiff/formal phrasing that sounds like a UN document
   - Test: would a 30-year-old Chinese parent in Beijing say this out loud?

8. **Clarity** — every sentence has exactly one possible interpretation:
   - No unclear pronoun referents
   - Medical instructions unambiguous
   - No confusing double negatives
   - A sleep-deprived parent at 3am should not misunderstand what to do

### Severity
- **Critical** = content omitted, meaning changed, facts altered
- **Warning** = minor structural difference, acceptable variation

---

## Stage 5: Lint (Inclusive Language)

**When:** After fact-check and audit pass.
**Executor:** Claude Code agent or in-session review.
**Applies to:** Both EN and ZH articles.
**Gate:** Zero critical violations.

### 8 categories to check

**1. Family structure** — 家长 not 父母, no two-parent assumptions, no gendered caregiver assumptions

**2. Gender roles** — no gendered pronouns for generic caregivers, no stereotyped task assignments

**3. Disability language** — person-first ("有弱视的孩子" not "弱视儿童"), no "suffers from"/"缺陷"/"normal vs disabled"

**4. Blame & guilt** — no "if only you had...", no parenting-choice blame, frame late discovery as systemic not personal

**5. Emotional register** — never dismissive ("不用担心"), never alarmist ("太可怕了"), no militaristic language ("战胜疾病" → "治疗")

**6. Socioeconomic** — don't assume access to specialists/transportation/insurance, provide alternatives

**7. Cultural sensitivity** — don't center one country, respect traditional medicine, neutral regional terms, no political commentary

**8. Age & development** — "发育速度不同" not "发育落后", use age ranges not exact ages, normalize variation

### Severity
- **Critical** = clear bias, stereotype, or harmful language → must fix
- **Warning** = could be improved but not harmful

---

## Pipeline Summary

| Stage | Input | Output | Gate |
|-------|-------|--------|------|
| 0. Research | Web search + sources | `research/<domain>/<stage>.md` | File exists |
| 1. Write EN | Research file | `articles/en/<slug>.md` | — |
| 2. Fact-check EN | EN article + research file | Pass/fail | 0 critical violations |
| 3. Translate | EN article | `articles/zh/<slug>.md` | — |
| 4. Audit ZH vs EN | EN + ZH articles | Pass/fail | 0 critical violations |
| 5. Lint EN + ZH | Both articles | Pass/fail | 0 critical violations |

**All stages run in Claude Code sessions.** No external API calls, no script execution needed.

For batch operations, use Claude Code agents to parallelize work (e.g., translating multiple articles simultaneously).

---

## Batch workflow example

```
1. Write all EN articles for a domain (6 stage articles)
2. Run fact-check on all 6 EN articles (can parallelize with agents)
3. Fix any critical violations
4. Translate all 6 to ZH (parallelize with agents)
5. Run audit on all 6 EN↔ZH pairs (parallelize with agents)
6. Fix any critical violations
7. Run lint on all 12 files (parallelize with agents)
8. Fix any critical violations
9. Build check: npm run build
10. Commit and PR
```
