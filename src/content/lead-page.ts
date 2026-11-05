import { z } from 'zod';
import { PageMeta } from './schema';

export const LeadFormText = z.object({
  steps: z.array(z.string()).length(4), stepOf: z.string(),
  fields: z.object({ name: z.string(), email: z.string(), company: z.string(), country: z.string(), industry: z.string(), teamSize: z.string(), slot: z.string(), message: z.string() }),
  slotHint: z.string(), other: z.string(), teamSizes: z.record(z.string(), z.string()),
  errors: z.object({ required: z.string(), email: z.string(), choose: z.string(), generic: z.string() }),
  next: z.string(), back: z.string(), send: z.string(), sending: z.string(),
  notConnected: z.string(), notConnectedEmail: z.string(), failed: z.string(), botFailed: z.string(), sent: z.string(), privacy: z.string(),
});
export type LeadFormText = z.infer<typeof LeadFormText>;

export const LeadPageContent = z.object({
  meta: PageMeta, eyebrow: z.string(), title: z.string(), lede: z.string(),
  expect: z.array(z.object({ title: z.string(), body: z.string() })), form: LeadFormText,
});
