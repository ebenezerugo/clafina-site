import { z } from 'zod';
import { Claim, PageMeta } from './schema';

const Hero = z.strictObject({ eyebrow: z.string(), title: z.string(), lede: z.string() });
const Faq = z.array(z.strictObject({ q: z.string(), a: z.string(), claim: z.string().optional(), prelaunch: z.string().optional() }));
const Cta = z.strictObject({ title: z.string(), body: z.string() });

/** A solution page: a kind of business or a role, its pains, a short labelled story, and what fixes them. */
export const SolutionContent = z.strictObject({
  kind: z.literal('solution'),
  sources: z.array(z.string()).min(1),
  meta: PageMeta,
  illustrative: z.literal('Illustrative example'),
  hero: Hero.extend({ screen: z.string() }),
  painsTitle: z.string(),
  pains: z.array(z.strictObject({ pain: z.string(), fix: z.string(), prelaunch: z.string().optional() })).min(3).max(6),
  storyTitle: z.string(),
  story: z.strictObject({ business: z.strictObject({ name: z.string(), place: z.string(), label: z.literal(true) }), before: z.string(), after: z.string(), screen: z.string().optional() }),
  modulesTitle: z.string(),
  modules: z.array(z.strictObject({ route: z.string(), why: z.string() })).min(3).max(8),
  planTitle: z.string(),
  plan: z.strictObject({ id: z.enum(['free', 'growth', 'business', 'enterprise']), why: z.string() }),
  faqTitle: z.string(),
  faq: Faq.min(2),
  cta: Cta,
});
export type SolutionContent = z.infer<typeof SolutionContent>;

/** A paragraph that may make a switched claim or depend on a pre-launch feature. */
const Para = z.union([z.string(), Claim]);

/** A Why Clafina explainer: long-form prose in sections, with key points and an optional diagram. */
export const ExplainerContent = z.strictObject({
  kind: z.literal('explainer'),
  sources: z.array(z.string()).min(1),
  meta: PageMeta,
  hero: Hero,
  points: z.array(z.strictObject({ title: z.string(), body: z.string() })).length(3),
  /** A hub with spokes: one record and what reads it, the till and what syncs, and so on. */
  diagram: z.strictObject({ label: z.string(), centre: z.string(), spokes: z.array(z.string()).min(3).max(8) }).optional(),
  sections: z.array(z.strictObject({ id: z.string().regex(/^[a-z0-9-]+$/), heading: z.string(), paragraphs: z.array(Para).min(1), list: z.array(Para).optional() })).min(3),
  faqTitle: z.string(),
  faq: Faq.min(2),
  cta: Cta,
});
export type ExplainerContent = z.infer<typeof ExplainerContent>;

/** A long-form document: partners, developers, trust, company and legal pages. */
export const DocContent = z.strictObject({
  kind: z.literal('doc'),
  sources: z.array(z.string()).min(1),
  meta: PageMeta,
  hero: Hero,
  /** Last updated, as YYYY-MM-DD. */
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Legal pages start as drafts; production refuses a legal draft. */
  status: z.enum(['draft', 'final']),
  sections: z.array(z.strictObject({ id: z.string().regex(/^[a-z0-9-]+$/), heading: z.string(), paragraphs: z.array(Para).min(1), list: z.array(Para).optional() })).min(2),
  /** Where to go next: site pages by route id, and the site.ts emails by key. */
  contact: z.strictObject({ title: z.string(), body: z.string(), email: z.enum(['hello', 'sales', 'support', 'privacy', 'security', 'press']).optional(), routes: z.array(z.string()) }),
});
export type DocContent = z.infer<typeof DocContent>;

/** Words shared by every long-form page. */
export const DocWords = z.strictObject({
  updated: z.string(),
  contents: z.string(),
  draft: z.strictObject({ title: z.string(), body: z.string() }),
  emailUs: z.string(),
  emailPending: z.string(),
  apply: z.string(),
});

/** Reading paths through the help centre: a goal, then how-tos in order. */
export const GuidesContent = z.strictObject({
  meta: PageMeta,
  hero: Hero,
  paths: z.array(z.strictObject({ id: z.string().regex(/^[a-z0-9-]+$/), title: z.string(), intro: z.string(), steps: z.array(z.strictObject({ module: z.string(), article: z.string() })).min(2).max(10) })).min(1),
  helpLink: z.string(),
});
export type GuidesContent = z.infer<typeof GuidesContent>;

const TemplateLine = z.strictObject({ item: z.string(), qty: z.number().positive(), price: z.number().nonnegative() });
/** Free printable documents: an illustrative invoice, quotation and receipt. */
export const TemplatesContent = z.strictObject({
  meta: PageMeta,
  illustrative: z.literal('Illustrative example'),
  hero: Hero,
  howToTitle: z.string(),
  howTo: z.array(z.string()).min(2),
  print: z.string(),
  makeIt: z.string(),
  labels: z.strictObject({ number: z.string(), date: z.string(), to: z.string(), item: z.string(), qty: z.string(), price: z.string(), amount: z.string(), subtotal: z.string(), tax: z.string(), total: z.string(), paid: z.string(), validUntil: z.string() }),
  business: z.strictObject({ name: z.string(), place: z.string(), label: z.literal(true) }),
  currency: z.enum(['NGN', 'USD']),
  templates: z.array(z.strictObject({
    id: z.enum(['invoice', 'quotation', 'receipt']),
    title: z.string(),
    body: z.string(),
    number: z.string(),
    date: z.string(),
    to: z.string(),
    lines: z.array(TemplateLine).min(1).max(8),
    /** The tax as a fraction (0.075), drawn as an amount so no rate figure shows. */
    taxRate: z.number().min(0).max(1),
    taxName: z.string(),
    note: z.string(),
    page: z.string().startsWith('/'),
  })).length(3),
});
export type TemplatesContent = z.infer<typeof TemplatesContent>;

/** The glossary: words from the help centre and the industry stories, plus any written here. */
export const GlossaryContent = z.strictObject({
  meta: PageMeta,
  hero: Hero,
  terms: z.array(z.strictObject({ word: z.string(), meaning: z.string() })),
  seeIn: z.string(),
  jumpTo: z.string(),
});
export type GlossaryContent = z.infer<typeof GlossaryContent>;

/** What's new: dated entries, newest first. */
export const WhatsNewContent = z.strictObject({
  meta: PageMeta,
  hero: Hero,
  entries: z.array(z.strictObject({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), title: z.string(), body: z.string(), route: z.string().optional(), claim: z.string().optional(), prelaunch: z.string().optional() })).min(1),
  readMore: z.string(),
});
export type WhatsNewContent = z.infer<typeof WhatsNewContent>;

/** The hand-off to sign-up and the apps download page. */
export const StartContent = z.strictObject({ meta: PageMeta, title: z.string(), body: z.string(), button: z.string() });
export const DownloadContent = z.strictObject({
  meta: PageMeta,
  hero: Hero,
  phone: z.strictObject({ title: z.string(), body: z.string(), appStore: z.string(), googlePlay: z.string(), qr: z.string() }),
  till: z.strictObject({ title: z.string(), body: z.string(), desktop: z.string(), android: z.string(), browser: z.string() }),
  notYet: z.string(),
  forYourDevice: z.string(),
});
export type DownloadContent = z.infer<typeof DownloadContent>;
