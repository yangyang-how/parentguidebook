# Contributor System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a passkey-gated contributor system with paragraph-level comments to parentguidebook.org.

**Architecture:** Cloudflare Pages middleware handles auth (KV for passkeys, HMAC-signed cookies). Cloudflare D1 stores comments. A single Astro component injects comment UI into all pages. The middleware checks `SITE_MODE` env var to switch between preview (full gate) and public (comments-only gate).

**Tech Stack:** Cloudflare Pages Functions (TypeScript), Cloudflare KV, Cloudflare D1, Astro components, vanilla JS (no framework for comment UI), Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-03-26-passkey-comments-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `functions/_auth.ts` | Shared auth utilities — HMAC signing, cookie parsing, session validation |
| `functions/_middleware.ts` | Auth gate — cookie validation, passkey lookup, password form, `/contribute` login page |
| `functions/api/comments.ts` | Comment API — GET (public) and POST (auth required) |
| `src/components/CommentSystem.astro` | Comment UI — paragraph icons, forms, comment display, all client-side JS |
| `src/layouts/BaseLayout.astro` | Modified — inject `<CommentSystem />` before `</body>` |
| `wrangler.jsonc` | Modified — add KV and D1 bindings |
| `migrations/0001_create_comments.sql` | D1 schema migration |

---

### Task 1: Infrastructure — wrangler.jsonc + D1 migration

**Files:**
- Modify: `wrangler.jsonc`
- Create: `migrations/0001_create_comments.sql`

- [ ] **Step 1: Update wrangler.jsonc with KV and D1 bindings**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "parentguidebook",
  "compatibility_date": "2026-02-17",
  "assets": {
    "directory": "./dist"
  },
  "kv_namespaces": [
    { "binding": "PASSKEYS", "id": "PLACEHOLDER_KV_ID" }
  ],
  "d1_databases": [
    { "binding": "COMMENTS_DB", "database_name": "parentguidebook-comments", "database_id": "PLACEHOLDER_D1_ID" }
  ]
}
```

Note: `PLACEHOLDER_KV_ID` and `PLACEHOLDER_D1_ID` will be replaced with real IDs after running `wrangler kv:namespace create` and `wrangler d1 create`. Sam will do this during deployment.

- [ ] **Step 2: Create D1 migration file**

```sql
-- migrations/0001_create_comments.sql
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

- [ ] **Step 3: Commit**

```bash
git add wrangler.jsonc migrations/0001_create_comments.sql
git commit -m "chore: add KV and D1 bindings for contributor system"
```

---

### Task 2: Shared auth utilities

**Files:**
- Create: `functions/_auth.ts`

- [ ] **Step 1: Create the shared auth module**

Shared between middleware and comments API — avoids code duplication.

```typescript
// functions/_auth.ts

export const COOKIE_NAME = 'pgb_session';
export const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function validateSession(cookie: string, secret: string): Promise<string | null> {
  const parts = cookie.split(':');
  if (parts.length < 3) return null;
  const hmac = parts.pop()!;
  const timestamp = parts.pop()!;
  const name = parts.join(':'); // name could contain colons
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return null;
  const age = (Date.now() - ts) / 1000;
  if (age > COOKIE_MAX_AGE || age < 0) return null;
  const expected = await hmacSign(`${name}:${timestamp}`, secret);
  return expected === hmac ? name : null;
}

export async function createSessionCookie(name: string, secret: string): Promise<string> {
  const timestamp = Date.now().toString();
  const hmac = await hmacSign(`${name}:${timestamp}`, secret);
  const value = encodeURIComponent(`${name}:${timestamp}:${hmac}`);
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/_auth.ts
git commit -m "feat: add shared auth utilities for HMAC cookies"
```

---

### Task 3: Auth middleware — passkey gate

**Files:**
- Create: `functions/_middleware.ts`

- [ ] **Step 1: Create the middleware file**

