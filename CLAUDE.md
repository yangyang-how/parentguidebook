# CLAUDE.md — parentguidebook.org

## Project
A free bilingual (EN/ZH) static website helping parents raise whole, healthy, resilient children.
Site: parentguidebook.org

## Mission
Help parents — especially new and expecting parents — learn what to watch for with their
children's health and development, so they can catch problems early and act quickly when it matters.

## Architecture
- Static site built with Astro 4 → deployed to Cloudflare Pages
- Content as Markdown files with structured frontmatter (Astro Content Collections)
- Multi-domain: 4 categories (body, mind, daily-life, heart-soul) × multiple domains each
- Articles have `domain` + `category` (subcategory) fields; routing derives from domain config
- Bilingual: /en/ and /zh/ routes via dynamic [lang] param
- Styled with Tailwind CSS 3
- TypeScript throughout
- No backend (newsletter system planned for later phase)

## Design System
- "Calm Authority" — soft blues, sage greens, warm cream backgrounds
- NOT clinical white or scary medical red
- Fonts: Inter + Noto Sans SC
- Generous line height (1.8 EN, 1.9 ZH)
- Dark mode support
- Mobile-first responsive
- Full spec in IMPLEMENTATION.md § Design System and .claude/skills/tailwind-design-system/SKILL.md

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Lint: `npx @biomejs/biome check ./src`
- Lint fix: `npx @biomejs/biome check --write ./src`
- Deploy: `npm run deploy`

## Code Conventions
- Biome for linting and formatting (biome.json at project root)
- 2-space indentation, 100 char line width
- All content changes must update BOTH /en/ and /zh/ versions
- Urgency colors have medical meaning — red = "see doctor within days", amber = "soon", green = "routine"

## Gotchas
- Chinese text needs `leading-[1.9]` not the English `leading-[1.8]`
- wrangler deploy sometimes 504s — deploy-worker.mjs has retry logic
- Domain config lives in src/config/domains.ts — set `ready: true` when a domain has content
