import { localeInfo, type Locale } from '@/config/locales';
import { loadContent } from '@/content/load';
import { SalesHomeScreen } from '@/content/screens';
import { AppFrame } from './kit/frames';
import { formatMoney } from './kit/money';
import { AttentionRow, Card, KitButton } from './kit/parts';
import { ScaledScreen } from './kit/ScaledScreen';

export function SalesHome({ locale }: { locale: Locale }) {
  const c = loadContent(locale, 'screens/sales-home', SalesHomeScreen);
  const m = (n: number) => formatMoney(n, c.currency, locale);
  return (
    <ScaledScreen width={1280} height={800} label={c.label} dir={localeInfo(locale).dir}>
      <AppFrame org={c.org} nav={c.nav} goTo={c.goTo} search={c.search} title={c.title} subtitle={c.subtitle}
        actions={<><KitButton>{c.newQuote}</KitButton><KitButton variant="primary" icon="plus">{c.newInvoice}</KitButton></>}>
        <Card title={c.pipelineTitle}>
          <div className="s-grid" style={{ gridTemplateColumns: `repeat(${c.pipeline.length}, 1fr)`, marginTop: 6 }}>
            {c.pipeline.map((step, i) => (
              <div key={step.label} className="s-card" style={{ background: i === 3 ? 'var(--s-chip)' : undefined }}>
                <span className="s-sub" style={{ fontWeight: 600 }}>{i + 1} · {step.label}</span>
                <span className="s-stat-value" style={{ fontSize: 20 }}>{step.amount === null ? '—' : m(step.amount)}</span>
                <span className="s-sub">{step.note}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title={c.attentionTitle}>
          {c.attention.map((a) => <AttentionRow key={a.title} tone={a.tone} icon={a.icon} title={a.title} body={a.body} action={a.action} />)}
        </Card>
      </AppFrame>
    </ScaledScreen>
  );
}
