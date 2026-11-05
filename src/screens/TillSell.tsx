import { Fragment, type CSSProperties } from 'react';
import { localeInfo, type Locale } from '@/config/locales';
import { loadContent } from '@/content/load';
import { TillSellScreen } from '@/content/screens';
import { Icon } from './kit/Icon';
import { TillFrame } from './kit/frames';
import { formatMoney } from './kit/money';
import { ScaledScreen } from './kit/ScaledScreen';

// The till has its own look in the mockups: a softer grey ground and a blue accent.
const till = { '--s-page': '#f4f5f8', '--s-line': '#e3e6ec', '--s-muted': '#5b6475', '--s-brand': '#1f4fd8' } as CSSProperties;
const tones = [['#fde8d7', '#8a3b0a'], ['#e3f1e8', '#1b6b45'], ['#fbe3e8', '#8f1d3a'], ['#e6ecfd', '#163ba6'], ['#f3e8fd', '#5b21b6'], ['#fff2cc', '#6b4e00']] as const;

export function TillSell({ locale }: { locale: Locale }) {
  const c = loadContent(locale, 'screens/till-sell', TillSellScreen);
  const m = (n: number) => formatMoney(n, c.currency, locale);
  const o = c.order;
  return (
    <ScaledScreen width={1280} height={800} label={c.label} dir={localeInfo(locale).dir}>
      <div style={{ ...till, display: 'contents' }}>
        <TillFrame>
          <div style={{ ...till, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--s-page)' }}>
            <div className="s-row" style={{ height: 68, alignItems: 'center', paddingInline: 20, background: '#fff', borderBottom: '1px solid var(--s-line)' }}>
              <div className="s-search" style={{ height: 44, maxWidth: 'none', borderRadius: 12, fontSize: 15 }}><Icon name="search" size={18} />{c.search}</div>
              <span className="s-pill" data-tone="good">{c.online}</span>
              <span className="s-row" style={{ alignItems: 'center', gap: 10 }}><span className="s-avatar" style={{ width: 32, height: 32, background: '#ffe7d6', color: '#8a3b0a' }}>{c.cashier.initials}</span><span><b>{c.cashier.name}</b><br /><span className="s-sub" style={{ fontSize: 12 }}>{c.cashier.role}</span></span></span>
            </div>
            <div className="s-row" style={{ padding: '14px 20px 0', gap: 8 }}>
              {c.categories.map((cat) => (
                <span key={cat.name} style={{ height: 40, paddingInline: 14, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, whiteSpace: 'nowrap', ...(cat.active ? { background: 'var(--s-brand)', color: '#fff', fontWeight: 600 } : { background: '#fff', border: '1px solid var(--s-line)' }) }}>
                  {cat.name}<span style={{ fontSize: 12, padding: '1px 7px', borderRadius: 10, background: cat.active ? 'rgba(255,255,255,.22)' : '#f0f2f6' }}>{cat.count}</span>
                </span>
              ))}
            </div>
            <div style={{ flex: 1, padding: '14px 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, alignContent: 'start' }}>
              {c.items.map((item, i) => {
                const [bg, fg] = tones[i % tones.length]!;
                const out = item.flag && item.stock === item.flag;
                return (
                  <div key={item.name} style={{ background: '#fff', border: '1px solid var(--s-line)', borderRadius: 16, overflow: 'hidden', opacity: out ? 0.55 : 1 }}>
                    <div style={{ position: 'relative', height: 92, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700 }}>
                      {item.initials}
                      {item.flag && <span style={{ position: 'absolute', top: 8, insetInlineEnd: 8, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: out ? '#14171f' : '#fff2dc', color: out ? '#fff' : '#8a5200' }}>{item.flag}</span>}
                    </div>
                    <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</span>
                      <span className="s-sub" style={{ fontSize: 12 }}>{item.stock}</span>
                      <span className="s-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <b style={{ fontSize: 16 }}>{m(item.price)}</b>
                        <span style={{ width: 40, height: 40, borderRadius: 20, background: out ? '#e3e6ec' : 'var(--s-brand)', color: out ? '#9aa3b5' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={20} strokeWidth={2.4} /></span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <aside style={{ ...till, width: 390, flexShrink: 0, background: '#fff', borderInlineStart: '1px solid var(--s-line)', display: 'flex', flexDirection: 'column', padding: '18px 20px', gap: 12 }}>
            <div className="s-row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}><b style={{ fontSize: 20 }}>{o.title}</b><span className="s-sub" style={{ fontSize: 14 }}>{o.meta}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: 4, background: 'var(--s-page)', borderRadius: 12 }}>
              {o.types.map((t, i) => <span key={t} style={{ height: 38, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, ...(i === 0 ? { background: '#fff', fontWeight: 600, boxShadow: '0 1px 2px rgba(20,23,31,.12)' } : { color: 'var(--s-muted)' }) }}>{t}</span>)}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {o.lines.map((l) => (
                <div key={l.name} className="s-row" style={{ padding: '10px 0', borderBottom: '1px solid var(--s-line)' }}>
                  <span style={{ flex: 1, minWidth: 0 }}><b>{l.name}</b><br /><span className="s-sub" style={{ fontSize: 12 }}>{l.detail} · ×{l.qty}</span></span>
                  <b>{m(l.total)}</b>
                </div>
              ))}
            </div>
            <div className="s-row" style={{ padding: '10px 12px', borderRadius: 10, background: '#fff5e5', color: '#7a4600', alignItems: 'center', gap: 8 }}><Icon name="alert" />{o.warning}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 6, fontSize: 14 }}>
              {o.totals.map((t) => <Fragment key={t.label}><span className="s-sub">{t.label}</span><span>{m(t.amount)}</span></Fragment>)}
              <b style={{ fontSize: 18, paddingTop: 6 }}>{o.totalLabel}</b><b style={{ fontSize: 22, paddingTop: 4 }}>{m(o.total)}</b>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {o.pay.map((p, i) => <span key={p} style={{ height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, ...(i === 0 ? { border: '2px solid var(--s-brand)', background: '#eef2fd', color: '#163ba6' } : { border: '1px solid var(--s-line)' }) }}>{p}</span>)}
            </div>
            <div className="s-row" style={{ height: 60, borderRadius: 14, background: 'var(--s-brand)', color: '#fff', alignItems: 'center', justifyContent: 'space-between', paddingInline: 22, fontSize: 18, fontWeight: 700 }}><span>{o.charge}</span><span>{m(o.total)}</span></div>
          </aside>
        </TillFrame>
      </div>
    </ScaledScreen>
  );
}
