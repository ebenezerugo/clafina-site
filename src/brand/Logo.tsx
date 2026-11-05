/**
 * The only place the logo is drawn. This is the neutral placeholder wordmark;
 * the chosen brand replaces this file and src/theme/tokens.css.
 */
export function Logo({ variant = 'full', className }: { variant?: 'full' | 'mark'; className?: string }) {
  if (variant === 'mark') {
    return (
      <span role="img" aria-label="Clafina" className={className}>
        <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="var(--c-ink)" />
          <path d="M21 11.5a7 7 0 1 0 0 9" fill="none" stroke="var(--c-page)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  return (
    <span aria-label="Clafina" role="img" className={`font-display text-xl font-extrabold tracking-tight lowercase ${className ?? ''}`}>
      <span aria-hidden="true">clafina</span>
    </span>
  );
}
