import { z } from 'zod';
import { LOCALE_CODES } from '../config/locales';
import { ROUTES } from '../config/routes';
import { CAMPAIGN_KEYS } from './campaign';
import { TEAM_SIZES } from './lead-options';

export { TEAM_SIZES };

const INDUSTRIES: string[] = ROUTES.filter((r) => r.group === 'industry' && r.id !== 'industries').map((r) => r.id);

/** One shape for a demo or sales enquiry, checked in the browser and again in the function. */
export const LeadSchema = z.strictObject({
  kind: z.enum(['demo', 'sales', 'partner', 'developer']),
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  company: z.string().trim().min(1).max(160),
  country: z.string().regex(/^[A-Z]{2}$/),
  industry: z.enum(['other', ...INDUSTRIES]),
  teamSize: z.enum(TEAM_SIZES),
  message: z.string().max(2000).optional(),
  slot: z.string().max(120).optional(),
  locale: z.enum(LOCALE_CODES),
  campaign: z.strictObject(Object.fromEntries(CAMPAIGN_KEYS.map((k) => [k, z.string().max(100).optional()]))).optional(),
  turnstileToken: z.string().min(1).max(2048),
});
export type Lead = z.infer<typeof LeadSchema>;

export type LeadResult = { ok: true; lead: Lead } | { ok: false; errors: Record<string, string> };

export function parseLead(body: unknown): LeadResult {
  const parsed = LeadSchema.safeParse(body);
  if (parsed.success) return { ok: true, lead: parsed.data };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.code === 'unrecognized_keys' ? '_' : String(issue.path[0] ?? '_');
    errors[key] ??= issue.message;
  }
  return { ok: false, errors };
}
