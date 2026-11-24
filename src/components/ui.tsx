import type { ReactNode } from 'react';
import { pct } from '../lib/format';
import { Sparkline } from './charts';

export function Panel({
  title,
  desc,
  span = 6,
  tone,
  table,
  children,
}: {
  title: string;
  desc?: ReactNode;
  span?: 3 | 4 | 5 | 6 | 7 | 8 | 12;
  tone?: 'highlight';
  table?: { columns: string[]; rows: (string | number)[][] };
  children: ReactNode;
}) {
  return (
    <section className={`panel span-${span}${tone ? ` panel--${tone}` : ''}`}>
      <header className="panel-head">
        <h3>{title}</h3>
        {desc && <p>{desc}</p>}
      </header>
      {children}
      {table && (
        <details className="panel-data">
          <summary>Ver datos</summary>
          <DataTable columns={table.columns.map((c, i) => ({ label: c, numeric: i > 0 }))} rows={table.rows} />
        </details>
      )}
    </section>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: { label: string; numeric?: boolean }[];
  rows: ReactNode[][];
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.label} className={c.numeric ? 'num' : undefined} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={columns[j]?.numeric ? 'num' : undefined}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Variación vs período anterior. kind 'pp' = puntos porcentuales (para tasas). */
export function Delta({
  cur,
  prev,
  goodWhenUp = true,
  kind = 'pct',
}: {
  cur: number;
  prev: number;
  goodWhenUp?: boolean;
  kind?: 'pct' | 'pp';
}) {
  if (!prev) return null;
  const change = kind === 'pp' ? cur - prev : (cur - prev) / prev;
  const flat = Math.abs(change) < (kind === 'pp' ? 0.0005 : 0.005);
  const up = change > 0;
  const good = flat ? null : up === goodWhenUp;
  const text =
    kind === 'pp'
      ? `${(Math.abs(change) * 100).toLocaleString('es-AR', { maximumFractionDigits: 1 })} pts`
      : pct(Math.abs(change));
  return (
    <span className={`delta${good === null ? '' : good ? ' delta--good' : ' delta--bad'}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        {flat ? <rect x="1" y="4" width="8" height="2" rx="1" /> : up ? <path d="M5 1 9 8H1Z" /> : <path d="M5 9 1 2h8Z" />}
      </svg>
      <span className="sr-only">{flat ? 'Sin cambios' : up ? 'Subió' : 'Bajó'}</span>
      {flat ? 'Igual' : text}
    </span>
  );
}

export function StatTile({
  label,
  value,
  cur,
  prev,
  spark,
  goodWhenUp,
  kind,
  vs,
}: {
  label: string;
  value: string;
  cur: number;
  prev: number;
  spark?: number[];
  goodWhenUp?: boolean;
  kind?: 'pct' | 'pp';
  vs: string;
}) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-main">
        <span className="stat-value">{value}</span>
        {spark && <Sparkline values={spark} />}
      </span>
      <span className="stat-foot">
        <Delta cur={cur} prev={prev} goodWhenUp={goodWhenUp} kind={kind} /> <span className="muted">{vs}</span>
      </span>
    </div>
  );
}

type Status = 'good' | 'warning' | 'serious' | 'critical';

const ICONS: Record<Status, ReactNode> = {
  good: <path d="M3.5 8.2 6.6 11 12.5 5" />,
  warning: <path d="M8 4.5v4M8 11.2v.1" />,
  serious: <path d="M8 4.5v4M8 11.2v.1" />,
  critical: <path d="m5 5 6 6M11 5l-6 6" />,
};

export function StatusIcon({ status }: { status: Status }) {
  return (
    <svg className={`status-icon status-icon--${status}`} width="20" height="20" viewBox="0 0 16 16" aria-hidden="true">
      {status === 'warning' || status === 'serious' ? <path d="M8 1.5 15 14H1Z" className="status-shape" /> : <circle cx="8" cy="8" r="7" className="status-shape" />}
      <g className="status-glyph">{ICONS[status]}</g>
    </svg>
  );
}

export function StatusList({
  items,
  format,
}: {
  items: { status: Status; label: string; value: number }[];
  format: (v: number) => string;
}) {
  return (
    <ul className="status-list">
      {items.map((i) => (
        <li key={i.label}>
          <StatusIcon status={i.status} />
          <span className="status-label">{i.label}</span>
          <span className="status-value">{format(i.value)}</span>
        </li>
      ))}
    </ul>
  );
}
