import { useEffect, useState } from 'react';
import type { Period } from './lib/mock';
import { Profesional } from './portals/Profesional';
import { Tienda } from './portals/Tienda';

type Plan = 'profesional' | 'tienda';

const NEGOCIO: Record<Plan, { nombre: string; rubro: string; plan: string }> = {
  profesional: { nombre: 'Repuestera Villa Crespo', rubro: 'Autopartes', plan: 'Plan Profesional' },
  tienda: { nombre: 'MotoBox Chacarita', rubro: 'Repuestos y accesorios de moto', plan: 'Plan Tienda' },
};

const PERIODS: Period[] = [7, 30, 90];

const planFromHash = (): Plan => (location.hash.includes('tienda') ? 'tienda' : 'profesional');

type Theme = 'light' | 'dark';
const systemTheme = (): Theme => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

/** Tema elegido por el usuario (guardado) o, si nunca eligió, el del sistema. */
function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme | null) ?? systemTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (!localStorage.getItem('theme')) setTheme(systemTheme());
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = () =>
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });

  return [theme, toggle] as const;
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        {dark ? (
          <>
            <circle cx="9" cy="9" r="3.5" />
            <path d="M9 1.5v1.8M9 14.7v1.8M1.5 9h1.8M14.7 9h1.8M3.7 3.7l1.3 1.3M13 13l1.3 1.3M3.7 14.3 5 13M13 5l1.3-1.3" />
          </>
        ) : (
          <path d="M15 11.2A6.5 6.5 0 0 1 6.8 3a6.5 6.5 0 1 0 8.2 8.2Z" />
        )}
      </svg>
    </button>
  );
}

export function App() {
  const [plan, setPlan] = useState<Plan>(planFromHash);
  const [period, setPeriod] = useState<Period>(30);
  const [theme, toggleTheme] = useTheme();

  useEffect(() => {
    const onHash = () => setPlan(planFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.title = `Métricas · ${NEGOCIO[plan].nombre}`;
  }, [plan]);

  const go = (p: Plan) => {
    location.hash = `/${p}`;
    window.scrollTo({ top: 0 });
  };

  const n = NEGOCIO[plan];
  const vs = `vs los ${period} días previos`;

  return (
    <div className={`app app--${plan}`}>
      <div className="demo-bar">
        <span>Demostración con datos de ejemplo</span>
        <nav aria-label="Elegir plan">
          {(['profesional', 'tienda'] as Plan[]).map((p) => (
            <button key={p} type="button" aria-pressed={plan === p} onClick={() => go(p)}>
              {NEGOCIO[p].plan}
            </button>
          ))}
        </nav>
      </div>

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            {n.nombre
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0])
              .join('')}
          </span>
          <div>
            <p className="brand-name">{n.nombre}</p>
            <p className="brand-meta">
              {n.rubro} <span className="plan-tag">{n.plan}</span>
            </p>
          </div>
        </div>
        <div className="topbar-actions">
        <div className="period" role="radiogroup" aria-label="Período">
          {PERIODS.map((p) => (
            <button key={p} type="button" role="radio" aria-checked={period === p} onClick={() => setPeriod(p)}>
              {p} días
            </button>
          ))}
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main className="page" key={plan}>
        {plan === 'profesional' ? (
          <Profesional period={period} vs={vs} onUpgrade={() => go('tienda')} />
        ) : (
          <Tienda period={period} vs={vs} />
        )}
      </main>

      <footer className="footer">Las métricas se actualizan cada 15 minutos. Los datos de tus visitantes son anónimos.</footer>
    </div>
  );
}
