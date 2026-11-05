import { describe, expect, it } from 'vitest';
import { checkLogicalCss } from '../../scripts/check-logical-css';
import { makeTempDir } from '../helpers/tmp';

describe('checkLogicalCss', () => {
  it('reports a physical spacing class with its logical replacement', () => {
    const dir = makeTempDir({ 'a.tsx': '<div className="ps-2 ml-4">\n<p className="md:text-left right-0">' });
    expect(checkLogicalCss([`${dir}/a.tsx`]).map((p) => p.replace(`${dir}/`, ''))).toEqual([
      'a.tsx:1 uses ml-4; use ms-4',
      'a.tsx:2 uses md:text-left; use md:text-start',
      'a.tsx:2 uses right-0; use end-0',
    ]);
  });
  it('ignores words in copy and logical classes', () => {
    const dir = makeTempDir({ 'b.tsx': '<p className="ms-4 pe-2 start-0">Turn right-to-left on</p>' });
    expect(checkLogicalCss([`${dir}/b.tsx`])).toEqual([]);
  });
});
