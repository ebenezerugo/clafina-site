import type { z } from 'zod';
import { CompareContent, PricingContent } from './pricing';
import { HomeContent } from './schema';
import { PlatformContent } from './platform';
import { LeadPageContent } from './lead-page';

/** Content files with a fixed shape, by id. The content check validates each file in every language. */
export const CONTENT_SCHEMAS: Record<string, z.ZodType> = {
  home: HomeContent,
  pricing: PricingContent,
  'pricing-compare': CompareContent,
  platform: PlatformContent,
  demo: LeadPageContent,
  'contact-sales': LeadPageContent,
};
