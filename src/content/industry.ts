import { z } from 'zod';
import { Claim, PageMeta } from './schema';
import { SURFACES } from './product';

const Time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time must be HH:MM');

const Moment = z.strictObject({
  time: Time,
  title: z.string().min(1),
  problem: z.string().min(1),
  handles: z.string().min(1),
  surface: z.enum(SURFACES),
  screen: z.string().optional(),
  /** The illustrated frame for this moment, from the industry's drawn story. */
  scene: z.string().regex(/^[a-z-]+$/).optional(),
  prelaunch: z.string().optional(),
});

/**
 * One industry story: a day at an illustrative business, in the trade's own words.
 * Written only from docs/industry-facts.md; `sources` names the docs behind it.
 */
export const IndustryStory = z
  .strictObject({
    kind: z.literal('industry-story'),
    sources: z.array(z.string()).min(1),
    meta: PageMeta,
    illustrative: z.literal('Illustrative example'),
    /** Retail and manufacturing are built into the core; every other story is a pack. */
    core: z.boolean(),
    hero: z.strictObject({ eyebrow: z.string(), title: z.string(), lede: z.string(), screen: z.string() }),
    business: z.strictObject({ name: z.string().min(1), place: z.string().min(1), label: z.literal(true), about: z.string().min(1) }),
    /** The drawn story in public/illustrations/<story>/ that the moments' scenes come from. */
    story: z.string().regex(/^[a-z0-9-]+$/).optional(),
    dayTitle: z.string(),
    moments: z.array(Moment).min(6).max(8),
    wordsTitle: z.string(),
    words: z.array(z.strictObject({ word: z.string(), meaning: z.string() })).min(3),
    switchesTitle: z.string(),
    switchesOn: z.array(Claim).min(1),
    sharesTitle: z.string(),
    shares: z.array(z.strictObject({ route: z.string(), text: z.string() })).min(1),
    modulesTitle: z.string(),
    modules: z.array(z.string()).min(1),
    faqTitle: z.string(),
    faq: z.array(z.strictObject({ q: z.string(), a: z.string(), prelaunch: z.string().optional() })).min(1),
    relatedTitle: z.string(),
    related: z.array(z.string()),
    cta: z.strictObject({ title: z.string(), body: z.string() }),
  })
  .superRefine((s, ctx) => {
    // Each screen is a lot of markup; more than four in the day breaks the phone performance budget on slower machines.
    const screens = s.moments.filter((m) => m.screen);
    if (screens.length > 4) ctx.addIssue({ code: 'custom', path: ['moments'], message: `at most 4 moments carry a screen, found ${screens.length}` });
    s.moments.forEach((m, i) => {
      if (m.screen === s.hero.screen) ctx.addIssue({ code: 'custom', path: ['moments', i, 'screen'], message: 'repeats the hero screen' });
    });
    s.moments.forEach((m, i) => {
      const before = s.moments[i - 1];
      if (before && m.time <= before.time) ctx.addIssue({ code: 'custom', path: ['moments', i, 'time'], message: `moment times must rise: ${before.time} then ${m.time}` });
    });
  });
export type IndustryStory = z.infer<typeof IndustryStory>;

/** The industries index: built stories, in groups. Cards take their copy from each story. */
export const IndustriesIndex = z.strictObject({
  meta: PageMeta,
  hero: z.strictObject({ eyebrow: z.string(), title: z.string(), lede: z.string() }),
  groups: z.array(z.strictObject({ title: z.string(), body: z.string(), items: z.array(z.string()).min(1) })).min(1),
  coreLabel: z.string(),
  packLabel: z.string(),
  cta: z.strictObject({ title: z.string(), body: z.string() }),
});
export type IndustriesIndex = z.infer<typeof IndustriesIndex>;
