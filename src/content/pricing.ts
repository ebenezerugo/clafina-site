import { z } from 'zod';
import { PageMeta } from './schema';

const plan = z.object({ name: z.string(), tagline: z.string(), cta: z.string() });

export const PricingContent = z.object({
  meta: PageMeta,
  hero: z.object({ eyebrow: z.string(), title: z.string(), lede: z.string() }),
  pricesFor: z.string(), perMonth: z.string(), free: z.string(), talkToUs: z.string(), mostChosen: z.string(),
  editionNote: z.object({ global: z.string(), ng: z.string(), latam: z.string() }),
  plans: z.object({ free: plan, growth: plan, business: plan, enterprise: plan }),
  limits: z.object({ users: z.string(), locations: z.string(), tills: z.string(), unlimited: z.string() }),
  features: z.record(z.string(), z.string()),
  compareLink: z.string(), samples: z.string(), faqTitle: z.string(),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
  fallback: z.object({ title: z.string(), body: z.string(), cta: z.string() }),
});
export type PricingContent = z.infer<typeof PricingContent>;

export const CompareContent = z.object({
  meta: PageMeta, title: z.string(), lede: z.string(), limitsGroup: z.string(), featuresGroup: z.string(),
  included: z.string(), notIncluded: z.string(), feature: z.string(),
});
