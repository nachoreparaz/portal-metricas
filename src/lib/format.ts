const nf = new Intl.NumberFormat('es-AR');

export const num = (v: number) => nf.format(Math.round(v));

export const money = (v: number) => `$ ${nf.format(Math.round(v))}`;

export const moneyCompact = (v: number) => {
  if (v >= 1e6) return `$ ${(v / 1e6).toLocaleString('es-AR', { maximumFractionDigits: 1 })} M`;
  if (v >= 1e3) return `$ ${Math.round(v / 1e3)} mil`;
  return money(v);
};

export const numCompact = (v: number) =>
  v >= 1e3 ? `${(v / 1e3).toLocaleString('es-AR', { maximumFractionDigits: 1 })} mil` : num(v);

export const pct = (v: number, digits = 1) =>
  `${(v * 100).toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;

export const duration = (seconds: number) => {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
};

export const dayLabel = (t: number) => new Date(t).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

export const dayLong = (t: number) =>
  new Date(t).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
