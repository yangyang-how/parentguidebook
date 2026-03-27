# Matrix UI — Design Spec

> The interactive navigation grid for parentguidebook.org. Domains (rows) × age stages (columns). The primary way parents discover content.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cell behavior | Smart fallback | Domain article (age-highlighted) if exists; timeline article (anchored to section) if not. Two visual states: ● (deep dive) / ◐ (timeline). |
| DOB selector | Hybrid | Quick age buttons by default + optional birthday input persisted in localStorage. Never leaves the browser. |
| Domain rows | All 24 visible | Grouped by 5 category headers (7+4+5+4+4). No hiding — content gaps get filled, not hidden. |
| Mobile layout | Column-first | Show one age stage at a time. Swipe/tap to switch. Domains stack vertically. |
| Homepage | Hero + matrix | Hero with warm copy + DOB selector → matrix. Replaces current homepage sections entirely. |
| Sticky selector | Yes | On scroll past hero, a compact age selector pins to viewport top. |
| Column headers | None (selector IS the header) | Age selector buttons double as column labels — no separate header row in the matrix. |
| Framework | Preact island | `@astrojs/preact` for the matrix component only. Rest of site stays pure Astro. Reactive state for age selection, column highlighting, mobile column switching. |

## Page Structure (Desktop)

```
┌─────────────────────────────────────────────┐
│  Header (existing)                          │
├─────────────────────────────────────────────┤
│                                             │
│     Find what matters for your child        │
│     (subtitle copy)                         │
│                                             │
│  [ 0-1mo ] [ 1-6mo ] [*6mo-2yr*] [ 2-5yr ] │
│  [ 5-12yr ] [ 12-18yr ]                    │
│     Enter birthday for automatic tracking → │
│                                             │
├─────────────────────────────────────────────┤  ← on scroll, selector becomes sticky bar
│                                             │
│  🌿 FOR THE CHILD'S BODY                   │
│  ─────────────────────────────────────────  │
│  Eyes        ●  ●  ●* ●  ●  ●              │
│  Sleep       ●  ●  ●* ●  ●  ●              │
│  Nutrition   ●  ●  ●* ●  ●  ●              │
│  Skin        ●  ●  ●* ●  ●  ●              │
│  Breathing   ●  ●  ●* ●  ●  ●              │
│  Bones       ◐  ◐  ◐* ◐  ◐  ◐              │
│  Teeth       ◐  ◐  ◐* ◐  ◐  ◐              │
│                                             │
│  🧠 FOR THE CHILD'S MIND                   │
│  ─────────────────────────────────────────  │
│  Learning    ◐  ◐  ◐* ◐  ◐  ◐              │
│  Social      ◐  ◐  ◐* ◐  ◐  ◐              │
│  Attention   ◐  ◐  ◐* ◐  ◐  ◐              │
│  School      ◐  ◐  ◐* ◐  ◐  ◐              │
│                                             │
│  💛 FOR THE CHILD'S HEART & SOUL           │
│  ... (5 domains)                            │
│                                             │
│  🌻 FOR THE PARENT                         │
│  ... (4 domains)                            │
│                                             │
│  🏠 FOR THE FAMILY                         │
│  ... (4 domains)                            │
│                                             │
│  Legend: ● deep dive  ◐ timeline  [*] age   │
│                                             │
├─────────────────────────────────────────────┤
│  Footer (existing)                          │
└─────────────────────────────────────────────┘
```

`*` = selected age column (blue tint + border)

## Page Structure (Mobile)

```
┌───────────────────────┐
│ Header                │
├───────────────────────┤
│                       │
│  Find what matters    │
│  for your child       │
│  (subtitle)           │
│                       │
│  [*6mo-2yr*]  < >     │
│  Enter birthday →     │
│                       │
├───────────────────────┤
│                       │
│ Showing: 6mo – 2yr    │
│ ← swipe to change →   │
│                       │
│ 🌿 CHILD'S BODY      │
│ ┌───────────────────┐ │
│ │ Eyes           ●  │ │
│ │ Sleep          ●  │ │
│ │ Nutrition      ●  │ │
│ │ Skin           ●  │ │
│ │ Breathing      ●  │ │
│ │ Bones          ◐  │ │
│ │ Teeth          ◐  │ │
│ └───────────────────┘ │
│                       │
│ 🧠 CHILD'S MIND      │
│ ┌───────────────────┐ │
│ │ Learning       ◐  │ │
│ │ Social         ◐  │ │
│ │ Attention      ◐  │ │
│ │ School         ◐  │ │
│ └───────────────────┘ │
│                       │
│ ... more categories   │
│                       │
│ Legend                 │
├───────────────────────┤
│ Footer                │
└───────────────────────┘
```

