'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { LeadFormText } from '@/content/lead-page';
import { campaignFrom, CAMPAIGN_STORAGE_KEY, type Campaign } from '@/lib/campaign';
import { TEAM_SIZES } from '@/lib/lead-options';

type Field = 'name' | 'email' | 'company' | 'country' | 'industry' | 'teamSize' | 'slot' | 'message';
const STEP_FIELDS: Field[][] = [['name', 'email', 'company', 'country'], ['industry'], ['teamSize'], ['slot', 'message']];
const REQUIRED: Field[] = ['name', 'email', 'company', 'country', 'industry', 'teamSize'];
type Status = 'idle' | 'sending' | 'sent' | 'not_connected' | 'failed' | 'bot';

function storedCampaign(): Campaign {
  try { return JSON.parse(sessionStorage.getItem(CAMPAIGN_STORAGE_KEY) ?? '{}') as Campaign; } catch { return {}; }
}

/** A four-step enquiry. It only says thanks after the server accepted the request. */
export function LeadForm({ kind, locale, text, industries, countries, salesEmail, turnstileSiteKey }: {
  kind: 'demo' | 'sales'; locale: string; text: LeadFormText;
  industries: { id: string; label: string }[]; countries: { code: string; name: string }[];
  salesEmail?: string; turnstileSiteKey?: string;
}) {
  const uid = useId();
  const [step, setStep] = useState(0);
  // The industry can come from the link (?industry=…). Step 1 is not shown on first render, so reading it here never mismatches the server HTML.
  const [values, setValues] = useState<Record<Field, string>>(() => {
    const preset = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('industry');
    const industry = preset && industries.some((i) => i.id === preset) ? preset : '';
    return { name: '', email: '', company: '', country: '', industry, teamSize: '', slot: '', message: '' };
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const heading = useRef<HTMLHeadingElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    heading.current?.focus();
  }, [step]);

  useEffect(() => { if (status !== 'idle' && status !== 'sending') statusRef.current?.focus(); }, [status]);

  const set = (f: Field, v: string) => { setValues((s) => ({ ...s, [f]: v })); setErrors((e) => ({ ...e, [f]: undefined })); };

  const check = (fields: Field[]) => {
    const found: Partial<Record<Field, string>> = {};
    for (const f of fields) {
      const v = values[f].trim();
      if (REQUIRED.includes(f) && !v) found[f] = f === 'industry' || f === 'teamSize' || f === 'country' ? text.errors.choose : text.errors.required;
      else if (f === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) found[f] = text.errors.email;
    }
    setErrors(found);
    const firstBad = fields.find((f) => found[f]);
    if (firstBad) document.getElementById(`${uid}-${firstBad}`)?.focus();
    return !firstBad;
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < 3) { if (check(STEP_FIELDS[step]!)) setStep(step + 1); return; }
    if (!check(REQUIRED)) return;
    setStatus('sending');
    const token = (e.currentTarget.elements.namedItem('cf-turnstile-response') as HTMLInputElement | null)?.value || 'unavailable';
    const campaign = { ...storedCampaign(), ...campaignFrom(window.location.search) };
    const body = {
      kind, locale, turnstileToken: token, name: values.name.trim(), email: values.email.trim(), company: values.company.trim(),
      country: values.country, industry: values.industry, teamSize: values.teamSize,
      ...(values.slot.trim() && { slot: values.slot.trim() }), ...(values.message.trim() && { message: values.message.trim() }),
      ...(Object.keys(campaign).length && { campaign }),
    };
    try {
      const res = await fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 202) setStatus('sent');
      else if (res.status === 503) setStatus('not_connected');
      else if (res.status === 403) setStatus('bot');
      else setStatus('failed');
    } catch {
      setStatus('failed');
    }
  };

  if (status === 'sent') {
    return <div ref={statusRef} tabIndex={-1} role="status" className="rounded-xl border border-good bg-good-fill p-6 font-semibold text-good">{text.sent}</div>;
  }

  const input = 'mt-2 block min-h-12 w-full rounded-lg border border-line bg-raised px-4 text-ink aria-[invalid=true]:border-bad';
  const describe = (f: Field) => (errors[f] ? `${uid}-${f}-error` : undefined);
  const err = (f: Field) => errors[f] && <p id={`${uid}-${f}-error`} className="mt-2 text-sm font-medium text-bad">{errors[f]}</p>;
  const textField = (f: Field, type = 'text', autoComplete?: string) => (
    <div key={f}>
      <label htmlFor={`${uid}-${f}`} className="font-semibold">{text.fields[f]}</label>
      <input id={`${uid}-${f}`} name={f} type={type} autoComplete={autoComplete} value={values[f]} onChange={(e) => set(f, e.target.value)} aria-invalid={!!errors[f]} aria-describedby={describe(f)} className={input} />
      {err(f)}
    </div>
  );
  const choices = (f: 'industry' | 'teamSize', options: { id: string; label: string }[]) => (
    <fieldset aria-describedby={describe(f)}>
      <legend className="font-semibold">{text.fields[f]}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((o, i) => (
          <label key={o.id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-raised px-4 has-[:checked]:border-primary has-[:checked]:bg-surface">
            <input id={i === 0 ? `${uid}-${f}` : undefined} type="radio" name={f} value={o.id} checked={values[f] === o.id} onChange={() => set(f, o.id)} className="size-4 accent-[var(--c-primary)]" />
            {o.label}
          </label>
        ))}
      </div>
      {err(f)}
    </fieldset>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-6" aria-labelledby={`${uid}-heading`}>
      <div>
        <p className="text-sm text-muted">{text.stepOf.replace('{n}', String(step + 1)).replace('{total}', '4')}</p>
        <h2 id={`${uid}-heading`} ref={heading} tabIndex={-1} className="mt-1 text-2xl font-bold outline-none">{text.steps[step]}</h2>
        <div className="mt-3 flex gap-1" aria-hidden="true">{text.steps.map((s, i) => <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-line'}`} />)}</div>
      </div>

      {step === 0 && (
        <div className="grid gap-5">
          {textField('name', 'text', 'name')}
          {textField('email', 'email', 'email')}
          {textField('company', 'text', 'organization')}
          <div>
            <label htmlFor={`${uid}-country`} className="font-semibold">{text.fields.country}</label>
            <select id={`${uid}-country`} name="country" value={values.country} onChange={(e) => set('country', e.target.value)} aria-invalid={!!errors.country} aria-describedby={describe('country')} className={input}>
              <option value="" />
              {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            {err('country')}
          </div>
        </div>
      )}
      {step === 1 && choices('industry', [...industries, { id: 'other', label: text.other }])}
      {step === 2 && choices('teamSize', TEAM_SIZES.map((s) => ({ id: s, label: text.teamSizes[s] ?? s })))}
      {step === 3 && (
        <div className="grid gap-5">
          <div>
            <label htmlFor={`${uid}-slot`} className="font-semibold">{text.fields.slot}</label>
            <p id={`${uid}-slot-hint`} className="text-sm text-muted">{text.slotHint}</p>
            <input id={`${uid}-slot`} name="slot" value={values.slot} onChange={(e) => set('slot', e.target.value)} aria-describedby={`${uid}-slot-hint`} className={input} maxLength={120} />
          </div>
          <div>
            <label htmlFor={`${uid}-message`} className="font-semibold">{text.fields.message}</label>
            <textarea id={`${uid}-message`} name="message" value={values.message} onChange={(e) => set('message', e.target.value)} rows={4} maxLength={2000} className={`${input} py-3`} />
          </div>
          {turnstileSiteKey && <div className="cf-turnstile" data-sitekey={turnstileSiteKey} />}
          <p className="text-sm text-muted">{text.privacy}</p>
        </div>
      )}

      {(status === 'not_connected' || status === 'failed' || status === 'bot') && (
        <div ref={statusRef} tabIndex={-1} role="alert" className="rounded-xl border border-warn bg-warn-fill p-4 text-warn">
          {status === 'not_connected' && <>{text.notConnected} {salesEmail && text.notConnectedEmail.replace('{email}', salesEmail)}</>}
          {status === 'failed' && text.failed}
          {status === 'bot' && text.botFailed}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="inline-flex min-h-12 items-center rounded-control border border-line px-6 font-semibold">{text.back}</button>}
        <button type="submit" disabled={status === 'sending'} className="inline-flex min-h-12 items-center rounded-control bg-primary px-6 font-semibold text-on-primary disabled:opacity-60">
          {step < 3 ? text.next : status === 'sending' ? text.sending : text.send}
        </button>
      </div>
      <input type="hidden" name="lang" value={locale} />
    </form>
  );
}
