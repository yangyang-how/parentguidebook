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