The middleware must:
1. Skip static assets (match by extension and `/_astro/` path)
2. Skip `/api/` routes (handled by their own functions)
3. Handle `/contribute` route (login page for public mode contributors)
4. Check for valid `pgb_session` cookie (HMAC-signed)
5. If `SITE_MODE` is `public`, pass through page views ungated but serve `/contribute` login
6. If `SITE_MODE` is `preview` (default), gate everything with a password form
7. On POST with `passkey` field: look up in KV, set signed cookie on success

```typescript
// functions/_middleware.ts
import { COOKIE_NAME, parseCookie, validateSession, createSessionCookie } from './_auth';

interface Env {
  PASSKEYS: KVNamespace;
  COOKIE_SECRET: string;
  SITE_MODE?: string; // "preview" | "public", defaults to "preview"
}

const STATIC_EXT = /\.(css|js|woff2?|ttf|ico|png|jpe?g|svg|webp|gif|xml|json|txt)$/i;

function passwordPage(error?: string, isContributePage = false): Response {
  const errorHtml = error
    ? `<p style="color: var(--color-urgency-critical); margin-bottom: 1rem; font-size: 0.9375rem;">${error}</p>`
    : '';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Parent Guidebook — Contributor Access</title>
  <style>
    :root {
      --color-bg-primary: #fdfaf6;
      --color-bg-card: #ffffff;
      --color-text-primary: #2d3748;
      --color-text-secondary: #5a6577;
      --color-text-muted: #8b95a5;
      --color-accent-blue: #5b9bd5;
      --color-accent-coral: #e8856c;
      --color-border: #e8e2da;
      --color-urgency-critical: #c53030;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --color-bg-primary: #1a1d23;
        --color-bg-card: #2a2f38;
        --color-text-primary: #e8e2da;
        --color-text-secondary: #a0a8b4;
        --color-text-muted: #64748b;
        --color-accent-blue: #5b9bd5;
        --color-border: #3a3f48;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1rem;
    }
    .card {
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      padding: 2.5rem 2rem;
      max-width: 400px;
      width: 100%;
      text-align: center;
    }
    h1 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 0.9375rem;
      color: var(--color-text-secondary);
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }
    input[type="password"] {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      background: var(--color-bg-primary);
      color: var(--color-text-primary);
      margin-bottom: 1rem;
      outline: none;
    }
    input[type="password"]:focus {
      border-color: var(--color-accent-blue);
      box-shadow: 0 0 0 3px rgba(91, 155, 213, 0.15);
    }
    button {
      width: 100%;
      padding: 0.75rem;
      font-size: 0.9375rem;
      font-weight: 600;
      border: none;
      border-radius: 10px;
      background: var(--color-accent-coral);
      color: #fff;
      cursor: pointer;
    }
    button:hover { filter: brightness(1.05); }
  </style>
</head>
<body>
  <div class="card">
    <h1>Parent Guidebook</h1>
    <p class="subtitle">${isContributePage ? 'Enter your contributor passkey to leave feedback on articles.' : 'This site is in preview. Enter your contributor passkey to access.'}</p>
    ${errorHtml}
    <form method="POST">
      <input type="password" name="passkey" placeholder="Enter passkey" autofocus required>
      <button type="submit">Enter</button>
    </form>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: error ? 401 : 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // 1. Skip static assets
  if (url.pathname.startsWith('/_astro/') || STATIC_EXT.test(url.pathname)) {
    return next();
  }

  // 2. Skip API routes (handled by their own functions)
  if (url.pathname.startsWith('/api/')) {
    return next();
  }

  const isPreview = (env.SITE_MODE || 'preview') === 'preview';

  // 3. Handle /contribute route (both modes — this is how contributors log in)
  if (url.pathname === '/contribute' || url.pathname === '/contribute/') {
    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionCookie = parseCookie(cookieHeader, COOKIE_NAME);
    if (sessionCookie) {
      const name = await validateSession(sessionCookie, env.COOKIE_SECRET);
      if (name) return new Response(`<html><body><p>Logged in as ${name}. <a href="/">Go to site</a></p></body></html>`, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
    if (request.method === 'POST') {
      const formData = await request.formData();
      const passkey = formData.get('passkey')?.toString() || '';
      const reviewerName = await env.PASSKEYS.get(passkey);
      if (reviewerName) {
        const cookie = await createSessionCookie(reviewerName, env.COOKIE_SECRET);
        return new Response(null, {
          status: 302,
          headers: { 'Location': '/', 'Set-Cookie': cookie },
        });
      }
      return passwordPage('Invalid passkey. Please try again.', true);
    }
    return passwordPage(undefined, true);
  }

  // 4. In public mode, pass through all page views (contributors use /contribute to log in)
  if (!isPreview) {
    return next();
  }

  // 5. Preview mode — check auth
  const cookieHeader = request.headers.get('Cookie') || '';
  const sessionCookie = parseCookie(cookieHeader, COOKIE_NAME);

  if (sessionCookie) {
    const name = await validateSession(sessionCookie, env.COOKIE_SECRET);
    if (name) return next();
  }

  // 5. Handle POST (passkey submission)
  if (request.method === 'POST') {
    const formData = await request.formData();
    const passkey = formData.get('passkey')?.toString() || '';
    const reviewerName = await env.PASSKEYS.get(passkey);
    if (reviewerName) {
      const cookie = await createSessionCookie(reviewerName, env.COOKIE_SECRET);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': url.pathname + url.search,
          'Set-Cookie': cookie,
        },
      });
    }
    return passwordPage('Invalid passkey. Please try again.');
  }

  // 6. Show password page
  return passwordPage();
};
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit functions/_middleware.ts --esModuleInterop --moduleResolution node --target es2020 --module es2020 --skipLibCheck 2>&1 || echo "Type check done (errors may be expected for CF types)"`

