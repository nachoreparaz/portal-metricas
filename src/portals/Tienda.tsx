import { useMemo } from 'react';
import { BarList, Funnel, SegmentedBar, TimeSeries } from '../components/charts';
import { DataTable, Panel, StatTile, StatusList } from '../components/ui';
import { dayLabel, money, moneyCompact, num, pct } from '../lib/format';
import { tienda, type Period } from '../lib/mock';

const NETO_COLORS = ['var(--s1)', 'var(--s2)', 'var(--s7)'];

export function Tienda({ period, vs }: { period: Period; vs: string }) {
  const d = useMemo(() => tienda(period), [period]);
  const k = d.kpis;
  const maxFact = Math.max(...d.productos.map((p) => p.facturacion));
  const totalPagos = d.pagos.reduce((a, b) => a + b.value, 0);

  return (
    <>
      <section className="hero">
        <p className="hero-period">Últimos {period} días</p>
        <h1>
          Vendiste <strong>{money(k.facturacion.cur)}</strong> en <strong>{num(k.ordenes.cur)}</strong> compras.
        </h1>
        <p className="hero-sub">
          Cada cliente gastó en promedio {money(k.ticket.cur)}. Quedaron {num(d.carritos.cantidad)} carritos sin pagar, por
          unos {moneyCompact(d.carritos.monto)}.
        </p>
      </section>

      <section className="stats" aria-label="Indicadores principales">
        <StatTile label="Facturación" value={moneyCompact(k.facturacion.cur)} {...k.facturacion} vs={vs} />
        <StatTile label="Compras" value={num(k.ordenes.cur)} {...k.ordenes} vs={vs} />
        <StatTile label="Ticket promedio" value={money(k.ticket.cur)} {...k.ticket} vs={vs} />
        <StatTile label="Conversión" value={pct(k.conversion.cur, 2)} {...k.conversion} kind="pp" vs={vs} />
        <StatTile label="Carritos sin pagar" value={moneyCompact(k.abandonados.cur)} {...k.abandonados} goodWhenUp={false} vs={vs} />
      </section>

      <div className="grid">
        <Panel
          title="Facturación por día"
          span={8}
          table={{ columns: ['Día', 'Facturación'], rows: d.factSerie.map((p) => [dayLabel(p.t), money(p.v)]) }}
        >
          <TimeSeries data={d.factSerie} compare={d.factPrev} format={money} axisFormat={moneyCompact} area height={240} />
        </Panel>

        <Panel title="Cuánto te queda" desc="Facturación menos comisiones de cobro y envíos" span={4}>
          <p className="big-figure">{moneyCompact(d.neto[0].value)}</p>
          <SegmentedBar parts={d.neto} format={moneyCompact} colors={NETO_COLORS} />
        </Panel>

        <Panel title="Del ingreso a la compra" desc="Dónde se pierden los clientes antes de pagar" span={7}>
          <Funnel steps={d.embudo} format={num} />
        </Panel>

        <Panel title="Carritos sin pagar" desc="Agregaron productos pero no completaron el pago" span={5} tone="highlight">
          <div className="pair">
            <div>
              <p className="big-figure">{num(d.carritos.cantidad)}</p>
              <p className="muted">carritos</p>
            </div>
            <div>
              <p className="big-figure">{moneyCompact(d.carritos.monto)}</p>
              <p className="muted">en ventas sin cerrar</p>
            </div>
          </div>
          <h4 className="sub-head">Productos que más quedan en el carrito</h4>
          <BarList items={d.carritos.productos} format={num} hint={(i) => `Quedó en ${num(i.value)} carritos sin pagar`} />
        </Panel>

        <Panel title="Productos más vendidos" span={8}>
          <DataTable
            columns={[{ label: 'Producto' }, { label: 'Unidades', numeric: true }, { label: 'Facturación', numeric: true }, { label: 'Conversión', numeric: true }]}
            rows={d.productos.slice(0, 8).map((p) => [
              <span className="cell-bar">
                <span>{p.label}</span>
                <span className="bar bar--thin" style={{ width: `${(p.facturacion / maxFact) * 100}%` }} />
              </span>,
              num(p.unidades),
              money(p.facturacion),
              pct(p.conv),
            ])}
          />
        </Panel>

        <Panel title="Muy vistos, poco comprados" desc="Interesan, pero algo frena la compra: precio, fotos o envío" span={4}>
          <BarList
            items={d.oportunidades.map((p) => ({ label: p.label, value: p.vistas }))}
            format={num}
            hint={(i) => {
              const p = d.oportunidades.find((o) => o.label === i.label)!;
              return `${num(p.vistas)} vistas y ${num(p.unidades)} ventas (${pct(p.conv)})`;
            }}
          />
        </Panel>

        <Panel title="Pagos" desc={`${num(totalPagos)} intentos de pago`} span={4}>
          <StatusList items={d.pagos} format={num} />
        </Panel>

        <Panel
          title="Por qué se rechazan los pagos"
          span={4}
          table={{ columns: ['Motivo', 'Pagos'], rows: d.rechazos.map((r) => [r.label, r.value]) }}
        >
          <BarList items={d.rechazos} format={num} />
        </Panel>

        <Panel title="Cómo pagan" span={4}>
          <SegmentedBar parts={d.medios} format={(v) => `${num(v)} compras`} />
          <h4 className="sub-head">En cuántas cuotas</h4>
          <BarList items={d.cuotas} format={num} />
        </Panel>

        <Panel title="Pedidos en curso" desc="Estado actual de las compras" span={6}>
          <ol className="pipeline">
            {d.estados.map((e) => (
              <li key={e.label}>
                <span className="pipeline-value">{num(e.value)}</span>
                <span className="pipeline-label">{e.label}</span>
              </li>
            ))}
          </ol>
          <h4 className="sub-head">Cómo reciben su compra</h4>
          <SegmentedBar parts={d.entrega} format={(v) => `${num(v)} compras`} />
        </Panel>

        <Panel
          title="A dónde enviás"
          span={6}
          table={{ columns: ['Zona', 'Envíos'], rows: d.zonas.map((z) => [z.label, z.value]) }}
        >
          <BarList items={d.zonas} format={num} hint={(i, s) => `${num(i.value)} envíos · ${pct(s)}`} />
        </Panel>

        <Panel title="Tus clientes" span={6}>
          <SegmentedBar parts={d.clientes} format={(v) => `${num(v)} compras`} />
          <h4 className="sub-head">Los que más compraron</h4>
          <DataTable
            columns={[{ label: 'Cliente' }, { label: 'Compras', numeric: true }, { label: 'Total', numeric: true }]}
            rows={d.topClientes.slice(0, 5).map((c) => [c.nombre, num(c.compras), money(c.total)])}
          />
        </Panel>

        <Panel
          title="Qué canal trae más ventas"
          desc="Facturación según de dónde llegó el cliente"
          span={6}
          table={{ columns: ['Canal', 'Facturación'], rows: d.ventasPorOrigen.map((o) => [o.label, money(o.value)]) }}
        >
          <BarList items={d.ventasPorOrigen} format={moneyCompact} hint={(i, s) => `${money(i.value)} · ${pct(s)} de la facturación`} />
        </Panel>

        <Panel title="Cupones de descuento" span={6}>
          <DataTable
            columns={[{ label: 'Cupón' }, { label: 'Usos', numeric: true }, { label: 'Ventas', numeric: true }, { label: 'Descuento dado', numeric: true }]}
            rows={d.cupones.map((c) => [<code>{c.codigo}</code>, num(c.usos), money(c.facturacion), money(c.descuento)])}
          />
        </Panel>

        <Panel
          title="Lo que buscan y no encuentran"
          desc="Productos que podrías sumar al catálogo"
          span={6}
          tone="highlight"
          table={{ columns: ['Búsqueda', 'Veces'], rows: d.sinResultados.map((b) => [b.label, b.value]) }}
        >
          <BarList items={d.sinResultados} format={num} hint={(i) => `${num(i.value)} personas buscaron “${i.label}” sin encontrarlo`} />
        </Panel>
      </div>
    </>
  );
}
