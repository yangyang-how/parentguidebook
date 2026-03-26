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
