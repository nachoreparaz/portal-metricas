/** PRNG con semilla (mulberry32): mismos datos en cada recarga, ideal para presentar. */
export function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rand = ReturnType<typeof rng>;

/** Factor aleatorio en [1 - amount, 1 + amount]. */
export const jitter = (r: Rand, amount: number) => 1 + (r() - 0.5) * 2 * amount;

export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Reparte un total según pesos, con un poco de ruido. */
export function distribute<T extends { w: number }>(total: number, items: T[], r: Rand, noise = 0.12) {
  const weights = items.map((i) => i.w * jitter(r, noise));
  const totalW = sum(weights);
  return items.map((item, i) => ({ ...item, value: Math.round((total * weights[i]) / totalW) }));
}
