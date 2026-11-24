import { useMemo } from 'react';
import { BarList, Funnel, Heatmap, SegmentedBar, TimeSeries } from '../components/charts';
import { DataTable, Panel, StatTile, StatusList } from '../components/ui';
import { dayLabel, num, numCompact, pct } from '../lib/format';
import { profesional, type Period } from '../lib/mock';

export function Profesional({ period, vs, onUpgrade }: { period: Period; vs: string; onUpgrade: () => void }) {
  const d = useMemo(() => profesional(period), [period]);
  const k = d.kpis;
  const maxConsultas = Math.max(...d.productos.map((p) => p.consultas));

  return (
    <>
      <section className="hero">
        <p className="hero-period">Últimos {period} días</p>
        <h1>
          <strong>{num(d.visitantes)}</strong> personas visitaron tu web y <strong>{num(k.whatsapp.cur)}</strong> te
          escribieron por WhatsApp.
        </h1>
        <p className="hero-sub">
          De cada 100 visitas, {Math.round(k.tasa.cur * 100)} terminan en una consulta. El producto que más consultas genera
          es <em>{d.productos[0].label}</em>.
        </p>
      </section>

      <section className="stats" aria-label="Indicadores principales">
        <StatTile label="Visitas" value={num(k.visitas.cur)} {...k.visitas} vs={vs} />
        <StatTile label="Consultas por WhatsApp" value={num(k.whatsapp.cur)} {...k.whatsapp} vs={vs} />
        <StatTile label="Tasa de consulta" value={pct(k.tasa.cur)} {...k.tasa} kind="pp" vs={vs} />
        <StatTile label="Llamadas" value={num(k.llamadas.cur)} {...k.llamadas} vs={vs} />
        <StatTile label="Formularios" value={num(k.formularios.cur)} {...k.formularios} vs={vs} />
      </section>

      <div className="grid">
        <Panel
          title="Visitas por día"
          span={6}
          table={{ columns: ['Día', 'Visitas'], rows: d.visitasSerie.map((p) => [dayLabel(p.t), num(p.v)]) }}
        >
          <TimeSeries data={d.visitasSerie} compare={d.visitasPrev} format={(v) => `${num(v)} visitas`} axisFormat={numCompact} />
        </Panel>
        <Panel
          title="Consultas por día"
          desc="WhatsApp, llamadas y formularios"
          span={6}
          table={{ columns: ['Día', 'Consultas'], rows: d.consultasSerie.map((p) => [dayLabel(p.t), num(p.v)]) }}
        >
          <TimeSeries data={d.consultasSerie} compare={d.consultasPrev} format={(v) => `${num(v)} consultas`} axisFormat={num} />
        </Panel>

        <Panel title="De la visita a la consulta" desc="Cuántas personas avanzan en cada paso" span={7}>
          <Funnel steps={d.embudo} format={num} />
          <h4 className="sub-head">Cómo te contactaron</h4>
          <SegmentedBar parts={d.contactoPor} format={num} />
        </Panel>

        <Panel title="De dónde llegan" span={5}>
          <SegmentedBar parts={d.origen} format={(v) => `${num(v)} visitas`} />
          <h4 className="sub-head">Desde qué dispositivo</h4>
          <SegmentedBar parts={d.dispositivos} format={(v) => `${num(v)} visitas`} />
        </Panel>

        <Panel title="Productos más consultados" desc="Vistas del producto y clics a WhatsApp desde su ficha" span={8}>
          <DataTable
            columns={[{ label: 'Producto' }, { label: 'Vistas', numeric: true }, { label: 'Consultas', numeric: true }, { label: 'Tasa', numeric: true }]}
            rows={d.productos.slice(0, 8).map((p) => [
              <span className="cell-bar">
                <span>{p.label}</span>
                <span className="bar bar--thin" style={{ width: `${(p.consultas / maxConsultas) * 100}%` }} />
              </span>,
              num(p.vistas),
              num(p.consultas),
              pct(p.tasa),
            ])}
          />
        </Panel>

        <Panel title="Productos que casi nadie mira" desc="Conviene mejorar su foto, título o precio, o destacarlos en la portada" span={4}>
          <BarList items={d.sinInteres.map((p) => ({ label: p.label, value: p.vistas }))} format={num} hint={(i) => `${num(i.value)} vistas en el período`} />
        </Panel>

        <Panel
          title="Lo que más buscan en tu web"
          span={6}
          table={{ columns: ['Búsqueda', 'Veces'], rows: d.busquedas.map((b) => [b.label, b.value]) }}
        >
          <BarList items={d.busquedas} format={num} hint={(i) => `Buscaron “${i.label}” ${num(i.value)} veces`} />
        </Panel>

        <Panel
          title="Lo que buscan y no encuentran"
          desc="Búsquedas sin resultados: demanda que hoy se va a otro lado"
          span={6}
          tone="highlight"
          table={{ columns: ['Búsqueda', 'Veces'], rows: d.sinResultados.map((b) => [b.label, b.value]) }}
        >
          <BarList items={d.sinResultados} format={num} hint={(i) => `${num(i.value)} personas buscaron “${i.label}” sin encontrarlo`} />
        </Panel>

        <Panel title="Cuándo te consultan" desc="Consultas por día de la semana y hora. Útil para saber cuándo responder rápido." span={8}>
          <Heatmap matrix={d.horario} unit="consultas" />
        </Panel>

        <Panel
          title="Desde dónde te visitan"
          span={4}
          table={{ columns: ['Ubicación', 'Visitas'], rows: d.ubicacion.map((u) => [u.label, u.value]) }}
        >
          <BarList items={d.ubicacion} format={num} />
        </Panel>

        <Panel title="Estado del catálogo" desc="Productos con datos incompletos venden menos" span={12}>
          <StatusList items={d.catalogo} format={num} />
        </Panel>
      </div>

      <aside className="upsell">
        <div>
          <h2>Estas {num(k.whatsapp.cur)} consultas podrían ser ventas cobradas online.</h2>
          <p>Con el Plan Tienda tus clientes compran y pagan desde la web, sin esperar respuesta por WhatsApp.</p>
        </div>
        <button type="button" onClick={onUpgrade}>
          Ver cómo se ve el Plan Tienda
        </button>
      </aside>
    </>
  );
}
