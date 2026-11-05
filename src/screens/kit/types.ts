export type Tone = 'good' | 'warn' | 'bad' | 'info' | 'neutral';
export interface Org { initials: string; name: string; place: string }
export interface NavItem { label: string; badge?: string; active?: boolean }
export interface NavGroup { label?: string; items: NavItem[] }
export interface Tab { label: string; icon: IconName; active?: boolean }
export const ICON_NAMES = ['home', 'sales', 'money', 'more', 'plus', 'bell', 'help', 'box', 'bank', 'alert', 'check', 'up', 'down', 'chevron', 'search', 'cart', 'users', 'chart', 'menu', 'phone', 'clock', 'receipt', 'table', 'leaf'] as const;
export type IconName = (typeof ICON_NAMES)[number];
