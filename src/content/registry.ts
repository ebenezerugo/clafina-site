import type { z } from 'zod';
import { CompareContent, PricingContent } from './pricing';
import { HomeContent } from './schema';
import { PlatformContent } from './platform';
import { LeadPageContent } from './lead-page';
import { ProductContent } from './product';
import { HelpHome } from './help';
import { DocWords, DownloadContent, GlossaryContent, GuidesContent, StartContent, TemplatesContent, WhatsNewContent } from './pages';
import { IndustriesIndex } from './industry';

/** Content files with a fixed shape, by id. The content check validates each file in every language. */
export const CONTENT_SCHEMAS: Record<string, z.ZodType> = {
  home: HomeContent,
  pricing: PricingContent,
  'pricing-compare': CompareContent,
  platform: PlatformContent,
  demo: LeadPageContent,
  'contact-sales': LeadPageContent,
  industries: IndustriesIndex,
  help: HelpHome,
  guides: GuidesContent,
  templates: TemplatesContent,
  glossary: GlossaryContent,
  'whats-new': WhatsNewContent,
  start: StartContent,
  download: DownloadContent,
  'doc-words': DocWords,
  'partners-apply': LeadPageContent,
  'developers-signup': LeadPageContent,
  // Product pages live at content/<locale>/product/<slug>.json and are checked by kind;
  // so are solutions/, why/ and docs/;
  // industry stories at content/<locale>/industries/<slug>.json the same way.
};
