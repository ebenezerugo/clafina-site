import { Fragment } from 'react';
import { resolve, splitTokens } from './tokens';

/**
 * Text that may hold name and money tokens. Each token is built with the global profile in a <span data-tk>,
 * which ProfileSwapper turns into the visitor's own names and money. Text without tokens renders as it is.
 */
export function Tk({ text }: { text: string }) {
  if (!text.includes('⟦')) return text;
  return (
    <>
      {splitTokens(text).map((part, i) => (typeof part === 'string'
        ? <Fragment key={i}>{part}</Fragment>
        : <span key={i} data-tk={`${part.kind}:${part.key}`}>{resolve(part.kind, part.key, 'global')}</span>))}
    </>
  );
}
