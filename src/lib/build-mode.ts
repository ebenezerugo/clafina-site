export type BuildMode = 'preview' | 'production';

/** Preview builds show everything; production builds enforce the switch and settings rules. */
export function buildMode(): BuildMode {
  const value = process.env.CLAFINA_BUILD ?? 'preview';
  if (value !== 'preview' && value !== 'production') {
    throw new Error(`CLAFINA_BUILD must be preview or production, got ${value}`);
  }
  return value;
}
