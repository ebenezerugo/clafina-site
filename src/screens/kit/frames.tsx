import type { ReactNode } from 'react';
import { Icon } from './Icon';
import type { NavGroup, Org, Tab } from './types';

function OrgBlock({ org }: { org: Org }) {
  return (
    <div className="s-org">
      <span className="s-org-mark">{org.initials}</span>
      <span className="s-org-text"><span className="s-org-name">{org.name}</span><span className="s-org-place">{org.place}</span></span>
    </div>
  );
}

/** The web app: sidebar with the organisation, Go to page and grouped pages; a top bar; the page body. */
export function AppFrame({ org, nav, goTo, search, title, subtitle, actions, children }: {
  org: Org; nav: NavGroup[]; goTo: string; search: string; title: string; subtitle?: string; actions?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="s-app">
      <aside className="s-side">
        <OrgBlock org={org} />
        <div className="s-goto"><Icon name="search" size={14} /><span>{goTo}</span><kbd>Ctrl K</kbd></div>
        {nav.map((group, gi) => (
          <div key={gi}>
            {group.label && <div className="s-navgroup">{group.label}</div>}
            {group.items.map((item) => (
              <div key={item.label} className="s-navitem" data-active={item.active || undefined}>
                <span>{item.label}</span>
                {item.badge && <span className="s-count">{item.badge}</span>}
              </div>
            ))}
          </div>
        ))}
      </aside>
      <div className="s-main">
        <div className="s-top">
          <div className="s-search"><Icon name="search" size={14} /><span>{search}</span></div>
          <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 8, color: 'var(--s-muted)' }}><Icon name="bell" /><Icon name="help" /></span>
        </div>
        <div className="s-body">
          <div className="s-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div><div className="s-title">{title}</div>{subtitle && <p className="s-sub">{subtitle}</p>}</div>
            {actions && <div className="s-row" style={{ gap: 8 }}>{actions}</div>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/** The phone app: organisation header, body, bottom tabs. No fake status bar. */
export function PhoneFrame({ org, tabs, children }: { org: Org; tabs: Tab[]; children: ReactNode }) {
  return (
    <>
      <div className="s-phone-head">
        <span style={{ width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--s-muted)' }}><Icon name="menu" /></span>
        <OrgBlock org={org} />
        <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 12, color: 'var(--s-muted)', paddingInlineEnd: 8 }}><Icon name="bell" /><Icon name="help" /></span>
      </div>
      <div className="s-phone-body">{children}</div>
      <div className="s-tabs">
        {tabs.map((tab) => (
          <div key={tab.label} className="s-tab" data-active={tab.active || undefined}><Icon name={tab.icon} size={22} strokeWidth={tab.active ? 2 : 1.7} />{tab.label}</div>
        ))}
      </div>
    </>
  );
}

/** The till: full screen, no sidebar. */
export function TillFrame({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', width: '100%', height: '100%' }}>{children}</div>;
}
