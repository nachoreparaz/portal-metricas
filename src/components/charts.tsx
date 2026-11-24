import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { dayLabel, dayLong, pct } from '../lib/format';
import type { Point } from '../lib/mock';

/* ───────────── infraestructura ───────────── */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

interface Tip {
  x: number;
  y: number;
  content: ReactNode;
}

function useTip<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [tip, setTip] = useState<Tip | null>(null);
  const show = (e: MouseEvent, content: ReactNode) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    setTip({ x: e.clientX - box.left, y: e.clientY - box.top, content });
  };
  return { ref, tip, show, hide: () => setTip(null) };
}

function Tooltip({ tip, width }: { tip: Tip | null; width?: number }) {
  if (!tip) return null;
  const left = width ? Math.min(Math.max(tip.x, 90), width - 90) : tip.x;
  return (
    <div className="tooltip" style={{ left, top: tip.y }} role="status">
      {tip.content}
    </div>
  );
}

const SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--s6)', 'var(--s7)', 'var(--s8)'];
/** Texto sobre relleno: negro sobre amarillo (slot 4), blanco en el resto. */
const INK_ON = ['#fff', '#fff', '#fff', 'var(--on-s4)', '#fff', '#fff', '#fff', '#fff'];

function niceTicks(max: number, count = 4) {
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / pow;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
  const top = Math.max(step, Math.ceil(max / step) * step);
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) };
}

/* ───────────── serie temporal ───────────── */

