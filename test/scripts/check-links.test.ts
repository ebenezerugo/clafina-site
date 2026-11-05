import { describe, expect, it } from 'vitest';
import { checkLinks } from '../../scripts/check-links';
import { makeTempDir } from '../helpers/tmp';

describe('checkLinks', () => {
  it('reports internal links to pages that do not exist', () => {
    const dir = makeTempDir({ 'en/index.html': '<a href="/en/pricing/">x</a><a href="/en/">y</a>' });
    expect(checkLinks(dir)).toEqual(['en/index.html links to /en/pricing/, which does not exist']);
  });
  it('accepts files, folders with index.html, fragments and queries', () => {
    const dir = makeTempDir({
      'en/index.html': '<a href="/en/#main">a</a><a href="/robots.txt">b</a><a href="/fr/?x=1">c</a><link href="/_next/a.css">',
      'fr/index.html': '', 'robots.txt': '', '_next/a.css': '',
    });
    expect(checkLinks(dir)).toEqual([]);
  });
  it('ignores external, mail and phone links', () => {
    const dir = makeTempDir({ 'index.html': '<a href="https://app.clafina.com/signup">a</a><a href="mailto:x@y.z">b</a><a href="tel:1">c</a>' });
    expect(checkLinks(dir)).toEqual([]);
  });
});
