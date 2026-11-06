import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROUTES, type RouteDef } from '@/config/routes';
import { pageAvailable } from '@/config/switches';

/** Pages that are applications, not documents: they use the lead form. */
export const FORM_ROUTES = ['partners-apply', 'developers-signup'];

/** The long-form pages: partners, developers, trust, company and legal, minus the two application forms. */
export function docRoutes(): RouteDef[] {
  return ROUTES.filter((r) => ['partner', 'developer', 'trust', 'company', 'legal'].includes(r.group) && !FORM_ROUTES.includes(r.id) && pageAvailable(r.id));
}

/** Legal pages a lawyer has not yet approved. A production build refuses any that is switched on. */
export function legalDrafts(mode: 'preview' | 'production' = 'production'): string[] {
  return ROUTES.filter((r) => r.group === 'legal' && pageAvailable(r.id, mode))
    .filter((r) => {
      const file = join('content', 'en', 'docs', `${r.id}.json`);
      return existsSync(file) && (JSON.parse(readFileSync(file, 'utf8')) as { status?: string }).status !== 'final';
    })
    .map((r) => `${r.id} is still a draft: have it approved and set "status": "final" (content/en/docs/${r.id}.json)`);
}