export function TimeSeries({
  data,
  compare,
  format,
  axisFormat = format,
  area = false,
  height = 220,
}: {
  data: Point[];
  compare?: number[];
  format: (v: number) => string;
  axisFormat?: (v: number) => string;
  area?: boolean;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const M = { l: 56, r: 14, t: 10, b: 28 };
  const iw = Math.max(0, width - M.l - M.r);
  const ih = height - M.t - M.b;
  const n = data.length;
  const { top, ticks } = niceTicks(Math.max(1, ...data.map((d) => d.v), ...(compare ?? [])));
  const x = (i: number) => M.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
  const y = (v: number) => M.t + ih - (v / top) * ih;
  const path = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const values = data.map((d) => d.v);
  const xTicks = Array.from({ length: 5 }, (_, k) => Math.round((k * (n - 1)) / 4));

  const onMove = (e: MouseEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - box.left) / box.width) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  return (
    <div className="chart" ref={ref}>
      {compare && (
        <ul className="legend legend--inline" aria-label="Series">
          <li><span className="key key--line" style={{ background: 'var(--s1)' }} />Este período</li>
          <li><span className="key key--line" style={{ background: 'var(--ghost)' }} />Período anterior</li>
        </ul>
      )}
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Gráfico de evolución diaria">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} className={t === 0 ? 'axisline' : 'gridline'} />
              <text x={M.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tick">
                {axisFormat(t)}
              </text>
            </g>
          ))}
          {xTicks.map((i) => (
            <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="tick">
              {dayLabel(data[i].t)}
            </text>
          ))}
          {compare && <path d={path(compare)} className="line line--ghost" />}
          {area && <path d={`${path(values)}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z`} className="area" />}
          <path d={path(values)} className="line" />
          {hover === null && <circle cx={x(n - 1)} cy={y(values[n - 1])} r={4} className="dot" />}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={M.t + ih} className="crosshair" />
              {compare && <circle cx={x(hover)} cy={y(compare[hover])} r={4} className="dot dot--ghost" />}
              <circle cx={x(hover)} cy={y(values[hover])} r={4} className="dot" />
            </g>
          )}
          <rect
            x={M.l}
            y={M.t}
            width={iw}
            height={ih}
            fill="transparent"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}
      {hover !== null && (
        <div
          className="tooltip"
          style={{ left: Math.min(Math.max(x(hover), 100), width - 100), top: y(values[hover]) }}
          role="status"
        >
          <strong>{dayLong(data[hover].t)}</strong>
          <span className="tip-row">
            <span className="key key--line" style={{ background: 'var(--s1)' }} />
            {format(values[hover])}
          </span>
          {compare && (
            <span className="tip-row tip-row--muted">
              <span className="key key--line" style={{ background: 'var(--ghost)' }} />
              {format(compare[hover])} período anterior
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────── barras horizontales ───────────── */

export function BarList({
  items,
  format,
  hint,
}: {
  items: { label: string; value: number }[];
  format: (v: number) => string;
  hint?: (item: { label: string; value: number }, share: number) => string;
}) {
  const { ref, tip, show, hide } = useTip<HTMLDivElement>();
  const [boxRef, width] = useWidth<HTMLDivElement>();
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  return (
    <div ref={boxRef}>
      <div className="barlist" ref={ref} onMouseLeave={hide}>
        {items.map((item) => (
          <div
            className="barlist-row"
            key={item.label}
            onMouseMove={(e) =>
              show(
                e,
                <>
                  <strong>{item.label}</strong>
                  <span>{hint ? hint(item, item.value / total) : `${format(item.value)} · ${pct(item.value / total)} del total`}</span>
                </>,
              )
            }
          >
            <span className="barlist-label">{item.label}</span>
            <span className="barlist-track">
              <span className="bar" style={{ width: `${(item.value / max) * 100}%` }} />
              <span className="barlist-value">{format(item.value)}</span>
            </span>
          </div>
        ))}
        <Tooltip tip={tip} width={width} />
      </div>
    </div>
  );
}

/* ───────────── embudo ───────────── */

/** Rampa ordinal (variables de tema): el énfasis crece paso a paso en ambos modos. */
const ORDINAL: Record<number, string[]> = {
  3: ['var(--ord-1)', 'var(--ord-3)', 'var(--ord-5)'],
  5: ['var(--ord-1)', 'var(--ord-2)', 'var(--ord-3)', 'var(--ord-4)', 'var(--ord-5)'],
};

export function Funnel({ steps, format }: { steps: { label: string; value: number }[]; format: (v: number) => string }) {
  const { ref, tip, show, hide } = useTip<HTMLOListElement>();
  const [boxRef, width] = useWidth<HTMLDivElement>();
  const first = steps[0]?.value || 1;
  const colors = ORDINAL[steps.length] ?? ORDINAL[5];
  return (
    <div ref={boxRef}>
      <ol className="funnel" ref={ref} onMouseLeave={hide}>
        {steps.map((s, i) => {
          const prev = steps[i - 1]?.value;
          const kept = prev ? s.value / prev : 1;
          return (
            <li
              key={s.label}
              onMouseMove={(e) =>
                show(
                  e,
                  <>
                    <strong>{s.label}</strong>
                    <span>{format(s.value)} personas · {pct(s.value / first)} de las visitas</span>
                    {prev !== undefined && <span>Siguió el {pct(kept)} del paso anterior</span>}
                  </>,
                )
              }
            >
              {prev !== undefined && <span className="funnel-drop">{pct(1 - kept, 0)} no siguió</span>}
              <div className="funnel-head">
                <span>{s.label}</span>
                <span className="funnel-value">
                  {format(s.value)} <span className="muted">{pct(s.value / first)}</span>
                </span>
              </div>
              <span className="funnel-track">
                <span className="bar bar--tall" style={{ width: `${Math.max(0.6, (s.value / first) * 100)}%`, background: colors[i] }} />
              </span>
            </li>
          );
        })}
        <Tooltip tip={tip} width={width} />
      </ol>
    </div>
  );
}

/* ───────────── barra segmentada (partes de un todo) ───────────── */

export function SegmentedBar({
  parts,
  format,
  colors = SERIES,
}: {
  parts: { label: string; value: number }[];
  format: (v: number) => string;
  colors?: string[];
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { ref: tipRef, tip, show, hide } = useTip<HTMLDivElement>();
  const total = parts.reduce((a, b) => a + b.value, 0) || 1;
  const usable = Math.max(0, width - (parts.length - 1) * 2);
  return (
    <div ref={ref} className="segmented">
      <div
        ref={tipRef}
        className="segmented-bar"
        role="img"
        aria-label={parts.map((p) => `${p.label} ${pct(p.value / total, 0)}`).join(', ')}
        onMouseLeave={hide}
      >
        {parts.map((p, i) =>
          p.value > 0 ? (
            <span
              key={p.label}
              className="segment"
              style={{ flexGrow: p.value, background: colors[i], color: colors === SERIES ? INK_ON[i] : '#fff' }}
              onMouseMove={(e) =>
                show(
                  e,
                  <>
                    <strong>{p.label}</strong>
                    <span>{format(p.value)} · {pct(p.value / total)}</span>
                  </>,
                )
              }
            >
              {(p.value / total) * usable >= 44 ? pct(p.value / total, 0) : ''}
            </span>
          ) : null,
        )}
        <Tooltip tip={tip} width={width} />
      </div>
      <ul className="legend">
        {parts.map((p, i) => (
          <li key={p.label}>
            <span className="key" style={{ background: colors[i] }} />
            <span className="legend-label">{p.label}</span>
            <span className="legend-value">{format(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────── mapa de calor día × hora ───────────── */

const SEQ = Array.from({ length: 7 }, (_, i) => `var(--seq-${i + 1})`);
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DIAS_LARGO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function Heatmap({ matrix, unit }: { matrix: number[][]; unit: string }) {
  const { ref, tip, show, hide } = useTip<HTMLDivElement>();
  const [boxRef, width] = useWidth<HTMLDivElement>();
  const max = Math.max(1, ...matrix.flat());
  const step = (v: number) => (v === 0 ? 'var(--cell-empty)' : SEQ[Math.min(SEQ.length - 1, Math.floor((v / max) * SEQ.length))]);
  return (
    <div ref={boxRef}>
      <div className="heatmap" ref={ref} onMouseLeave={hide} role="img" aria-label={`Mapa de calor de ${unit} por día y hora`}>
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className="heatmap-hour">{h % 3 === 0 ? `${h} h` : ''}</span>
        ))}
        {matrix.map((row, d) => (
          <div className="heatmap-row" key={DIAS[d]}>
            <span className="heatmap-day">{DIAS[d]}</span>
            {row.map((v, h) => (
              <span
                key={h}
                className="cell"
                style={{ background: step(v) }}
                onMouseMove={(e) =>
                  show(
                    e,
                    <>
                      <strong>{DIAS_LARGO[d]} de {h} a {h + 1} h</strong>
                      <span>{v} {unit}</span>
                    </>,
                  )
                }
              />
            ))}
          </div>
        ))}
        <Tooltip tip={tip} width={width} />
      </div>
      <div className="scale" aria-hidden="true">
        <span>Menos</span>
        {SEQ.map((c) => <span key={c} className="scale-step" style={{ background: c }} />)}
        <span>Más</span>
      </div>
    </div>
  );
}

/* ───────────── sparkline ───────────── */

export function Sparkline({ values }: { values: number[] }) {
  const w = 96;
  const h = 28;
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i * (w - 8)) / (values.length - 1) + 4, h - 4 - ((v - min) / span) * (h - 8)]);
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} className="spark" aria-hidden="true">
      <polyline points={pts.map((p) => p.join(',')).join(' ')} />
      <circle cx={last[0]} cy={last[1]} r={3.5} />
    </svg>
  );
}
