# Roadmap — Parent Guidebook

> parentguidebook.org — a free bilingual (EN/ZH) resource helping parents raise whole, healthy, resilient children.

This is the source of truth for what we're building and in what order. Progress is measured by milestones hit, not calendar dates. Issue [#67](https://github.com/yangyang-how/parentguidebook/issues/67) has a summary view.

---

## Where We Are Now

- **Site:** parentguidebook.org on Cloudflare Pages (auto-deploy on merge to main)
- **Architecture:** 5 categories, 24 domains, 6 age stages, 2D matrix model
- **Content pipeline:** fact-check → translate → audit → lint
- **Contributor system:** passkey-gated access + paragraph-level comments (Cloudflare KV + D1)
- **Live content:**
  - 6 timeline articles (EN + ZH) — all age stages covered
  - 8 eye domain articles (EN + ZH)
  - 5 domain deep dives (EN + ZH) — Sleep, Nutrition, Skin, Breathing & ENT, Mental Health
- **Infrastructure:** bilingual routing, dark mode, source citation system, sitemap, inclusive language enforcement, article TOC sidebar, contributor comment system

**Current phase: 2 — Navigation & Discovery**

---

## Phase 1: Foundation Content ✅ COMPLETE

> Write the horizontal timeline articles — the primary reading experience for new parents.

### Timeline Articles

- [x] The First Month (0–1 mo)
- [x] Months 1–6 (1–6 mo)
- [x] 6 Months to 2 Years (6 mo–2 yr)
- [x] Ages 2–5 (2–5 yr)
- [x] Ages 5–12 (5–12 yr)
- [x] Ages 12–18 (12–18 yr)

**Progress: 6 / 6 — Complete**

---

## Phase 2: Navigation & Discovery ← CURRENT

> Build the matrix UI and make content findable.

**Unlock trigger → Phase 3:** Matrix UI live + all 6 timeline articles done (✅ articles done).

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

## Phase 3: Content Depth — MOSTLY DONE

> Fill in vertical domain deep dives for the topics parents need most.

**Unlock trigger → Phase 4:** 3+ new domain deep dives shipped (✅ 5 new domains shipped, plus Eyes which predates the phased roadmap).

### Domain Deep Dives

| Domain | Category | Status |
|--------|----------|--------|
| Eyes | Child Body | ✅ Done (8 articles) |
| Sleep | Child Body | ✅ Done |
| Nutrition & Feeding | Child Body | ✅ Done |
| Skin | Child Body | ✅ Done |
| Breathing & ENT | Child Body | ✅ Done |
| Mental Health | Parent | ✅ Done |
| Bones & Movement | Child Body | Not started |
| Teeth | Child Body | Not started |

**Progress: 6 / 8 domains**

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
