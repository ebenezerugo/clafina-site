import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import QRCode from 'qrcode';
import { SITE, fact } from '@/config/site';
import { loadContent } from '@/content/load';
import { DownloadContent } from '@/content/pages';
import { localePath } from '@/lib/paths';
import { SITE_ORIGIN } from '@/lib/seo';
import { enabledLocales, pageLocale, pageMetadata } from '@/lib/simple-page';
import { DeviceStore } from '@/components/resources/DeviceStore';
import { Eyebrow, HeroAura } from '@/components/sections/ui';

type Props = { params: Promise<{ locale: string }> };
export const generateStaticParams = enabledLocales;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await pageLocale(params);
  return pageMetadata(locale, '/download/', loadContent(locale, 'download', DownloadContent).meta);
}

function StoreLink({ href, text, notYet }: { href?: string; text: string; notYet: string }) {
  return href
    ? <a href={href} className="inline-flex min-h-12 items-center rounded-control border border-line bg-raised px-5 font-semibold hover:border-ink">{text}</a>
    : <span className="inline-flex min-h-12 items-center rounded-control border border-dashed border-line px-5 text-muted">{text} · {notYet}</span>;
}

export default async function DownloadPage({ params }: Props) {
  const locale = await pageLocale(params);
  setRequestLocale(locale);
  const c = loadContent(locale, 'download', DownloadContent);
  const s = SITE.stores;
  const appStore = fact(s.appStore), googlePlay = fact(s.googlePlay), desktop = fact(s.tillDesktop), android = fact(s.tillAndroid), web = fact(s.tillWeb);
  // The code opens this page on the phone, which then offers the store for that phone.
  const qr = await QRCode.toString(`${SITE_ORIGIN}${localePath(locale, '/download/')}`, { type: 'svg', margin: 1, color: { dark: '#11151c', light: '#ffffff' } });

  return (
    <main>
      <section id="hero" aria-labelledby="download-title" className="isolate relative bg-surface">
        <HeroAura />
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-20">
          <Eyebrow>{c.hero.eyebrow}</Eyebrow>
          <h1 id="download-title" className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{c.hero.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-muted">{c.hero.lede}</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-2">
        <section id="phone" aria-labelledby="phone-title" className="rounded-2xl border border-line p-6">
          <h2 id="phone-title" className="text-2xl font-extrabold">{c.phone.title}</h2>
          <p className="mt-2 text-muted">{c.phone.body}</p>
          <DeviceStore label={c.forYourDevice} ios={appStore ? { href: appStore, text: c.phone.appStore } : undefined} android={googlePlay ? { href: googlePlay, text: c.phone.googlePlay } : undefined} />
          <div className="mt-6 flex flex-wrap gap-3">
            <StoreLink href={appStore} text={c.phone.appStore} notYet={c.notYet} />
            <StoreLink href={googlePlay} text={c.phone.googlePlay} notYet={c.notYet} />
          </div>
          <div className="mt-8 hidden items-center gap-5 md:flex">
            <div role="img" aria-label={c.phone.qr} className="size-32 shrink-0 rounded-lg bg-white p-1" dangerouslySetInnerHTML={{ __html: qr }} />
            <p className="text-sm text-muted">{c.phone.qr}</p>
          </div>
        </section>
        <section id="till" aria-labelledby="till-title" className="rounded-2xl border border-line p-6">
          <h2 id="till-title" className="text-2xl font-extrabold">{c.till.title}</h2>
          <p className="mt-2 text-muted">{c.till.body}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <StoreLink href={desktop} text={c.till.desktop} notYet={c.notYet} />
            <StoreLink href={android} text={c.till.android} notYet={c.notYet} />
            <StoreLink href={web} text={c.till.browser} notYet={c.notYet} />
          </div>
        </section>
      </div>
    </main>
  );
}