Cloudflare Pages Functions types aren't installed locally — the file will work at deploy time. Just verify no syntax errors.

- [ ] **Step 3: Commit**

```bash
git add functions/_middleware.ts
git commit -m "feat: add passkey gate middleware with HMAC-signed cookies"
```

---

### Task 4: Comments API

**Files:**
- Create: `functions/api/comments.ts`

- [ ] **Step 1: Create the comments API handler**

```typescript
// functions/api/comments.ts
import { COOKIE_NAME, parseCookie, validateSession } from '../_auth';

interface Env {
  COMMENTS_DB: D1Database;
  COOKIE_SECRET: string;
}

function normalizePath(path: string): string {
  return path.endsWith('/') ? path : path + '/';
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const page = url.searchParams.get('page');
  if (!page) return jsonResponse({ error: 'Missing page parameter' }, 400);

  const normalizedPage = normalizePath(page);
  const result = await context.env.COMMENTS_DB.prepare(
    'SELECT id, page_path, paragraph_id, paragraph_preview, reviewer_name, comment_text, created_at FROM comments WHERE page_path = ? ORDER BY created_at ASC'
  ).bind(normalizedPage).all();

  return jsonResponse(result.results);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Auth check
  const cookieHeader = request.headers.get('Cookie') || '';
  const sessionCookie = parseCookie(cookieHeader, COOKIE_NAME);
  if (!sessionCookie) return jsonResponse({ error: 'Not authenticated' }, 401);

  const reviewerName = await validateSession(sessionCookie, env.COOKIE_SECRET);
  if (!reviewerName) return jsonResponse({ error: 'Invalid session' }, 401);

  // Parse body
  let body: { page_path?: string; paragraph_id?: string; paragraph_preview?: string; comment_text?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { page_path, paragraph_id, paragraph_preview, comment_text } = body;

  // Validate
  if (!page_path || !page_path.startsWith('/')) {
    return jsonResponse({ error: 'Invalid page_path' }, 400);
  }
  if (!paragraph_id || !/^[a-z0-9]+-\d+$/.test(paragraph_id)) {
    return jsonResponse({ error: 'Invalid paragraph_id' }, 400);
  }
  if (!comment_text || comment_text.length === 0 || comment_text.length > 2000) {
    return jsonResponse({ error: 'comment_text must be 1-2000 characters' }, 400);
  }
  if (!paragraph_preview || typeof paragraph_preview !== 'string') {
    return jsonResponse({ error: 'Missing paragraph_preview' }, 400);
  }

  // Store raw text — escaping happens client-side at render time to avoid double-escaping
  const normalizedPage = normalizePath(page_path);
  const preview = paragraph_preview.slice(0, 80);

  const result = await env.COMMENTS_DB.prepare(
    'INSERT INTO comments (page_path, paragraph_id, paragraph_preview, reviewer_name, comment_text) VALUES (?, ?, ?, ?, ?)'
  ).bind(normalizedPage, paragraph_id, preview, reviewerName, comment_text).run();

  return jsonResponse({ success: true, id: result.meta.last_row_id }, 201);
};
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/comments.ts
git commit -m "feat: add comments API with GET (public) and POST (auth required)"
```

