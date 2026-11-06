import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { loadContent } from '@/content/load';
import { TemplatesContent } from '@/content/pages';
import { formatMoney } from '@/screens/kit/money';
import { openPage } from '@/lib/help';
import { enabledLocales, pageLocale, pageMetadata } from '@/lib/simple-page';
import { IllustrativeLabel } from '@/components/sections/ui';
import { PrintButton } from '@/components/resources/PrintButton';

type Props = { params: Promise<{ locale: string }> };
export const generateStaticParams = enabledLocales;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await pageLocale(params);
  return pageMetadata(locale, '/resources/templates/', loadContent(locale, 'templates', TemplatesContent).meta);
}

export default async function TemplatesPage({ params }: Props) {
  const locale = await pageLocale(params);
  setRequestLocale(locale);
  const c = loadContent(locale, 'templates', TemplatesContent);
  const money = (n: number) => formatMoney(n, c.currency, locale);
  const L = c.labels;

  return (
    <main>
      <section id="hero" aria-labelledby="templates-title" className="bg-surface" data-no-print="">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{c.hero.eyebrow}</p>
          <h1 id="templates-title" className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{c.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{c.hero.lede}</p>
          <h2 className="mt-10 text-xl font-bold">{c.howToTitle}</h2>
          <ol className="mt-3 grid list-decimal gap-2 ps-6">{c.howTo.map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
      </section>
      <section id="templates" aria-labelledby="templates-title">
        <div className="mx-auto grid max-w-4xl gap-16 px-4 py-16 sm:px-6">
          {c.templates.map((d) => {
            const subtotal = d.lines.reduce((n, l) => n + l.qty * l.price, 0);
            const tax = Math.round(subtotal * d.taxRate * 100) / 100;
            return (
              <article key={d.id} id={d.id} aria-labelledby={`${d.id}-title`} className="scroll-mt-24">
                <div data-no-print="">
                  <h2 id={`${d.id}-title`} className="text-2xl font-extrabold tracking-tight">{d.title}</h2>
                  <p className="mt-2 text-muted">{d.body}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <PrintButton target={d.id} label={c.print} />
                    <a href={openPage(d.page)} className="inline-flex min-h-11 items-center rounded-control border border-line px-5 font-semibold hover:bg-surface">{c.makeIt}</a>
                  </div>
                </div>
                <div data-print={d.id} className="mt-6 rounded-xl border border-line bg-raised p-6 sm:p-10">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div><p className="text-xl font-extrabold">{c.business.name}</p><p className="text-muted">{c.business.place}</p></div>
                    <div className="text-end"><p className="text-2xl font-extrabold uppercase tracking-wide">{d.title}</p><p className="text-sm text-muted">{L.number} {d.number} · {L.date} {d.date}</p></div>
                  </div>
                  <p className="mt-8 text-sm text-muted">{L.to}</p>
                  <p className="font-semibold">{d.to}</p>
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[480px] text-start text-sm">
                      <thead><tr className="border-b border-line text-muted"><th scope="col" className="py-2 text-start font-semibold">{L.item}</th><th scope="col" className="py-2 text-end font-semibold">{L.qty}</th><th scope="col" className="py-2 text-end font-semibold">{L.price}</th><th scope="col" className="py-2 text-end font-semibold">{L.amount}</th></tr></thead>
                      <tbody>{d.lines.map((l) => <tr key={l.item} className="border-b border-line"><td className="py-2">{l.item}</td><td className="py-2 text-end tabular-nums">{l.qty}</td><td className="py-2 text-end tabular-nums">{money(l.price)}</td><td className="py-2 text-end tabular-nums">{money(l.qty * l.price)}</td></tr>)}</tbody>
                      <tfoot>
                        <tr><th scope="row" colSpan={3} className="pt-3 text-end font-normal text-muted">{L.subtotal}</th><td className="pt-3 text-end tabular-nums">{money(subtotal)}</td></tr>
                        <tr><th scope="row" colSpan={3} className="text-end font-normal text-muted">{d.taxName}</th><td className="text-end tabular-nums">{money(tax)}</td></tr>
                        <tr><th scope="row" colSpan={3} className="pt-2 text-end text-base">{d.id === 'receipt' ? L.paid : L.total}</th><td className="pt-2 text-end text-base font-extrabold tabular-nums">{money(subtotal + tax)}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                  <p className="mt-8 text-sm text-muted">{d.note}</p>
                </div>
                <div data-no-print=""><IllustrativeLabel text={c.illustrative} /></div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
