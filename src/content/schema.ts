import { z } from 'zod';

/** A sentence that may make a switched claim or depend on a pre-launch feature. */
export const Claim = z.object({
  text: z.string().min(1),
  claim: z.string().optional(),
  prelaunch: z.string().optional(),
});

/** The made-up business in an industry story: always labelled as illustrative. */
export const IllustrativeBusiness = z.object({
  name: z.string().min(1),
  place: z.string().min(1),
  label: z.literal(true),
});

export const PageMeta = z.object({ title: z.string().min(1), description: z.string().min(1).max(170) });

const Item = z.object({ id: z.string(), title: z.string().min(1), body: z.string().min(1) });
const Section = { eyebrow: z.string().min(1), title: z.string().min(1) };

export const HomeContent = z.object({
  meta: PageMeta,
  illustrative: z.literal('Illustrative example'),
  hero: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    lede: z.string().min(1),
    primaryCta: z.string().min(1),
    secondaryCta: z.string().min(1),
    /** The small cards floating over the product in the hero: one moment each from money, stock and the assistant. */
    cards: z.object({
      paid: z.object({ title: z.string().min(1), detail: z.string().min(1), amount: z.number().int().positive() }),
      low: z.object({ title: z.string().min(1), detail: z.string().min(1), action: z.string().min(1) }),
      insight: z.object({ title: z.string().min(1), detail: z.string().min(1) }),
      /** A small chart: one month of daily sales, the total and how it compares. */
      trend: z.object({ title: z.string().min(1), value: z.number().int().positive(), note: z.string().min(1), points: z.array(z.number().nonnegative()).min(5), from: z.string().min(1), to: z.string().min(1) }),
    }),
  }),
  oneRecord: z.object({ ...Section, intro: z.string(), currency: z.enum(['NGN', 'USD']), story: z.object({ link: z.string().min(1), poster: z.string().min(1) }), steps: z.array(Item.extend({ visual: z.array(z.object({ label: z.string(), value: z.string() })) })).length(4) }),
  surfaces: z.object({
    ...Section, intro: z.string(),
    /** Each screen, with one small moment from it shown as a live card. */
    items: z.array(Item.extend({ moment: z.string().min(1) })).min(1),
    /** The receipt the till's printer is printing: the same order as on the till screen. Amounts in minor-less units. */
    receipt: z.object({ title: z.string().min(1), lines: z.array(z.object({ label: z.string().min(1), amount: z.number().int().nonnegative() })).min(1), total: z.object({ label: z.string().min(1), amount: z.number().int().positive() }), footer: z.string().min(1) }),
    /** A moment floating over the till. */
    moment: z.object({ title: z.string().min(1), detail: z.string().min(1) }),
  }),
  modules: z.object({ ...Section, intro: z.string(), items: z.record(z.string(), z.string()) }),
  industries: z.object({ ...Section, intro: z.string() }),
  works: z.object({ ...Section, items: z.array(Item).min(1) }),
  trust: z.object({ ...Section, items: z.array(Claim).min(1) }),
  /** The assistant band: a question box and suggested questions, all leading to the assistant's page. */
  ask: z.object({ ...Section, intro: z.string().min(1), placeholder: z.string().min(1), suggestions: z.array(z.string().min(1)).min(2).max(4) }),
  cta: z.object({ title: z.string().min(1), body: z.string().min(1) }),
});
export type HomeContent = z.infer<typeof HomeContent>;

/** An illustrated story: chapters drawn by scripts/draw-illustrations.mjs, a paper trail that fills as it plays. */
const StoryPaper = z.enum(['quote', 'invoice', 'order', 'waybill', 'payment', 'receipt']);
export const StoryContent = z.object({
  kind: z.literal('story'),
  meta: PageMeta,
  illustrative: z.literal('Illustrative example'),
  hero: z.object({ eyebrow: z.string().min(1), title: z.string().min(1), lede: z.string().min(1) }),
  cast: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), role: z.string().min(1) })).min(1),
  trailTitle: z.string().min(1),
  papers: z.array(z.object({ id: StoryPaper, name: z.string().min(1), number: z.string().min(1), stamp: z.string().min(1) })).min(1),
  /** Amounts are money tokens, worked out per country from the story's ledger, so they always add up. */
  totals: z.object({ lines: z.array(z.object({ label: z.string().min(1), amount: z.string().includes('⟦m:') })).min(1), totalLabel: z.string().min(1), total: z.string().includes('⟦m:') }),
  didLabel: z.string().min(1),
  controls: z.object({ list: z.string().min(1), play: z.string().min(1), pause: z.string().min(1), prev: z.string().min(1), next: z.string().min(1), chapter: z.string().includes('{n}'), bike: z.string().min(1), van: z.string().min(1) }),
  chapters: z.array(z.object({
    frame: z.string().regex(/^[a-z-]+$/), time: z.string().regex(/^[A-Z][a-z]{2} \d{2}:\d{2}$/), place: z.string().min(1), short: z.string().min(1),
    paper: StoryPaper, done: z.array(StoryPaper), title: z.string().min(1), text: z.string().min(1),
    did: z.array(z.object({ kind: z.enum(['record', 'books', 'stock', 'people']), text: z.string().min(1) })).min(1),
    vehicle: z.literal(true).optional(),
  })).min(2),
  cta: z.object({ title: z.string().min(1), body: z.string().min(1) }),
});
export type StoryContent = z.infer<typeof StoryContent>;