---

### Task 5: Comment System UI component

**Files:**
- Create: `src/components/CommentSystem.astro`

- [ ] **Step 1: Create the comment UI component**

This is an Astro component with an inline `<script>` tag containing all the client-side JS. It:
1. Assigns paragraph IDs to content elements
2. Adds comment icons (hover on desktop, always visible on mobile)
3. Fetches existing comments on page load
4. Handles comment form submission
5. Renders comment badges and expanded comment lists

```astro
---
// src/components/CommentSystem.astro
// No server-side props needed — all behavior is client-side
---

<style>
  .pgb-comment-icon {
    position: absolute;
    left: -2rem;
    top: 0.25rem;
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.15s ease;
    font-size: 0.875rem;
    line-height: 1.25rem;
    text-align: center;
    color: var(--color-text-muted);
    user-select: none;
    z-index: 10;
  }
  .pgb-comment-icon:hover {
    color: var(--color-accent-blue);
  }
  /* Show on hover (desktop) */
  [data-pgb-commentable]:hover .pgb-comment-icon {
    opacity: 1;
  }
  /* Always show on mobile */
  @media (max-width: 768px) {
    .pgb-comment-icon {
      opacity: 0.5;
      left: -1.5rem;
    }
  }
  /* Always show if paragraph has comments */
  .pgb-comment-icon[data-has-comments] {
    opacity: 1;
  }

  .pgb-comment-badge {
    background: var(--color-accent-blue);
    color: #fff;
    font-size: 0.6875rem;
    font-weight: 600;
    border-radius: 999px;
    min-width: 1.125rem;
    height: 1.125rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.3rem;
  }

  .pgb-comment-form {
    margin: 0.75rem 0 1rem;
    padding: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-bg-card);
  }
  .pgb-comment-form textarea {
    width: 100%;
    min-height: 4rem;
    padding: 0.625rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: 0.875rem;
    line-height: 1.5;
    resize: vertical;
    outline: none;
  }
  .pgb-comment-form textarea:focus {
    border-color: var(--color-accent-blue);
  }
  .pgb-comment-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  .pgb-comment-form button {
    padding: 0.4rem 0.875rem;
    font-size: 0.8125rem;
    font-weight: 500;
    border-radius: 8px;
    border: 1px solid var(--color-border);
    cursor: pointer;
    background: var(--color-bg-card);
    color: var(--color-text-primary);
  }
  .pgb-comment-form button[type="submit"] {
    background: var(--color-accent-blue);
    color: #fff;
    border-color: var(--color-accent-blue);
  }
  .pgb-comment-form .pgb-error {
    color: var(--color-urgency-critical);
    font-size: 0.8125rem;
    margin-top: 0.375rem;
  }

  .pgb-comments-list {
    margin: 0.5rem 0 1rem;
    padding: 0;
    list-style: none;
  }
  .pgb-comment-item {
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg-card);
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
  }
  .pgb-comment-item__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.375rem;
  }
  .pgb-comment-item__name {
    font-weight: 600;
    font-size: 0.8125rem;
    color: var(--color-text-primary);
  }
  .pgb-comment-item__date {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
  .pgb-comment-item__text {
    color: var(--color-text-secondary);
    line-height: 1.5;
  }
</style>

<script>
(function() {
  const SELECTORS = 'main .prose p, main .prose li, main .prose h2, main .prose h3, main .prose h4, main .prose blockquote';
  const pagePath = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
  let allComments: Array<{id: number; paragraph_id: string; reviewer_name: string; comment_text: string; created_at: string}> = [];

  function escapeHtml(s: string): string {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function assignParagraphIds() {
    const counts: Record<string, number> = {};
    document.querySelectorAll(SELECTORS).forEach((el) => {
      const tag = el.tagName.toLowerCase();
      counts[tag] = (counts[tag] || 0);
      const id = `${tag}-${counts[tag]}`;
      counts[tag]++;
      el.setAttribute('data-pgb-id', id);
      el.setAttribute('data-pgb-commentable', '');
      (el as HTMLElement).style.position = 'relative';

      // Add comment icon
      const icon = document.createElement('span');
      icon.className = 'pgb-comment-icon';
      icon.textContent = '💬';
      icon.setAttribute('data-pgb-trigger', id);
      icon.addEventListener('click', () => toggleCommentForm(id, el as HTMLElement));
      el.prepend(icon);
    });
  }

  function toggleCommentForm(paragraphId: string, el: HTMLElement) {
    const existingForm = el.parentElement?.querySelector(`.pgb-comment-form[data-for="${paragraphId}"]`);
    if (existingForm) {
      existingForm.remove();
      return;
    }
    // Close any other open forms
    document.querySelectorAll('.pgb-comment-form').forEach(f => f.remove());

    const preview = (el.textContent || '').slice(0, 80);
    const form = document.createElement('div');
    form.className = 'pgb-comment-form';
    form.setAttribute('data-for', paragraphId);
    form.innerHTML = `
      <textarea placeholder="Leave your feedback on this paragraph..." maxlength="2000"></textarea>
      <div class="pgb-comment-form-actions">
        <button type="button" class="pgb-cancel">Cancel</button>
        <button type="submit">Submit</button>
      </div>
    `;

    form.querySelector('.pgb-cancel')!.addEventListener('click', () => form.remove());
    form.querySelector('button[type="submit"]')!.addEventListener('click', async () => {
      const textarea = form.querySelector('textarea')!;
      const text = textarea.value.trim();
      if (!text) return;
      const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page_path: pagePath,
            paragraph_id: paragraphId,
            paragraph_preview: preview,
            comment_text: text,
          }),
        });
        if (res.status === 401) {
          const errDiv = form.querySelector('.pgb-error') || document.createElement('div');
          errDiv.className = 'pgb-error';
          errDiv.textContent = 'You need a contributor passkey to leave feedback. Please enter your passkey first.';
          form.querySelector('.pgb-comment-form-actions')!.before(errDiv);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
          return;
        }
        if (!res.ok) throw new Error('Failed');
        form.remove();
        await loadComments(); // Refresh
      } catch {
        const errDiv = form.querySelector('.pgb-error') || document.createElement('div');
        errDiv.className = 'pgb-error';
        errDiv.textContent = 'Comment failed to save — try again.';
        form.querySelector('.pgb-comment-form-actions')!.before(errDiv);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    });

    el.after(form);
    form.querySelector('textarea')!.focus();
  }

  function renderComments() {
    // Remove old comment lists and badges
    document.querySelectorAll('.pgb-comments-list').forEach(l => l.remove());
    document.querySelectorAll('.pgb-comment-badge').forEach(b => b.remove());

    // Group by paragraph
    const grouped: Record<string, typeof allComments> = {};
    for (const c of allComments) {
      (grouped[c.paragraph_id] ||= []).push(c);
    }

    for (const [pid, comments] of Object.entries(grouped)) {
      const el = document.querySelector(`[data-pgb-id="${pid}"]`);
      if (!el) continue;

      // Mark icon as having comments and add badge
      const icon = el.querySelector('.pgb-comment-icon');
      if (icon) {
        icon.setAttribute('data-has-comments', '');
        // Place badge after the element (not inside headings where it would inherit heading styles)
        let existingBadge = el.parentElement?.querySelector(`.pgb-comment-badge[data-for="${pid}"]`);
        if (!existingBadge) {
          const badge = document.createElement('span');
          badge.className = 'pgb-comment-badge';
          badge.setAttribute('data-for', pid);
          badge.textContent = comments.length.toString();
          badge.style.position = 'absolute';
          badge.style.left = '-2rem';
          badge.style.top = '1.5rem';
          badge.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCommentList(pid, el as HTMLElement, comments);
          });
          icon.after(badge);
        }
      }
    }
  }

  function toggleCommentList(paragraphId: string, el: HTMLElement, comments: typeof allComments) {
    const existing = el.parentElement?.querySelector(`.pgb-comments-list[data-for="${paragraphId}"]`);
    if (existing) {
      existing.remove();
      return;
    }
    document.querySelectorAll('.pgb-comments-list').forEach(l => l.remove());

    const list = document.createElement('ul');
    list.className = 'pgb-comments-list';
    list.setAttribute('data-for', paragraphId);

    for (const c of comments) {
      const li = document.createElement('li');
      li.className = 'pgb-comment-item';
      const date = new Date(c.created_at + 'Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      li.innerHTML = `
        <div class="pgb-comment-item__header">
          <span class="pgb-comment-item__name">${escapeHtml(c.reviewer_name)}</span>
          <span class="pgb-comment-item__date">${date}</span>
        </div>
        <div class="pgb-comment-item__text">${escapeHtml(c.comment_text)}</div>
      `;
      list.appendChild(li);
    }
    el.after(list);
  }

  async function loadComments() {
    try {
      const res = await fetch(`/api/comments?page=${encodeURIComponent(pagePath)}`);
      if (!res.ok) return;
      allComments = await res.json();
      renderComments();
    } catch {
      // Silently fail — don't break reading experience
    }
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { assignParagraphIds(); loadComments(); });
  } else {
    assignParagraphIds();
    loadComments();
  }
})();
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CommentSystem.astro
git commit -m "feat: add paragraph-level comment UI component"
```

