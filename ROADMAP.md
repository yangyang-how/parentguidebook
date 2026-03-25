# Roadmap — Parent Guidebook

> parentguidebook.org — a free bilingual (EN/ZH) resource helping parents raise whole, healthy, resilient children.

This is the source of truth for what we're building and in what order. Progress is measured by milestones hit, not calendar dates. Issue [#67](https://github.com/yangyang-how/parentguidebook/issues/67) has a summary view.

---

## Where We Are Now

- **Site:** parentguidebook.org on Cloudflare Pages (auto-deploy on merge to main)
- **Architecture:** 5 categories, 24 domains, 6 age stages, 2D matrix model
- **Content pipeline:** fact-check (Opus) → translate (Sonnet) → audit (Sonnet) → lint (Haiku) — veto gates at each stage
- **Live content:**
  - 8 eye domain articles (EN + ZH) — vertical deep dives
  - "The First Month" timeline article (EN + ZH) — first horizontal piece
- **Infrastructure:** bilingual routing, dark mode, source citation system, sitemap, inclusive language enforcement (8 categories)

**Current phase: 1 — Foundation Content**

---

## Phase 1: Foundation Content

> Write the horizontal timeline articles — the primary reading experience for new parents.

Each timeline article is a self-contained guide covering baby + parent + family for one age stage. Every article goes through the full 4-stage pipeline (fact-check → translate → audit → lint) before shipping.

**Unlock trigger → Phase 2:** 3 timeline articles shipped.

### Timeline Articles

- [x] The First Month (0–1 mo) — shipped
- [ ] Months 1–6 (1–6 mo)
- [ ] 6 Months to 2 Years (6 mo–2 yr)
- [ ] Ages 2–5 (2–5 yr)
- [ ] Ages 5–12 (5–12 yr)
- [ ] Ages 12–18 (12–18 yr)

**Progress: 1 / 6**

---

## Phase 2: Navigation & Discovery

> Build the matrix UI and make content findable. Remaining timeline articles continue in parallel.

Phase 2 begins once 3 timeline articles exist to populate the matrix. Timeline article writing continues during this phase.

**Unlock trigger → Phase 3:** Matrix UI live + all 6 timeline articles done.

### Matrix UI

- [ ] DOB selector ("When was your child born?")
- [ ] Interactive matrix component (domains × age stages)
- [ ] Highlighted column based on child's age
- [ ] Clickable rows, columns, and cells
- [ ] Mobile-responsive design (column-first on small screens)
- [ ] Redesign homepage around the matrix

### SEO & Visibility

- [ ] Create Open Graph images for social sharing — #6
- [ ] Submit sitemap to Google Search Console — #3

---

## Phase 3: Content Depth

> Fill in vertical domain deep dives for the topics parents need most.

Priority domains are chosen by what the timeline articles reference most heavily. The 8 existing eye articles are already done — this phase expands into new domains.

**Unlock trigger → Phase 4:** 3+ new domain deep dives shipped.

### Domain Deep Dives

| Domain | Category | Priority | Status |
|--------|----------|----------|--------|
| Eyes | Child Body | — | Done (8 articles) |
| Sleep | Child Body | High | Not started |
| Nutrition & Feeding | Child Body | High | Not started |
| Skin | Child Body | Medium | Not started |
| Breathing & ENT | Child Body | Medium | Not started |
| Mental Health | Parent | Medium | Not started |
| Bones & Movement | Child Body | Lower | Not started |
| Teeth | Child Body | Lower | Not started |

### Features

- [ ] Related articles at bottom of each article — #41

---

## Phase 4: Growth & Engagement

> Get the site in front of parents and give them reasons to come back.

### Discoverability — Social Presence

- [ ] Xiaohongshu (小红书) — 养育有方 — #31
- [ ] Twitter/X — @parentguidebook — #34
- [ ] Reddit presence — #35
- [ ] Instagram — @parentguidebook — #33
- [ ] Threads, Mastodon, Facebook — #32

### Engagement

- [ ] Newsletter / email subscription — #44
- [ ] Contact form or feedback mechanism — #42

### Experience

- [ ] Article search by title, content, or domain — #45
- [ ] Print-friendly article layout — #43

---

## Ongoing Track

> Quick-win tasks that can be tackled anytime — between phases, during downtime, or when you need a break from long-form writing.

- [ ] Point youfang.io to Cloudflare Pages project — #5
- [ ] Verify dark mode contrast and readability — #9
- [ ] Verify responsive tables on mobile — #10
- [ ] Add breadcrumb navigation to article pages — #11
- [ ] Article reading time estimate — #46

---

## Not On This Roadmap

These items were considered and intentionally excluded:

- **PWA / Reading companion app (#36–40)** — speculative architecture from before the content redesign. If revisited, it becomes its own roadmap once the site content is mature.
- **Issues #12–30** — weekly content sprint placeholders from the old architecture. Superseded by the phased approach. Closed with explanation.

---

## Guiding Principles

1. **Content before containers** — write articles first, build UI around real content
2. **Horizontal-first** — timeline articles are the primary experience for new parents
3. **Every article through the pipeline** — fact-check, translate, audit, lint. No shortcuts on medical content
4. **The parent is a subject, not just the audience** — parent wellbeing at every stage
5. **Fail closed** — hooks, checks, and guardrails default to blocking, not allowing
