'use client';

import { useId } from 'react';
import type { Plan, PlanId } from '@/config/plans';
import { setCountry, useCountry, type CountryCode } from '@/components/switchers/CountrySwitcher';

export interface PlanCardText { name: string; tagline: string; cta: string; href: string; features: string[]; limits: string[] }

/** Plan cards whose prices follow the visitor's country, chosen here or in the footer. */
export function PlanCards({ plans, text, labels, countries, lang }: {
  plans: Plan[];
  lang: string;
  text: Record<PlanId, PlanCardText>;
  labels: { pricesFor: string; perMonth: string; free: string; talkToUs: string; mostChosen: string; notes: Record<CountryCode, string> };
  countries: { code: CountryCode; name: string }[];
}) {
  const id = useId();
  const country = useCountry();
  const price = (p: Plan) => {
    const { amount, currency } = p.price[country];
    if (amount === null) return labels.talkToUs;
    if (amount === 0) return labels.free;
    return new Intl.NumberFormat(lang, { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={id} className="font-semibold">{labels.pricesFor}</label>
        <select id={id} value={country} onChange={(e) => setCountry(e.target.value as CountryCode)} className="min-h-11 rounded-md border border-line bg-raised px-3">
          {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <span className="text-sm text-muted">{labels.notes[country]}</span>
      </div>
      <ul className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => {
          const t = text[p.id];
          return (
            <li key={p.id} className={`relative flex min-w-0 flex-col gap-5 rounded-2xl border bg-raised p-6 ${p.highlighted ? 'border-primary shadow-lg' : 'border-line'}`}>
              {p.highlighted && <span className="absolute -top-3 start-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-on-primary">{labels.mostChosen}</span>}
              <div>
                <h2 className="text-xl font-bold">{t.name}</h2>
                <p className="mt-1 text-sm text-muted">{t.tagline}</p>
              </div>
              <p>
                <span data-testid={`price-${p.id}`} className="text-4xl font-extrabold tracking-tight tabular">{price(p)}</span>
                {p.price[country].amount ? <span className="ms-1 text-sm text-muted">{labels.perMonth}</span> : null}
              </p>
              <a data-testid={`cta-${p.id}`} href={t.href} data-signup={p.id === 'enterprise' ? undefined : ''} className={`inline-flex min-h-12 items-center justify-center rounded-control px-5 font-semibold ${p.highlighted ? 'bg-primary text-on-primary hover:bg-primary-hover' : 'border border-line hover:bg-surface'}`}>{t.cta}</a>
              <ul className="grid gap-1 text-sm text-muted">{t.limits.map((l) => <li key={l}>{l}</li>)}</ul>
              <ul className="grid gap-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2"><svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-good"><path d="M20 6 9 17l-5-5" /></svg>{f}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
