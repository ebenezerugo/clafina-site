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

export const HomeContent = z.object({
  meta: PageMeta,
  hero: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    lede: z.string().min(1),
    primaryCta: z.string().min(1),
    secondaryCta: z.string().min(1),
  }),
});
export type HomeContent = z.infer<typeof HomeContent>;

/** Content files with a fixed shape, by id. Later phases add theirs here. */
export const CONTENT_SCHEMAS: Record<string, z.ZodType> = { home: HomeContent };
