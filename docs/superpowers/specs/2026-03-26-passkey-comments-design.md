# Design Spec: Passkey Gate + Paragraph Comments

**Date:** 2026-03-26
**Status:** Reviewed

## Problem

The site is not ready for public launch, but we need real parent feedback on the content. Two features required:
1. A passkey gate so only invited reviewers can access the site
2. A paragraph-level comment system so reviewers can leave feedback on specific parts of articles

## Decisions

1. **Passkey storage:** Cloudflare KV — one entry per reviewer (key = passkey, value = reviewer name). Add/remove with `wrangler kv` commands.
2. **Per-reviewer identity:** Each reviewer gets a unique passkey. Their name (from KV) is stored in the session cookie and attached to their comments.
3. **Comment system:** Custom-built, not Hypothesis. Zero signup friction — reviewers are already identified by their passkey. No external accounts.
4. **Comment granularity:** Paragraph-level, not text-highlight. More reliable across content edits, sufficient for "what confused you and where."
5. **Comment visibility:** All reviewers see all comments (shared review space).
6. **Temporary features:** Both are designed to be cleanly removed when the site goes public.

## Design

### Part 1: Passkey Gate

**Files:**
- `functions/_middleware.ts` — Cloudflare Pages middleware

**Flow:**
1. Every request hits the middleware
2. Middleware checks for `pgb_session` cookie containing HMAC-signed reviewer name
3. No valid cookie → serve an inline HTML password form (styled to match site design)
4. Reviewer enters passkey → POST to same URL → middleware looks up passkey in KV
5. Found → set signed cookie (30-day expiry), redirect to requested page
6. Not found → show form again with "Invalid passkey" message

**Static asset exclusions:**
- Match by file extension and path pattern, not `Accept` header (browsers are inconsistent)
- Excluded patterns: `/_astro/*` (Astro build chunks), `*.css`, `*.js`, `*.woff2`, `*.woff`, `*.ttf`, `*.ico`, `*.png`, `*.jpg`, `*.svg`, `*.webp`
- These must pass through ungated so the password page itself renders correctly

**Cookie format:**
- Value: `{name}:{timestamp}:{hmac}` where HMAC is SHA-256 of `{name}:{timestamp}` with `COOKIE_SECRET`
- Middleware validates by recomputing HMAC and checking timestamp is within 30 days

**Cookie revocation:**
- Accepted limitation: if a reviewer's passkey is deleted from KV, their existing cookie remains valid until it expires. For a temporary review tool with trusted reviewers, this is acceptable. To force immediate revocation, rotate `COOKIE_SECRET` (invalidates all sessions).

**Infrastructure:**
- KV namespace: `PASSKEYS` (bound in wrangler.jsonc)
- Environment variable: `COOKIE_SECRET` (set via `wrangler secret`)

**Reviewer management:**
```bash
wrangler kv:key put --binding=PASSKEYS "sunflower42" "Alice Chen"
wrangler kv:key delete --binding=PASSKEYS "sunflower42"
```

### Part 2: Paragraph Comments

**Files:**
- `functions/api/comments.ts` — API handler (GET/POST)
- `src/components/CommentSystem.astro` — UI component (inline script + styles)
- `src/layouts/BaseLayout.astro` — inject CommentSystem component

**Database (Cloudflare D1):**

Binding name: `COMMENTS_DB`

```sql
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  paragraph_id TEXT NOT NULL,
  paragraph_preview TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_comments_page ON comments(page_path);
```

`paragraph_preview` stores the first 80 characters of the paragraph text at comment time. This lets us detect orphaned comments when content changes — if the preview no longer matches any paragraph, the comment can be flagged or repositioned.

**Paragraph identification:**
- On page load, JavaScript assigns IDs to each content element (p, li, h2, h3, h4, blockquote) inside the article `<main>` area
- IDs are positional: `p-0`, `p-1`, `h2-0`, `li-0`, etc. (tag name + index within that tag type)
- Comment drift is an accepted risk for this temporary tool. The `paragraph_preview` field provides a fallback for manual reconciliation if needed.

**Frontend behavior:**
- **Desktop:** On hover over a content paragraph → show a small comment icon (💬) in the left margin
- **Mobile:** Comment icons are always visible (small, subtle) since there's no hover state. Tap to open.
- Click/tap icon → inline form appears below the paragraph: textarea + submit button
- On page load: fetch `GET /api/comments?page={current_path}` → render comment count badges next to paragraphs that have comments
- Click/tap badge → expand to show all comments on that paragraph (reviewer name, timestamp, text)
- **Error handling:** If GET fails, comments section silently hides (doesn't break reading). If POST fails, show a brief inline error message "Comment failed to save — try again" below the form.

**Page path normalization:**
- Frontend always sends `page_path` with trailing slash (e.g., `/en/timeline/0-1mo/`)
- API normalizes by ensuring trailing slash before storage and query

**API:**
- `GET /api/comments?page=/en/timeline/0-1mo/` → returns JSON array of comments for that page
- `POST /api/comments` with body `{ page_path, paragraph_id, paragraph_preview, comment_text }` → creates comment, reviewer_name extracted from session cookie
- Both endpoints validate the session cookie (same HMAC check as middleware)

**Input validation (POST):**
- `comment_text`: max 2000 characters, reject if empty or exceeds limit
- `paragraph_id`: must match pattern `^[a-z0-9]+-\d+$`
- `page_path`: must start with `/`
- All user-provided text is HTML-escaped before rendering in the DOM (prevent XSS)
- No rate limiting — trusted reviewers, temporary tool

**Styling:**
- Comment UI uses the site's existing design tokens (Tailwind classes)
- Subtle, non-intrusive — doesn't interfere with reading
- Comment icon: small, gray, 16px, positioned in left margin
- Comment form: appears inline below the paragraph, soft border, matches site's cream/blue palette
- Existing comments: collapsed by default (just a count badge), expandable

### Removal plan

When the site goes public:
1. Delete `functions/` directory → gate + API gone
2. Remove `<CommentSystem />` from BaseLayout → UI gone
3. Remove KV namespace binding and D1 binding from wrangler.jsonc
4. Drop D1 database: `wrangler d1 delete parentguidebook-comments`
5. Delete `src/components/CommentSystem.astro`

All changes are additive — no existing code is modified except one line in BaseLayout.

## Infrastructure setup

Before deployment:
```bash
# Create KV namespace
wrangler kv:namespace create PASSKEYS

# Create D1 database
wrangler d1 create parentguidebook-comments

# Set cookie signing secret
wrangler secret put COOKIE_SECRET

# Add first reviewer
wrangler kv:key put --binding=PASSKEYS "your-chosen-passkey" "Reviewer Name"
```

Bind KV (`PASSKEYS`) and D1 (`COMMENTS_DB`) in `wrangler.jsonc`.
