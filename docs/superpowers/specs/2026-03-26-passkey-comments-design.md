# Design Spec: Contributor System — Passkey Gate + Paragraph Comments

**Date:** 2026-03-26
**Status:** Reviewed

## Problem

The site needs a feedback system where invited contributors (parents, reviewers) can leave paragraph-level comments on articles to help improve the content. Contributors are trusted — they receive a personal passkey invitation.

Before public launch, the passkey also gates access to the entire site. After launch, the site is public but commenting remains invite-only.

## Mental Model

**Commenters are contributors, not visitors.** Anyone who wants to give feedback gets an invitation with a passkey. This is a permanent system, not a throwaway review tool.

## Two Modes

| | Pre-launch | Post-launch |
|---|---|---|
| **Reading** | Passkey required | Public |
| **Commenting** | Passkey required | Passkey required |

The switch from pre-launch to post-launch is one change in the middleware: stop gating page views, keep gating the comment API. The passkey infrastructure (KV, cookies, D1) stays permanently.

## Decisions

1. **Passkey storage:** Cloudflare KV — one entry per contributor (key = passkey, value = contributor name). Permanent infrastructure.
2. **Per-contributor identity:** Each contributor gets a unique passkey. Their name (from KV) is stored in the session cookie and attached to their comments.
3. **Comment system:** Custom-built. Zero signup friction — contributors are identified by their passkey. No external accounts.
4. **Comment granularity:** Paragraph-level, not text-highlight. More reliable across content edits, sufficient for "what confused you and where."
5. **Comment visibility:** All contributors see all comments (shared space).
6. **Longevity:** Comment system and passkey infrastructure are permanent features. Only the site-wide gate is removed at launch.

## Design

### Part 1: Passkey Gate + Contributor Auth

**Files:**
- `functions/_middleware.ts` — Cloudflare Pages middleware

**Flow (pre-launch):**
1. Every request hits the middleware
2. Middleware checks for `pgb_session` cookie containing HMAC-signed contributor name
3. No valid cookie → serve an inline HTML password form (styled to match site design)
4. Contributor enters passkey → POST to same URL → middleware looks up passkey in KV
5. Found → set signed cookie (30-day expiry), redirect to requested page
6. Not found → show form again with "Invalid passkey" message

**Flow (post-launch):**
1. Page views pass through ungated — site is public
2. Comment API (`/api/comments`) still requires valid session cookie
3. Contributors access a login page (e.g., `/contribute`) to enter their passkey and get a session cookie
4. Without a session cookie, comment icons still appear but clicking shows "Enter your contributor passkey to leave feedback"

**Static asset exclusions (pre-launch only):**
- Match by file extension and path pattern, not `Accept` header
- Excluded patterns: `/_astro/*`, `*.css`, `*.js`, `*.woff2`, `*.woff`, `*.ttf`, `*.ico`, `*.png`, `*.jpg`, `*.svg`, `*.webp`

**Cookie format:**
- Value: `{name}:{timestamp}:{hmac}` where HMAC is SHA-256 of `{name}:{timestamp}` with `COOKIE_SECRET`
- Middleware validates by recomputing HMAC and checking timestamp is within 30 days

**Cookie revocation:**
- Accepted limitation: if a contributor's passkey is deleted from KV, their existing cookie remains valid until expiry. To force immediate revocation, rotate `COOKIE_SECRET` (invalidates all sessions).

**Infrastructure:**
- KV namespace: `PASSKEYS` (bound in wrangler.jsonc) — permanent
- Environment variable: `COOKIE_SECRET` (set via `wrangler secret`) — permanent
- Environment variable: `SITE_MODE` — `"preview"` (gates everything) or `"public"` (gates only comments). Default: `"preview"`.

**Contributor management:**
```bash
# Add a contributor
wrangler kv:key put --binding=PASSKEYS "sunflower42" "Alice Chen"

# Remove a contributor
wrangler kv:key delete --binding=PASSKEYS "sunflower42"

# Switch to public mode (at launch)
wrangler secret put SITE_MODE
# enter: public
```

### Part 2: Paragraph Comments

**Files:**
- `functions/api/comments.ts` — API handler (GET/POST) — permanent
- `src/components/CommentSystem.astro` — UI component (inline script + styles) — permanent
- `src/layouts/BaseLayout.astro` — inject CommentSystem component

**Database (Cloudflare D1):**

Binding name: `COMMENTS_DB` — permanent

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

`paragraph_preview` stores the first 80 characters of the paragraph text at comment time. Enables detection of orphaned comments when content changes.

**Paragraph identification:**
- On page load, JavaScript assigns IDs to each content element (p, li, h2, h3, h4, blockquote) inside the article `<main>` area
- IDs are positional: `p-0`, `p-1`, `h2-0`, `li-0`, etc. (tag name + index within that tag type)
- The `paragraph_preview` field provides a fallback for reconciliation if paragraphs shift

**Frontend behavior:**
- **Desktop:** On hover over a content paragraph → show a small comment icon (💬) in the left margin
- **Mobile:** Comment icons are always visible (small, subtle) since there's no hover state. Tap to open.
- Click/tap icon:
  - **If authenticated:** inline form appears below the paragraph (textarea + submit button)
  - **If not authenticated (post-launch):** prompt to enter passkey, with link to `/contribute`
- On page load: fetch `GET /api/comments?page={current_path}` → render comment count badges next to paragraphs that have comments
- Click/tap badge → expand to show all comments on that paragraph (contributor name, timestamp, text)
- Comments are visible to all visitors (reading is public), but only contributors can post
- **Error handling:** If GET fails, comments section silently hides. If POST fails, show inline error "Comment failed to save — try again."

**Page path normalization:**
- Frontend always sends `page_path` with trailing slash (e.g., `/en/timeline/0-1mo/`)
- API normalizes by ensuring trailing slash before storage and query

**API:**
- `GET /api/comments?page=/en/timeline/0-1mo/` → returns JSON array of comments. No auth required (comments are public to read).
- `POST /api/comments` with body `{ page_path, paragraph_id, paragraph_preview, comment_text }` → creates comment. Requires valid session cookie. Reviewer name extracted from cookie.

**Input validation (POST):**
- `comment_text`: max 2000 characters, reject if empty or exceeds limit
- `paragraph_id`: must match pattern `^[a-z0-9]+-\d+$`
- `page_path`: must start with `/`
- All user-provided text is HTML-escaped before rendering in the DOM (prevent XSS)

**Styling:**
- Comment UI uses the site's existing design tokens (Tailwind classes)
- Subtle, non-intrusive — doesn't interfere with reading
- Comment icon: small, gray, 16px, positioned in left margin
- Comment form: appears inline below the paragraph, soft border, matches site's cream/blue palette
- Existing comments: collapsed by default (just a count badge), expandable

### Launch Day Checklist

When switching from preview to public:
1. `wrangler secret put SITE_MODE` → enter `public`
2. That's it. Middleware stops gating page views. Comment system continues working. Contributors keep their passkeys.

## Infrastructure Setup

Before first deployment:
```bash
# Create KV namespace
wrangler kv:namespace create PASSKEYS

# Create D1 database
wrangler d1 create parentguidebook-comments

# Set cookie signing secret (generate a random 32+ char string)
wrangler secret put COOKIE_SECRET

# Set site mode to preview (pre-launch)
wrangler secret put SITE_MODE
# enter: preview

# Add first contributor
wrangler kv:key put --binding=PASSKEYS "your-chosen-passkey" "Contributor Name"
```

Bind KV (`PASSKEYS`) and D1 (`COMMENTS_DB`) in `wrangler.jsonc`.
