import { describe, expect, it } from 'vitest';
import { HomeContent } from '@/content/schema';
import { loadContent } from '@/content/load';

describe('loadContent', () => {
  it('falls back to English when a language has no file yet', () => {
    expect(loadContent('yo', 'home', HomeContent).hero.title).toBe('Run the whole business from one place.');
  });
  it('names the file when content is missing', () => {
    expect(() => loadContent('en', 'broken', HomeContent)).toThrow('content/en/broken.json');
  });
  it('names the file when content does not match its shape', () => {
    expect(() => loadContent('en', 'bad', HomeContent, 'test/fixtures/content')).toThrow('test/fixtures/content/en/bad.json');
  });
});
