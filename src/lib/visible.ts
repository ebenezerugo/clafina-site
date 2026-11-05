import { isOn, type SwitchKey } from '@/config/switches';

/** A pre-launch item shows only while pre-launch features, and its own area, are switched on. */
export function visible(item: { prelaunch?: string }): boolean {
  return !item.prelaunch || (isOn('prelaunch.features') && isOn(`prelaunch.${item.prelaunch}` as SwitchKey));
}
