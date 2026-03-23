import type { CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';
import { getCategoryForDomain } from '../config/domains';

export const ARTICLE_ROUTE_SEGMENT_BY_SLUG: Record<string, string> = {
  'white-pupil-leukocoria': 'white-pupil',
  'misaligned-eyes-strabismus': 'misaligned-eyes',
  'signs-of-vision-problems': 'signs-of-vision-problems',
  'newborn-eyes-first-year': 'newborn-eyes',
  'toddler-preschool-eye-care': 'toddler-preschool',
  'school-age-eye-health': 'school-age',
  'eye-exam-schedule': 'schedule',
  'what-happens-eye-exam': 'what-happens',
};

export function getBaseSlugFromId(id: string): string {
  const cleaned = id.replace(/\.mdx?$/i, '');
  const parts = cleaned.split('/');
  return parts[parts.length - 1] || cleaned;
}

export function getArticleRouteSegment(entry: CollectionEntry<'articles'>): string {
  const slug = getBaseSlugFromId(entry.id);
  return ARTICLE_ROUTE_SEGMENT_BY_SLUG[slug] ?? slug;
}

/** Path to an article: /{lang}/{category}/{domain}/{articleSlug}/. Derives category from article's domain. */
export function getArticlePath(lang: Lang, entry: CollectionEntry<'articles'>): string {
  const route = getArticleRouteSegment(entry);
  const domain = entry.data.domain;
  const category = getCategoryForDomain(domain) ?? 'body';
  return `/${lang}/${category}/${domain}/${route}/`;
}

/** Path to a domain landing: /{lang}/{category}/{domain}/ */
export function getDomainPath(lang: Lang, category: string, domain: string): string {
  return `/${lang}/${category}/${domain}/`;
}

/** Path to category index: /{lang}/{category}/ */
export function getCategoryPath(lang: Lang, category: string): string {
  return `/${lang}/${category}/`;
}
