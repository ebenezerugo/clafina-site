import type { ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName, Tone } from './types';

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="s-card">
      {(title || actions) && (
        <div className="s-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          {title && <span className="s-card-title">{title}</span>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function Pill({ tone = 'neutral', icon, children }: { tone?: Tone; icon?: IconName; children: ReactNode }) {
  return <span className="s-pill" data-tone={tone}>{icon && <Icon name={icon} size={12} strokeWidth={2.2} />}{children}</span>;
}

export function KitButton({ variant = 'secondary', icon, children }: { variant?: 'primary' | 'secondary'; icon?: IconName; children: ReactNode }) {
  return <span className="s-btn" data-variant={variant}>{icon && <Icon name={icon} />}{children}</span>;
}

export function StatCard({ icon, label, value, change, note }: { icon: IconName; label: string; value: string; change?: { tone: Tone; text: string; dir?: 'up' | 'down' }; note?: string }) {
  return (
    <div className="s-card">
      <div className="s-stat-head"><span className="s-icon-box"><Icon name={icon} /></span>{label}</div>
      <div className="s-stat-row">
        <span className="s-stat-value">{value}</span>
        {change && <Pill tone={change.tone} icon={change.dir}>{change.text}</Pill>}
      </div>
      {note && <p className="s-sub">{note}</p>}
    </div>
  );
}

export function AttentionRow({ tone, icon, title, body, action }: { tone: Exclude<Tone, 'neutral'>; icon: IconName; title: string; body: string; action?: string }) {
  return (
    <div className="s-attn">
      <span className="s-attn-icon" data-tone={tone}><Icon name={icon} /></span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 0 }}>
        <div><div className="s-attn-title">{title}</div><p className="s-sub">{body}</p></div>
        {action && <div><KitButton>{action}</KitButton></div>}
      </div>
    </div>
  );
}

export interface Column { key: string; label: string; numeric?: boolean }

export function DataTable({ columns, rows }: { columns: Column[]; rows: Record<string, ReactNode>[] }) {
  return (
    <table className="s-table">
      <thead><tr>{columns.map((c) => <th key={c.key} data-num={c.numeric || undefined}>{c.label}</th>)}</tr></thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>{columns.map((c) => <td key={c.key} data-num={c.numeric || undefined}>{row[c.key]}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

export function Progress({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return <div className="s-progress"><div style={{ width: `${v}%` }} /></div>;
}

export function Avatar({ initials }: { initials: string }) {
  return <span className="s-avatar">{initials}</span>;
}
