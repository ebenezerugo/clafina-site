import { describe, expect, it } from 'vitest';
import { checkOutput } from '../../scripts/check-output';
import { makeTempDir } from '../helpers/tmp';

describe('checkOutput', () => {
  it('flags docs and brand folders in the output', () => {
    const dir = makeTempDir({ 'index.html': '', 'docs/CONTEXT.md': '', 'brand/README.md': '' });
    expect(checkOutput(dir)).toEqual([
      'out/ must not contain docs/',
      'out/ must not contain brand/',
      'out/ must not contain Markdown files: brand/README.md, docs/CONTEXT.md',
    ]);
  });
  it('passes a clean output', () => {
    expect(checkOutput(makeTempDir({ 'en/index.html': '' }))).toEqual([]);
  });
  it('flags a missing output folder', () => {
    expect(checkOutput('/nonexistent')).toEqual(['out/ does not exist: run the build first']);
  });
});
