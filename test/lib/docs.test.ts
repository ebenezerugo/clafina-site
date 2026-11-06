import { describe, expect, it } from 'vitest';
import { docRoutes, FORM_ROUTES, legalDrafts } from '../../src/lib/docs';

describe('long-form pages', () => {
  it('are the partner, developer, trust, company and legal pages, minus the two forms', () => {
    const ids = docRoutes().map((r) => r.id);
    for (const f of FORM_ROUTES) expect(ids).not.toContain(f);
  });
  it('a production build refuses a legal page still in draft', () => {
    for (const p of legalDrafts('preview')) expect(p).toMatch(/^legal-[a-z-]+ is still a draft/);
  });
});
