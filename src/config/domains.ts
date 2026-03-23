/**
 * Parent Guidebook: four categories and their domains.
 * Eyes is the first live domain under "body". Other domains are placeholders for future content.
 */
export const CATEGORIES = [
  { slug: 'body', labelKey: 'categoryGroup.body' },
  { slug: 'mind', labelKey: 'categoryGroup.mind' },
  { slug: 'daily-life', labelKey: 'categoryGroup.dailyLife' },
  { slug: 'heart-soul', labelKey: 'categoryGroup.heartSoul' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const DOMAINS_BY_CATEGORY: Record<CategorySlug, { slug: string; labelKey: string; ready: boolean }[]> = {
  body: [
    { slug: 'eyes', labelKey: 'domain.eyes', ready: true },
    { slug: 'breathing', labelKey: 'domain.breathing', ready: false },
    { slug: 'bones-movement', labelKey: 'domain.bonesMovement', ready: false },
    { slug: 'teeth', labelKey: 'domain.teeth', ready: false },
    { slug: 'nutrition', labelKey: 'domain.nutrition', ready: false },
  ],
  mind: [
    { slug: 'attention-digital', labelKey: 'domain.attentionDigital', ready: false },
    { slug: 'learning-cognitive', labelKey: 'domain.learningCognitive', ready: false },
    { slug: 'social-emotional', labelKey: 'domain.socialEmotional', ready: false },
    { slug: 'school-life', labelKey: 'domain.schoolLife', ready: false },
  ],
  'daily-life': [
    { slug: 'physical-activity', labelKey: 'domain.physicalActivity', ready: false },
    { slug: 'outdoor-life', labelKey: 'domain.outdoorLife', ready: false },
    { slug: 'home-environment', labelKey: 'domain.homeEnvironment', ready: false },
  ],
  'heart-soul': [
    { slug: 'identity-belonging', labelKey: 'domain.identityBelonging', ready: false },
    { slug: 'gender-confidence', labelKey: 'domain.genderConfidence', ready: false },
    { slug: 'character-strength', labelKey: 'domain.characterStrength', ready: false },
    { slug: 'adaptability', labelKey: 'domain.adaptability', ready: false },
    { slug: 'big-questions', labelKey: 'domain.bigQuestions', ready: false },
    { slug: 'explore-future', labelKey: 'domain.exploreFuture', ready: false },
    { slug: 'how-world-works', labelKey: 'domain.howWorldWorks', ready: false },
  ],
};

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
export type DomainSlug = string;

/** Look up which top-level category a domain belongs to. */
export function getCategoryForDomain(domain: string): CategorySlug | undefined {
  for (const [cat, domains] of Object.entries(DOMAINS_BY_CATEGORY)) {
    if (domains.some((d) => d.slug === domain)) return cat as CategorySlug;
  }
  return undefined;
}

/** Check whether a domain has content ready. */
export function isDomainReady(domain: string): boolean {
  for (const domains of Object.values(DOMAINS_BY_CATEGORY)) {
    const found = domains.find((d) => d.slug === domain);
    if (found) return found.ready;
  }
  return false;
}

/** Get all ready domains across all categories. */
export function getReadyDomains(): { category: CategorySlug; slug: string; labelKey: string }[] {
  const result: { category: CategorySlug; slug: string; labelKey: string }[] = [];
  for (const [cat, domains] of Object.entries(DOMAINS_BY_CATEGORY)) {
    for (const d of domains) {
      if (d.ready) result.push({ category: cat as CategorySlug, slug: d.slug, labelKey: d.labelKey });
    }
  }
  return result;
}
