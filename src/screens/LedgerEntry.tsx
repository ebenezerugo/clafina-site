import { localeInfo, type Locale } from '@/config/locales';
import { loadContent } from '@/content/load';
import { LedgerEntryScreen } from '@/content/screens';
import { AppFrame } from './kit/frames';
import { formatMoney } from './kit/money';
import { Card, DataTable, KitButton, Pill } from './kit/parts';
import { ScaledScreen } from './kit/ScaledScreen';

export function LedgerEntry({ locale }: { locale: Locale }) {
  const c = loadContent(locale, 'screens/ledger-entry', LedgerEntryScreen);
  const m = (n: number | undefined) => (n === undefined ? '' : formatMoney(n, c.currency, locale));
  const debit = c.lines.reduce((s, l) => s + (l.debit ?? 0), 0);
  const credit = c.lines.reduce((s, l) => s + (l.credit ?? 0), 0);
  return (
    <ScaledScreen width={1280} height={800} label={c.label} dir={localeInfo(locale).dir}>
      <AppFrame org={c.org} nav={c.nav} goTo={c.goTo} search={c.search} title={c.title} subtitle={c.subtitle}
        actions={<><KitButton>{c.sendBack}</KitButton><KitButton variant="primary" icon="check">{c.approve}</KitButton></>}>
        <div className="s-row" style={{ gap: 8, alignItems: 'center' }}>
          {c.steps.map((step, i) => (
            <Pill key={step} tone={i < c.current ? 'good' : i === c.current ? 'warn' : 'neutral'}>{i + 1} · {step}</Pill>
          ))}
        </div>
        <div className="s-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <Card title={c.linesTitle} actions={<Pill tone={debit === credit ? 'good' : 'bad'} icon="check">{c.balanced}</Pill>}>
            <DataTable
              columns={[{ key: 'account', label: c.columns.account }, { key: 'description', label: c.columns.description }, { key: 'debit', label: c.columns.debit, numeric: true }, { key: 'credit', label: c.columns.credit, numeric: true }]}
              rows={[...c.lines.map((l) => ({ account: l.account, description: l.description, debit: m(l.debit), credit: m(l.credit) })), { account: <b>Total</b>, description: '', debit: <b>{m(debit)}</b>, credit: <b>{m(credit)}</b> }]}
            />
          </Card>
          <Card title={c.effectTitle}>
            {c.effect.map((e) => (
              <div key={e.label} className="s-attn"><div><div className="s-attn-title">{e.label}</div><p className="s-sub">{m(e.amount)} · {e.note}</p></div></div>
            ))}
            <p className="s-sub">{c.rule}</p>
          </Card>
        </div>
      </AppFrame>
    </ScaledScreen>
  );
}