On mobile: one column at a time. The age selector shows the current stage prominently with left/right arrows or swipe. Each domain row is a simple list item with the dot indicator and domain name.

## Components

### 1. `HeroSection.astro`

Static Astro component. Renders **only** the heading and subtitle text (bilingual via i18n). No interactivity, no state, no props passed to the island.

The age selector is part of `Matrix.tsx` — visually it appears inside the hero area, but it's rendered by the Preact island. The Astro component provides the static wrapper div with the hero gradient styling; the island renders inside it via an Astro `<slot>` or adjacent placement.

### 2. `Matrix.tsx` (Preact island)

The main interactive component. Responsible for:

**State:**
- `selectedStage: string` — current age stage slug (default: none, or from localStorage DOB)
- `dobInput: string | null` — stored birthday (localStorage only)
- `isMobile: boolean` — responsive breakpoint detection. Initial render uses CSS `display:none`/`display:block` with `@media` queries to prevent layout flash. JS breakpoint detection (via `matchMedia`) takes over after hydration for swipe behavior.

**Props (from Astro at build time):**
- `domains: DomainConfig[]` — all 24 domains with category, slug, label, ready status
- `stages: AgeStage[]` — the 6 age stages
- `contentMap: Record<string, Record<string, CellData>>` — domain×stage → { type: 'domain' | 'timeline', url: string }
- `lang: 'en' | 'zh'` (URL-safe lang code, not content schema's 'zh-Hans')
- `labels: Record<string, string>` — i18n strings for UI elements

**Sub-components (all within Matrix.tsx or co-located):**
- `AgeSelector` — the pill buttons + birthday input toggle
- `StickySelector` — compact version that appears on scroll (IntersectionObserver on hero)
- `CategoryGroup` — category header + its domain rows
- `DomainRow` — single domain with 6 cells (desktop) or 1 cell (mobile)
- `MatrixCell` — individual ● or ◐ cell, clickable link
- `Legend` — bottom legend explaining the symbols

**Cell click behavior:**
- ● cell → navigates to `/{lang}/{category}/{domain}/` (domain landing page)
- ◐ cell → navigates to `/{lang}/timeline/{stage}/#{domain-anchor}` (timeline page, anchored to the domain's section)
- Future: when all domains have articles, all cells become ● and the ◐ state phases out naturally

**Sticky selector:**
- Uses IntersectionObserver on the hero section
- When hero scrolls out of viewport → show sticky bar (compact age buttons)
- When hero scrolls back in → hide sticky bar

**Mobile behavior:**
- Below breakpoint (768px), switch to single-column view
- Show current stage name prominently
- Left/right arrows + swipe gesture to change stage
- Touch swipe via pointer events (no swipe library needed). Minimum swipe threshold: 50px horizontal with <30px vertical drift. Respects `prefers-reduced-motion` — arrows only, no swipe animation.
- Each domain is a full-width list item: `[domain name ··· ● ]`

### 3. Data layer: `buildContentMap()`

A utility function called at build time in the Astro page. Queries content collections to produce the `contentMap` prop:

```ts
// Pseudocode
for each domain in ALL_DOMAINS:
  for each stage in AGE_STAGES:
    if domain has ANY article (regardless of age_groups field):
      // Link to the domain landing page — the article itself covers all ages.
      // The age_groups frontmatter field is informational, not a routing filter.
      contentMap[domain][stage] = { type: 'domain', url: `/${lang}/${category}/${domain}/` }
    else if timeline article for this stage lists this domain in domains_covered[]:
      contentMap[domain][stage] = { type: 'timeline', url: `/${lang}/timeline/${stage}/#${domain}` }
    else:
      contentMap[domain][stage] = null
```

**Null cells:** rendered as an empty, non-clickable cell with a muted `○` indicator and reduced opacity. No link, no hover effect. Tooltip: "Content coming soon."

**Lang in URLs:** The content schema uses `'zh-Hans'` but URL paths use `'zh'`. The `buildContentMap()` function maps `'zh-Hans'` → `'zh'` for URL construction. This mapping already exists in the codebase route helpers (`src/utils/routes.ts`).

This runs at build time, so zero runtime cost.

### 4. Birthday persistence

- localStorage key: `pgb-child-dob`
- On load: if DOB exists, calculate age → set `selectedStage`
- Birthday input: simple date picker, stores ISO date string
- "Clear" button to remove stored DOB
- No data sent to any server. Ever.

## Visual Design

Follows existing "Calm Authority" design system:

- **Background:** `--color-bg-primary` (#fdfaf6)
- **Cards/cells:** `--color-bg-card` (#ffffff) with `--color-border` (#e8e2da)
- **Selected column:** `rgba(91,155,213,0.08)` background + `rgba(91,155,213,0.3)` border
- **● dot (has article):** `--color-accent-blue` (#5b9bd5)
- **◐ dot (timeline only):** `--color-text-muted` (#8b95a5)
- **Category headers:** Color-coded per category
  - Child's Body: `--color-accent-green` (#7bae7f)
  - Child's Mind: `--color-accent-blue` (#5b9bd5)
  - Heart & Soul: `--color-accent-coral` (#e8856c)
  - The Parent: `--color-accent-amber` (#d4a853)
  - The Family: purple (#a78bba) — add `--color-accent-purple: #a78bba` to `:root` in `global.css`, and `--color-accent-purple: #c4a6d9` to `html[data-theme="dark"]`
- **Dark mode:** All colors mapped through CSS variables, same as existing system
- **Hero gradient:** subtle green-to-cream (`#f0f5ee` → `--color-bg-primary`)

## Grid Layout (Desktop)

```css
grid-template-columns: 160px repeat(6, 1fr);
```

- 160px for domain name column
- Equal-width columns for each age stage
- 2px gap between cells
- Category headers span full width

## Accessibility

- All cells are `<a>` tags with descriptive `aria-label` (e.g., "Eyes, 6 months to 2 years — deep dive article")
- Age selector buttons: container is `role="radiogroup"` with `aria-label="Select age range"`, each button is `role="radio"` with `aria-checked`
- Keyboard navigation: arrow keys move between cells, Enter activates
- Focus indicators on all interactive elements
- Prefers-reduced-motion: disable swipe animations on mobile
- Screen reader: legend content available as visually hidden text near the matrix

## i18n

All text comes from the existing `src/i18n/ui.ts` system:
- Hero heading + subtitle
- Category names (already exist)
- Domain names (already exist)
- Age stage labels (already exist)
- Legend labels, birthday prompt, sticky bar label — new strings needed

## What This Replaces

The current homepage (`src/pages/[lang]/index.astro`) has:
1. "Start Here: By Age" timeline grid — **replaced by matrix columns**
2. "Explore by Topic" category/domain grid — **replaced by matrix rows**
3. Domain featured sections — **removed** (matrix provides the entry point)

The existing homepage code is fully replaced. No incremental merge — clean swap.

## What This Does NOT Include

- Search functionality (Phase 4)
- Related articles at bottom of articles (#41)
- SEO/OG images (#6)
- Any backend or API calls
- Newsletter integration
- Content creation (articles for missing domains)

## Dependencies

- `@astrojs/preact` — new dependency
- `preact` — new dependency
- No other new dependencies

## Testing

- Verify all 24×6 = 144 cells render with correct state (● or ◐)
- Verify all cell links resolve to real pages
- Verify DOB calculation maps to correct age stage
- Verify localStorage persistence (set, clear, reload)
- Verify sticky selector appears/disappears at correct scroll position
- Verify mobile view shows single column with swipe
- Verify dark mode renders correctly
- Verify bilingual rendering (EN + ZH)
- Verify keyboard navigation through the grid
- Build succeeds with no errors
