'use client';

import { useEffect } from 'react';

const WIDE = '(min-width: 1024px)';

/**
 * Folds the footer sections on narrow screens and opens them on wide ones. On a wide screen the headings are not
 * stops for the keyboard, since there is nothing to fold.
 */
export function FooterFold() {
  useEffect(() => {
    const media = window.matchMedia(WIDE);
    const apply = () => {
      for (const d of document.querySelectorAll<HTMLDetailsElement>('details[data-footer-fold]')) {
        d.open = media.matches;
        const summary = d.querySelector('summary');
        if (media.matches) summary?.setAttribute('tabindex', '-1'); else summary?.removeAttribute('tabindex');
      }
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);
  return null;
}
