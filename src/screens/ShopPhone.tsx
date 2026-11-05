import type { CSSProperties } from 'react';
import { localeInfo, type Locale } from '@/config/locales';
import { loadContent } from '@/content/load';
import { ShopPhoneScreen } from '@/content/screens';
import { Icon } from './kit/Icon';
import { formatMoney } from './kit/money';
import { ScaledScreen } from './kit/ScaledScreen';

// A storefront wears the business's own brand (here a fictional restaurant's terracotta), not Clafina's.
const shop = { '--s-page': '#fff8f0', '--s-ink': '#2b1b14', '--s-line': '#ebdccb', '--s-muted': '#6b5648', '--s-brand': '#b5300f' } as CSSProperties;
const serif = "Georgia, 'Times New Roman', serif";
const plates = ['#f8e3d3', '#f3ead2', '#e3ecd8', '#f7dede'];

export function ShopPhone({ locale }: { locale: Locale }) {
  const c = loadContent(locale, 'screens/shop-phone', ShopPhoneScreen);
  const m = (n: number) => formatMoney(n, c.currency, locale);
  return (
    <ScaledScreen width={390} height={844} label={c.label} dir={localeInfo(locale).dir}>
      <div style={{ ...shop, display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', color: 'var(--s-ink)' }}>
        <div className="s-row" style={{ height: 60, alignItems: 'center', justifyContent: 'space-between', paddingInline: 16, borderBottom: '1px solid var(--s-line)' }}>
          <span className="s-row" style={{ alignItems: 'center', gap: 10 }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--s-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontWeight: 700, fontSize: 16 }}>{c.shop.initials}</span>
            <span style={{ fontFamily: serif, fontWeight: 700, fontSize: 19 }}>{c.shop.name}</span>
          </span>
          <Icon name="search" size={20} />
        </div>
        <div style={{ padding: '10px 16px' }}>
          <div className="s-row" style={{ alignItems: 'center', gap: 10, minHeight: 52, padding: '6px 14px', borderRadius: 14, border: '1px solid var(--s-line)' }}>
            <Icon name="clock" size={18} />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: '18px' }}><b style={{ fontSize: 15 }}>{c.pickup.title}</b><span className="s-sub">{c.pickup.place}</span></span>
          </div>
        </div>
        <div className="s-row" style={{ gap: 8, padding: '0 16px 12px', borderBottom: '1px solid var(--s-line)', overflow: 'hidden' }}>
          {c.categories.map((cat) => (
            <span key={cat} style={{ height: 44, paddingInline: 18, borderRadius: 999, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', fontSize: 15, fontWeight: 600, flexShrink: 0, ...(cat === c.active ? { background: 'var(--s-brand)', color: '#fff' } : { border: '1px solid var(--s-line)' }) }}>{cat}</span>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className="s-row" style={{ padding: '16px 16px 6px', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontFamily: serif, fontSize: 22, fontWeight: 700 }}>{c.active}</span><span className="s-sub">{c.sectionCount}</span></div>
          {c.dishes.map((d, i) => (
            <div key={d.name} className="s-row" style={{ gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--s-line)' }}>
              <span style={{ width: 96, height: 96, borderRadius: 14, background: plates[i % plates.length], flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff', boxShadow: 'inset 0 0 0 10px rgba(181,48,15,.18)' }} />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span><span style={{ fontFamily: serif, fontWeight: 700, fontSize: 17, lineHeight: 1.2, display: 'block' }}>{d.name}</span><span className="s-sub">{d.note}</span></span>
                <span className="s-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <span><b style={{ fontSize: 16 }}>{m(d.price)}</b>{d.tag && <span style={{ fontSize: 12, fontWeight: 700, color: '#833d07', marginInlineStart: 8 }}>{d.tag}</span>}</span>
                  <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--s-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={24} strokeWidth={2.4} /></span>
                </span>
              </span>
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 16px 16px', borderTop: '1px solid var(--s-line)' }}>
          <div className="s-row" style={{ alignItems: 'center', gap: 12, height: 56, paddingInline: 20, borderRadius: 999, background: 'var(--s-brand)', color: '#fff', fontSize: 16, fontWeight: 700 }}>
            <span style={{ minWidth: 28, height: 28, borderRadius: 14, background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{c.basket.count}</span>
            <span style={{ flex: 1 }}>{c.basket.label}</span><span>{m(c.basket.amount)}</span>
          </div>
        </div>
      </div>
    </ScaledScreen>
  );
}
