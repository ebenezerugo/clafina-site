import { z } from 'zod';
import { Claim, PageMeta } from './schema';

export const SURFACES = ['web', 'till', 'phone', 'shop', 'assistant', 'meet'] as const;

/** One product page: written only from docs/product-facts.md; `sources` names the docs behind it. */
export const ProductContent = z.strictObject({
  kind: z.literal('product'),
  sources: z.array(z.string()).min(1),
  meta: PageMeta,
  illustrative: z.literal('Illustrative example'),
  hero: z.strictObject({ eyebrow: z.string(), title: z.string(), lede: z.string(), screen: z.string() }),
  jobsTitle: z.string(),
  jobs: z.array(z.strictObject({ title: z.string(), body: z.string() })).length(3),
  tourTitle: z.string(),
  tour: z.array(z.strictObject({ screen: z.string(), title: z.string(), body: z.string(), points: z.array(z.string()).max(4) })).min(1).max(5),
  featuresTitle: z.string(),
  features: z.array(z.strictObject({ title: z.string(), items: z.array(Claim).min(1) })).min(1),
  connectsTitle: z.string(),
  connects: z.array(z.strictObject({ route: z.string(), text: z.string() })).min(1),
  surfacesTitle: z.string(),
  surfaces: z.array(z.enum(SURFACES)).min(1),
  industriesTitle: z.string(),
  industries: z.array(z.string()),
  faqTitle: z.string(),
  faq: z.array(z.strictObject({ q: z.string(), a: z.string() })).min(1),
  cta: z.strictObject({ title: z.string(), body: z.string() }),
});
export type ProductContent = z.infer<typeof ProductContent>;
