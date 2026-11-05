import { describe, expect, it } from 'vitest';
import { IndustryStory } from '../../src/content/industry';

const moment = (time: string) => ({ time, title: 'Opening', problem: 'The float is not counted.', handles: 'The till asks for the float.', surface: 'till' });

const story = () => ({
  kind: 'industry-story',
  sources: ['POINT_OF_SALE.md'],
  meta: { title: 'Retail · Clafina', description: 'A day at a shop.' },
  illustrative: 'Illustrative example',
  core: true,
  hero: { eyebrow: 'Retail', title: 'Run the shop.', lede: 'Till and shop.', screen: 'till-sell' },
  business: { name: 'Adaeze Home Goods', place: 'Enugu', label: true, about: 'A homeware shop.' },
  dayTitle: 'A day at Adaeze Home Goods',
  moments: ['08:00', '09:30', '11:00', '13:00', '16:00', '19:00'].map(moment),
  wordsTitle: 'Your words',
  words: [{ word: 'Float', meaning: 'Cash in the drawer' }, { word: 'Shift', meaning: 'A session' }, { word: 'Z report', meaning: 'End of day' }],
  switchesTitle: 'Built in',
  switchesOn: [{ text: 'The till' }],
  sharesTitle: 'Shares',
  shares: [{ route: 'product-stock', text: 'Stock moves with every sale.' }],
  modulesTitle: 'Modules',
  modules: ['product-pos'],
  faqTitle: 'Questions',
  faq: [{ q: 'Offline?', a: 'Yes.' }],
  relatedTitle: 'Related',
  related: ['industry-distribution'],
  cta: { title: 'Start', body: 'Free.' },
});

const issues = (data: unknown) => {
  const r = IndustryStory.safeParse(data);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};

describe('IndustryStory', () => {
  it('accepts a valid story', () => {
    expect(issues(story())).toEqual([]);
  });
  it('requires a labelled business', () => {
    const s = story();
    (s.business as { label: unknown }).label = false;
    expect(issues(s).some((i) => i.startsWith('business.label'))).toBe(true);
  });
  it('needs six to eight moments', () => {
    expect(issues({ ...story(), moments: story().moments.slice(0, 5) }).some((i) => i.startsWith('moments'))).toBe(true);
    expect(issues({ ...story(), moments: ['01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00'].map(moment) }).some((i) => i.startsWith('moments'))).toBe(true);
  });
  it('keeps the day in order', () => {
    const s = story();
    s.moments[3]!.time = '10:00';
    expect(issues(s)).toContain('moments.3.time: moment times must rise: 11:00 then 10:00');
  });
  it('rejects an unknown surface and a bad time', () => {
    const s = story();
    s.moments[0]!.surface = 'kiosk';
    s.moments[1]!.time = '9:30';
    const found = issues(s);
    expect(found.some((i) => i.startsWith('moments.0.surface'))).toBe(true);
    expect(found).toContain('moments.1.time: time must be HH:MM');
  });
});
