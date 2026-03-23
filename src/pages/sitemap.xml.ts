import { getCollection } from 'astro:content';
import { getArticlePath, getCategoryPath, getDomainPath } from '../utils/routes';
import { CATEGORIES, getReadyDomains } from '../config/domains';

const SITE = 'https://parentguidebook.org';

export async function getStaticPaths() {
  return [{}];
}

export async function GET() {
  const articles = await getCollection('articles');
  const urls: string[] = [
    `${SITE}/`,
    `${SITE}/en/`,
    `${SITE}/zh/`,
    `${SITE}/en/about/`,
    `${SITE}/zh/about/`,
    `${SITE}/en/sources/`,
    `${SITE}/zh/sources/`,
  ];
  const ready = getReadyDomains();
  for (const lang of ['en', 'zh']) {
    for (const c of CATEGORIES) {
      urls.push(`${SITE}${getCategoryPath(lang, c.slug)}`);
    }
    for (const d of ready) {
      urls.push(`${SITE}${getDomainPath(lang, d.category, d.slug)}`);
    }
  }
  for (const entry of articles) {
    const path = getArticlePath(entry.data.lang === 'en' ? 'en' : 'zh', entry);
    urls.push(`${SITE}${path}`);
  }
  const sorted = [...new Set(urls)].sort();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sorted.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
