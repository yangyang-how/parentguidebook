# Design Spec: Roadmap Redesign

**Date:** 2026-03-24
**Status:** Reviewed
**Issue:** #67

## Problem

The existing roadmap (issue #67) has structural issues:
- No progress tracking mechanism beyond a static table
- Phase 4 is a junk drawer mixing 30-minute tasks with multi-week projects
- Ghost issues #12-30 are closed but represent content that was never written
- Phase 6 is a parking lot for unrelated items
- Calendar dates don't fit the project's reality — availability is unpredictable

## Existing Content Baseline

Before restructuring, this is what exists:
- **8 eye domain articles** (EN + ZH) — vertical deep dives, the project's original content
- **1 timeline article** ("The First Month", EN + ZH) — the first horizontal piece
- **4-stage content pipeline:** fact-check (Opus) → translate (Sonnet) → audit (Sonnet) → lint (Haiku), with veto gates at each stage

The eye articles are existing Phase 3-type content. Phase 3 expands into new domains, not starting from zero.

## Decisions

All decisions were made collaboratively with Sam during brainstorming.

1. **Scope:** Full platform roadmap through social presence, newsletter, and engagement — not just content
2. **Timing:** Dependency-driven milestones with no calendar dates. Progress measured by checkboxes, not deadlines. Sam's availability is unpredictable — dates would create guilt or fiction
3. **Ghost issues #12-30:** These are all closed planning artifacts from the pre-architecture-redesign era (weekly content sprint placeholders). None of the 134 planned articles were written. Add a "superseded" comment to each, leave them closed. New issues created only when work is imminent
4. **Content granularity:** Roadmap tracks both strategic milestones AND individual content items as checkboxes. Strategic view for "where are we," content checklist for "how much is done"
5. **Phase structure:** Reorganize from 6 phases to 4 phases + 1 ongoing track. Group real projects by user impact (discoverability, experience, engagement). Pull quick-win infra tasks into an ongoing track
6. **Location:** `ROADMAP.md` in repo root is source of truth. Issue #67 is slimmed to a summary dashboard that links to the file
7. **PWA/App (#36-40):** Removed from roadmap entirely. Speculative architecture from before the redesign — becomes its own roadmap if revisited

## Design

### Format

- **`ROADMAP.md`** — repo root, source of truth. Detailed phases, milestones, content checklists, ongoing track
- **Issue #67** — summary dashboard with: current phase indicator, next milestone, content progress counts (e.g., "2/6 timeline articles"), and a link to `ROADMAP.md` for full details

### Structure: 4 Phases + 1 Ongoing Track

Phases overlap — content writing from Phase 1 continues into Phase 2. The milestone triggers define when the *next* phase can begin, not when the current phase must end.

**Phase 1: Foundation Content**
- Write remaining 5 timeline articles
- Each article goes through the full 4-stage pipeline (fact-check → translate → audit → lint) before shipping
- Milestone trigger: 3 timeline articles shipped → unlocks Phase 2
- Content checklist with all 6 articles

**Phase 2: Navigation & Discovery**
- Matrix UI: DOB selector, interactive grid, mobile-responsive
- Homepage redesign around the matrix
- OG images for social sharing (#6)
- Submit sitemap to Google Search Console (#3)
- Remaining timeline articles continue in parallel
- Milestone trigger: Matrix live + all 6 timeline articles done → unlocks Phase 3

**Phase 3: Content Depth**
- Domain deep dives prioritized by what timeline articles reference most
- Priority domains: Sleep, Nutrition & Feeding, Skin, Breathing & ENT, Mental Health (Parent)
- Existing eye articles (8) are already done — this phase expands into new domains
- Related articles at bottom of each article (#41)
- Milestone trigger: 3+ new domain deep dives shipped → unlocks Phase 4

**Phase 4: Growth & Engagement**
- Discoverability: Xiaohongshu (#31), Twitter/X (#34), Reddit (#35), Instagram (#33), others (#32)
- Engagement: Newsletter/email subscription (#44), contact form (#42)
- Experience: Article search (#45), print-friendly layout (#43)

**Ongoing Track** (anytime, between phases or during downtime)
- youfang.io domain pointing (#5)
- Dark mode contrast verification (#9)
- Responsive tables on mobile (#10)
- Breadcrumb navigation (#11)
- Reading time estimate (#46)

### Guiding Principles

1. Content before containers
2. Horizontal-first — timeline is the primary experience
3. Every article through the pipeline — no shortcuts on medical content
4. The parent is a subject, not just the audience
5. Fail closed — guardrails default to blocking

### Content Progress

Living checklists in `ROADMAP.md` for both timeline articles and domain deep dives, with counts mirrored in the issue #67 summary dashboard.

### Ghost Issue Comment Template

For issues #12-30, add this comment:

> Superseded by the new content architecture and roadmap. The project was restructured from weekly content sprints to a phased approach with timeline articles first, domain deep dives second. See ROADMAP.md and issue #67 for the current plan.

## Implementation

1. Write `ROADMAP.md` with full structure, phases, checklists, and principles
2. Update issue #67 body to summary dashboard format with link to `ROADMAP.md`
3. Add "superseded" comment to ghost issues #12-30
