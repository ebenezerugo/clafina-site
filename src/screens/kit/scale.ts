/** How much a screen drawn at designWidth must shrink to fit its container. Never enlarges. */
export function fitScale(containerWidth: number, designWidth: number): number {
  if (containerWidth <= 0 || designWidth <= 0) return 0;
  return Math.min(1, containerWidth / designWidth);
}
