/**
 * Parent Guidebook: five categories and their domains.
 *
 * Three for the child (body, mind, heart-soul), one for the parent, one for the family.
 * Eyes is the first live domain. Other domains are placeholders for future content.
 */
export const CATEGORIES = [
  { slug: 'child-body', labelKey: 'categoryGroup.childBody' },
  { slug: 'child-mind', labelKey: 'categoryGroup.childMind' },
  { slug: 'child-heart', labelKey: 'categoryGroup.childHeart' },
  { slug: 'parent', labelKey: 'categoryGroup.parent' },
  { slug: 'family', labelKey: 'categoryGroup.family' },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];

export const DOMAINS_BY_CATEGORY: Record<CategorySlug, { slug: string; labelKey: string; ready: boolean }[]> = {
  'child-body': [
    { slug: 'eyes', labelKey: 'domain.eyes', ready: true },
    { slug: 'breathing', labelKey: 'domain.breathing', ready: false },
    { slug: 'bones-movement', labelKey: 'domain.bonesMovement', ready: false },
    { slug: 'teeth', labelKey: 'domain.teeth', ready: false },
    { slug: 'nutrition', labelKey: 'domain.nutrition', ready: false },
    { slug: 'skin', labelKey: 'domain.skin', ready: false },
    { slug: 'sleep', labelKey: 'domain.sleep', ready: false },
  ],
  'child-mind': [
    { slug: 'learning-cognitive', labelKey: 'domain.learningCognitive', ready: false },
    { slug: 'attention-digital', labelKey: 'domain.attentionDigital', ready: false },
    { slug: 'social-emotional', labelKey: 'domain.socialEmotional', ready: false },
    { slug: 'school-life', labelKey: 'domain.schoolLife', ready: false },
  ],
  'child-heart': [
    { slug: 'identity-belonging', labelKey: 'domain.identityBelonging', ready: false },
    { slug: 'character-strength', labelKey: 'domain.characterStrength', ready: false },
    { slug: 'gender-confidence', labelKey: 'domain.genderConfidence', ready: false },
    { slug: 'big-questions', labelKey: 'domain.bigQuestions', ready: false },
    { slug: 'adaptability', labelKey: 'domain.adaptability', ready: false },
  ],
  parent: [
    { slug: 'physical-recovery', labelKey: 'domain.physicalRecovery', ready: false },
    { slug: 'mental-health', labelKey: 'domain.mentalHealth', ready: false },
    { slug: 'relationships', labelKey: 'domain.relationships', ready: false },
    { slug: 'parenting-confidence', labelKey: 'domain.parentingConfidence', ready: false },
  ],
  family: [
    { slug: 'home-safety', labelKey: 'domain.homeSafety', ready: false },
    { slug: 'routines-logistics', labelKey: 'domain.routinesLogistics', ready: false },
    { slug: 'work-life', labelKey: 'domain.workLife', ready: false },
    { slug: 'community-support', labelKey: 'domain.communitySupport', ready: false },
  ],
};

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);
export type DomainSlug = string;

/** Age stages for the horizontal (timeline) dimension. */
export const AGE_STAGES = [
  { slug: '0-1mo', labelKey: 'stage.0-1mo', label: '0–1 month', order: 1 },
  { slug: '1-6mo', labelKey: 'stage.1-6mo', label: '1–6 months', order: 2 },
  { slug: '6mo-2yr', labelKey: 'stage.6mo-2yr', label: '6 months–2 years', order: 3 },
  { slug: '2-5yr', labelKey: 'stage.2-5yr', label: '2–5 years', order: 4 },
  { slug: '5-12yr', labelKey: 'stage.5-12yr', label: '5–12 years', order: 5 },
  { slug: '12-18yr', labelKey: 'stage.12-18yr', label: '12–18 years', order: 6 },
] as const;

export type AgeStageSlug = (typeof AGE_STAGES)[number]['slug'];

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
