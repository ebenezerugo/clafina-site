import { z } from 'zod';
import { ICON_NAMES } from '../screens/kit/types';

const icon = z.enum(ICON_NAMES);
const tone = z.enum(['good', 'warn', 'bad', 'info', 'neutral']);
const strongTone = z.enum(['good', 'warn', 'bad', 'info']);

/** One cell or value on a screen: text, money, a status pill, bold text, or a person with initials. */
export const Cell = z.union([
  z.string(),
  z.strictObject({ money: z.number() }),
  z.strictObject({ pill: tone, text: z.string() }),
  z.strictObject({ strong: z.string() }),
  z.strictObject({ avatar: z.string(), text: z.string() }),
]);
export type Cell = z.infer<typeof Cell>;

const Stats = z.strictObject({ type: z.literal('stats'), items: z.array(z.strictObject({ icon, label: z.string(), value: Cell, change: z.strictObject({ tone, text: z.string(), dir: z.enum(['up', 'down']).optional() }).optional(), note: z.string().optional() })).min(1).max(4) });
const Attention = z.strictObject({ type: z.literal('attention'), title: z.string(), items: z.array(z.strictObject({ tone: strongTone, icon, title: z.string(), body: z.string(), action: z.string().optional() })).min(1) });
const Table = z.strictObject({ type: z.literal('table'), title: z.string().optional(), columns: z.array(z.strictObject({ label: z.string(), numeric: z.boolean().optional() })).min(1), rows: z.array(z.array(Cell)).min(1) });
const Steps = z.strictObject({ type: z.literal('steps'), items: z.array(z.string()).min(2), current: z.number().int().min(0) });
const Kv = z.strictObject({ type: z.literal('kv'), title: z.string().optional(), items: z.array(z.strictObject({ label: z.string(), value: Cell })).min(1) });
const Cards = z.strictObject({ type: z.literal('cards'), columns: z.number().int().min(1).max(4), items: z.array(z.strictObject({ title: z.string(), body: z.string(), value: Cell.optional(), pill: z.strictObject({ tone, text: z.string() }).optional() })).min(1) });
const Progress = z.strictObject({ type: z.literal('progress'), label: z.string(), value: z.number().min(0).max(100), note: z.string().optional() });

export type Block =
  | z.infer<typeof Stats> | z.infer<typeof Attention> | z.infer<typeof Table> | z.infer<typeof Steps>
  | z.infer<typeof Kv> | z.infer<typeof Cards> | z.infer<typeof Progress>
  | { type: 'row'; widths?: string; blocks: Block[] };

export const BlockSchema: z.ZodType<Block> = z.lazy(() => z.discriminatedUnion('type', [
  Stats, Attention, Table, Steps, Kv, Cards, Progress,
  z.strictObject({ type: z.literal('row'), widths: z.string().optional(), blocks: z.array(BlockSchema).min(1) }),
]));

const org = z.strictObject({ initials: z.string().max(3), name: z.string(), place: z.string() });

/** A product screen described as data, drawn by SpecScreen with the screen kit. */
export const ScreenSpec = z.strictObject({
  spec: z.literal(1),
  illustrative: z.literal(true),
  label: z.string().startsWith('Illustrative example'),
  currency: z.enum(['NGN', 'USD', 'GHS', 'KES', 'EUR']),
  frame: z.enum(['app', 'phone']),
  org,
  nav: z.array(z.strictObject({ label: z.string().optional(), items: z.array(z.strictObject({ label: z.string(), badge: z.string().optional(), active: z.boolean().optional() })) })).optional(),
  tabs: z.array(z.strictObject({ label: z.string(), icon, active: z.boolean().optional() })).optional(),
  goTo: z.string().optional(),
  search: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  actions: z.array(z.strictObject({ label: z.string(), primary: z.boolean().optional(), icon: icon.optional() })).optional(),
  blocks: z.array(BlockSchema).min(1),
});
export type ScreenSpec = z.infer<typeof ScreenSpec>;

function rowWidths(blocks: Block[], path: string, out: string[]): void {
  blocks.forEach((b, i) => {
    const here = `${path}.${i}`;
    if (b.type === 'table') b.rows.forEach((r, j) => { if (r.length !== b.columns.length) out.push(`${here}.rows.${j} has ${r.length} cells for ${b.columns.length} columns`); });
    if (b.type === 'row') rowWidths(b.blocks, `${here}.blocks`, out);
  });
}

/** Problems with a screen spec, as paths a person can find in the file. Empty means it draws. */
export function checkScreenSpec(data: unknown): string[] {
  const parsed = ScreenSpec.safeParse(data);
  if (!parsed.success) return parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
  const out: string[] = [];
  rowWidths(parsed.data.blocks, 'blocks', out);
  return out;
}