---

### Task 6: Integrate CommentSystem into BaseLayout

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Add import and component to BaseLayout**

Add the import at the top of the frontmatter:

```typescript
import CommentSystem from '../components/CommentSystem.astro';
```

Add the component just before `</body>`:

```html
    <CommentSystem />
  </body>
```

- [ ] **Step 2: Verify the site builds**

Run: `npm run build`
Expected: Build completes successfully.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: inject CommentSystem into all pages via BaseLayout"
```

---

### Task 7: Manual integration test

- [ ] **Step 1: Run dev server and verify password page renders**

This won't work fully in local dev (no KV/D1), but we can verify the build succeeds and the comment JS loads.

Run: `npm run build && npm run preview`

Open browser to `http://localhost:4321/en/` — verify the page loads and comment icons appear on paragraphs.

- [ ] **Step 2: Create a final combined commit if any fixes were needed**

If any adjustments were made during testing, commit them.

---

### Task 8: Push and create PR

- [ ] **Step 1: Push the branch and create PR**

```bash
git push -u origin feat/contributor-system
gh pr create --title "feat: contributor system — passkey gate + paragraph comments" --body "..."
```

Include in PR body:
- Summary of all components
- Infrastructure setup instructions (KV, D1, secrets)
- How to add a contributor
- How to switch from preview to public mode
