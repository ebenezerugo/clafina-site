import { describe, expect, it } from 'vitest';
import { fitScale } from '@/screens/kit/scale';
import { pageAvailable } from '@/config/switches';

describe('fitScale', () => {
  it('shrinks a screen to fit a narrow column', () => { expect(fitScale(390, 1280)).toBeCloseTo(0.3047, 3); });
  it('never enlarges a screen', () => { expect(fitScale(1600, 1280)).toBe(1); });
  it('collapses in an empty container', () => { expect(fitScale(0, 1280)).toBe(0); expect(fitScale(-5, 1280)).toBe(0); });
});

describe('the screen gallery', () => {
  it('exists only in preview builds', () => {
    expect(pageAvailable('screens', 'production')).toBe(false);
    expect(pageAvailable('screens', 'preview')).toBe(true);
  });
});
