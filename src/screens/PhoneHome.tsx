import { localeInfo, type Locale } from '@/config/locales';
import { loadContent } from '@/content/load';
import { PhoneHomeScreen } from '@/content/screens';
import { PhoneFrame } from './kit/frames';
import { formatMoney } from './kit/money';
import { AttentionRow, Card, StatCard } from './kit/parts';
import { ScaledScreen } from './kit/ScaledScreen';

export function PhoneHome({ locale }: { locale: Locale }) {
  const c = loadContent(locale, 'screens/phone-home', PhoneHomeScreen);
  const m = (n: number) => formatMoney(n, c.currency, locale);
  return (
    <ScaledScreen width={390} height={844} label={c.label} dir={localeInfo(locale).dir}>
      <PhoneFrame org={c.org} tabs={c.tabs}>
        <div><div className="s-title">{c.greeting}</div><p className="s-sub">{c.intro}</p></div>
        <StatCard icon="sales" label={c.salesToday.label} value={m(c.salesToday.amount)} change={{ tone: 'good', text: c.salesToday.change, dir: 'up' }} note={c.salesToday.note} />
        <Card title={c.attentionTitle}>
          {c.attention.map((a) => (
            <AttentionRow key={a.title} tone={a.tone} icon={a.icon} title={a.title} body={a.amount === undefined ? a.body : `${m(a.amount)} ${a.body}`} action={a.action} />
          ))}
        </Card>
      </PhoneFrame>
    </ScaledScreen>
  );
}
