import { z } from 'zod';
import { Claim, PageMeta } from './schema';

const Item = z.object({ id: z.string(), title: z.string(), body: z.string() });
const head = { eyebrow: z.string(), title: z.string() };

export const PlatformContent = z.object({
  meta: PageMeta,
  illustrative: z.literal('Illustrative example'),
  hero: z.object({ ...head, lede: z.string() }),
  oneRecord: z.object({ ...head, intro: z.string(), diagramLabel: z.string().startsWith('One record'), centre: z.string(), spokes: z.array(z.string()).length(8), points: z.array(Item) }),
  surfaces: z.object({ ...head, items: z.array(Item) }),
  packs: z.object({ ...head, intro: z.string(), examples: z.array(z.object({ pack: z.string(), words: z.string() })), note: z.string() }),
  everywhere: z.object({ ...head, items: z.array(Item) }),
  security: z.object({ ...head, items: z.array(Claim) }),
  connect: z.object({ ...head, items: z.array(Item) }),
  cta: z.object({ title: z.string(), body: z.string(), primary: z.string(), secondary: z.string() }),
});
