import { localeInfo, type Locale } from '@/config/locales';
import { loadContent } from '@/content/load';
import { ScreenSpec, type Block, type Cell } from '@/content/screen-spec';
import { AppFrame, PhoneFrame } from './kit/frames';
import { formatMoney, type Currency } from './kit/money';
import { AttentionRow, Avatar, Card, DataTable, KitButton, Pill, Progress, StatCard } from './kit/parts';
import { ScaledScreen } from './kit/ScaledScreen';

function cell(c: Cell, money: (n: number) => string) {
  if (typeof c === 'string') return c;
  if ('money' in c) return money(c.money);
  if ('pill' in c) return <Pill tone={c.pill}>{c.text}</Pill>;
  if ('strong' in c) return <b>{c.strong}</b>;
  return <span className="s-row" style={{ alignItems: 'center', gap: 8 }}><Avatar initials={c.avatar} />{c.text}</span>;
}
const text = (c: Cell, money: (n: number) => string) => (typeof c === 'string' ? c : 'money' in c ? money(c.money) : 'text' in c ? c.text : c.strong);

function BlockView({ b, money }: { b: Block; money: (n: number) => string }) {
  switch (b.type) {
    case 'stats':
      return (
        <div className="s-grid" style={{ gridTemplateColumns: `repeat(${b.items.length}, minmax(0, 1fr))` }}>
          {b.items.map((s) => <StatCard key={s.label} icon={s.icon} label={s.label} value={text(s.value, money)} change={s.change} note={s.note} />)}
        </div>
      );
    case 'attention':
      return <Card title={b.title}>{b.items.map((a) => <AttentionRow key={a.title} {...a} />)}</Card>;
    case 'table':
      return (
        <Card title={b.title}>
          <DataTable columns={b.columns.map((col, i) => ({ key: String(i), label: col.label, numeric: col.numeric }))} rows={b.rows.map((r) => Object.fromEntries(r.map((c, i) => [String(i), cell(c, money)])))} />
        </Card>
      );
    case 'steps':
      return <div className="s-row" style={{ gap: 8, flexWrap: 'wrap' }}>{b.items.map((s, i) => <Pill key={s} tone={i < b.current ? 'good' : i === b.current ? 'warn' : 'neutral'}>{i + 1} · {s}</Pill>)}</div>;
    case 'kv':
      return (
        <Card title={b.title}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
            {b.items.map((kv) => [<span key={`${kv.label}-k`} className="s-sub">{kv.label}</span>, <span key={`${kv.label}-v`} style={{ fontWeight: 600 }}>{cell(kv.value, money)}</span>])}
          </div>
        </Card>
      );
    case 'cards':
      return (
        <div className="s-grid" style={{ gridTemplateColumns: `repeat(${b.columns}, minmax(0, 1fr))` }}>
          {b.items.map((it) => (
            <div key={it.title} className="s-card">
              <div className="s-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}><span className="s-card-title">{it.title}</span>{it.pill && <Pill tone={it.pill.tone}>{it.pill.text}</Pill>}</div>
              {it.value !== undefined && <span className="s-stat-value" style={{ fontSize: 20 }}>{cell(it.value, money)}</span>}
              <p className="s-sub">{it.body}</p>
            </div>
          ))}
        </div>
      );
    case 'progress':
      return <Card title={b.label}><Progress value={b.value} />{b.note && <p className="s-sub">{b.note}</p>}</Card>;
    case 'row':
      return <div className="s-grid" style={{ gridTemplateColumns: b.widths ?? `repeat(${b.blocks.length}, minmax(0, 1fr))` }}>{b.blocks.map((inner, i) => <BlockView key={i} b={inner} money={money} />)}</div>;
  }
}

/** Any product screen described by a content file in content/<locale>/screens/<id>.json. */
export function SpecScreen({ locale, id }: { locale: Locale; id: string }) {
  const s = loadContent(locale, `screens/${id}`, ScreenSpec);
  const money = (n: number) => formatMoney(n, s.currency as Currency, locale);
  const dir = localeInfo(locale).dir;
  const blocks = s.blocks.map((b, i) => <BlockView key={i} b={b} money={money} />);

  if (s.frame === 'phone') {
    return (
      <ScaledScreen width={390} height={844} label={s.label} dir={dir}>
        <PhoneFrame org={s.org} tabs={s.tabs ?? []}>
          <div><div className="s-title">{s.title}</div>{s.subtitle && <p className="s-sub">{s.subtitle}</p>}</div>
          {blocks}
        </PhoneFrame>
      </ScaledScreen>
    );
  }
  return (
    <ScaledScreen width={1280} height={800} label={s.label} dir={dir}>
      <AppFrame org={s.org} nav={s.nav ?? []} goTo={s.goTo ?? ''} search={s.search ?? ''} title={s.title} subtitle={s.subtitle}
        actions={s.actions?.length ? <>{s.actions.map((a) => <KitButton key={a.label} variant={a.primary ? 'primary' : 'secondary'} icon={a.icon}>{a.label}</KitButton>)}</> : undefined}>
        {blocks}
      </AppFrame>
    </ScaledScreen>
  );
}
