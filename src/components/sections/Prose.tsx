import { visible } from '@/lib/visible';
import { ClaimText } from './ui';

type Para = string | { text: string; claim?: string; prelaunch?: string };

const shown = (p: Para) => (typeof p === 'string' ? true : visible(p));
const Text = ({ p }: { p: Para }) => (typeof p === 'string' ? <>{p}</> : <ClaimText text={p.text} claim={p.claim} />);

/** Long-form paragraphs and an optional list: a switched claim or pre-launch item drops out cleanly. */
export function Paragraphs({ paragraphs, list }: { paragraphs: Para[]; list?: Para[] }) {
  const items = (list ?? []).filter(shown);
  return (
    <>
      {paragraphs.filter(shown).map((p, i) => <p key={i} className="mt-4 text-lg leading-relaxed"><Text p={p} /></p>)}
      {items.length > 0 && <ul className="mt-4 grid list-disc gap-2 ps-6 text-lg">{items.map((p, i) => <li key={i}><Text p={p} /></li>)}</ul>}
    </>
  );
}
