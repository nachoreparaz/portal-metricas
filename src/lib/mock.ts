import { distribute, jitter, rng, sum, type Rand } from './random';

export type Period = 7 | 30 | 90;

export interface Point {
  t: number;
  v: number;
}

export interface Metric {
  cur: number;
  prev: number;
  spark: number[];
}

const HISTORY = 180;
const DAY_MS = 86_400_000;
/** Peso por día de semana (domingo..sábado): comercio de barrio, fuerte de lunes a viernes. */
const WEEKDAY = [0.42, 1.06, 1.1, 1.08, 1.04, 0.98, 0.7];

function timeline(): number[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: HISTORY }, (_, i) => today.getTime() - (HISTORY - 1 - i) * DAY_MS);
}

/** Serie diaria con estacionalidad semanal, tendencia de crecimiento y ruido. */
function daily(r: Rand, days: number[], base: number, growth: number, noise = 0.18) {
  return days.map((t, i) => base * (1 + (growth * i) / HISTORY) * WEEKDAY[new Date(t).getDay()] * jitter(r, noise));
}

/** Serie derivada: cada valor es una tasa de la serie base (con ruido), redondeado. */
const rate = (r: Rand, base: number[], ratio: number, noise = 0.3) =>
  base.map((v) => Math.max(0, Math.round(v * ratio * jitter(r, noise))));

function metric(values: number[], period: Period): Metric {
  const cur = values.slice(-period);
  const prev = values.slice(-2 * period, -period);
  const bucket = Math.max(1, Math.round(period / 12));
  const spark: number[] = [];
  for (let i = 0; i < cur.length; i += bucket) spark.push(sum(cur.slice(i, i + bucket)));
  return { cur: sum(cur), prev: sum(prev), spark };
}

const points = (days: number[], values: number[], period: Period): Point[] =>
  days.slice(-period).map((t, i) => ({ t, v: values[values.length - period + i] }));

const previous = (values: number[], period: Period) => values.slice(-2 * period, -period);

/** Matriz 7×24 (día de semana × hora) de un total. */
function hourMatrix(r: Rand, total: number) {
  const hour = (h: number) =>
    h < 8 ? 0.04 : h < 10 ? 0.5 : h < 13 ? 1 : h < 15 ? 0.7 : h < 19 ? 0.95 : h < 22 ? 0.45 : 0.12;
  const order = [1, 2, 3, 4, 5, 6, 0]; // lunes primero
  const raw = order.map((wd) => Array.from({ length: 24 }, (_, h) => hour(h) * WEEKDAY[wd] * jitter(r, 0.35)));
  const totalW = sum(raw.flat());
  return raw.map((row) => row.map((v) => Math.round((v * total) / totalW)));
}

/* ───────────────────────────── Plan Profesional ───────────────────────────── */

const AUTOPARTES = [
  { label: 'Kit de distribución VW Gol 1.6', w: 10, rate: 0.16 },
  { label: 'Pastillas de freno Peugeot 208', w: 9, rate: 0.13 },
  { label: 'Amortiguador delantero Chevrolet Corsa', w: 7.5, rate: 0.11 },
  { label: 'Bomba de agua Fiat Palio 1.4', w: 6.8, rate: 0.14 },
  { label: 'Embrague completo Renault Kangoo', w: 6.2, rate: 0.18 },
  { label: 'Radiador Ford Fiesta Kinetic', w: 5.6, rate: 0.09 },
  { label: 'Filtro de aceite Toyota Hilux', w: 5.2, rate: 0.06 },
  { label: 'Disco de freno Fiat Cronos', w: 4.6, rate: 0.1 },
  { label: 'Bujías x4 Chevrolet Onix', w: 4.1, rate: 0.07 },
  { label: 'Correa poly-V Ford Ka', w: 3.4, rate: 0.08 },
  { label: 'Termostato Renault Clio', w: 0.9, rate: 0.05 },
  { label: 'Juego de juntas Fiat Uno', w: 0.7, rate: 0.04 },
  { label: 'Parrilla de suspensión Peugeot 206', w: 0.6, rate: 0.03 },
];

const BUSQUEDAS = [
  { label: 'kit distribucion gol', w: 10 },
  { label: 'pastillas freno 208', w: 8 },
  { label: 'amortiguadores', w: 6.5 },
  { label: 'bomba de agua', w: 5.5 },
  { label: 'embrague kangoo', w: 4.8 },
  { label: 'radiador', w: 3.9 },
  { label: 'filtro aceite', w: 3.1 },
];

const SIN_RESULTADOS = [
  { label: 'cremallera de direccion', w: 10 },
  { label: 'alternador fiat siena', w: 7.4 },
  { label: 'burro de arranque', w: 6.2 },
  { label: 'optica ford focus', w: 4.6 },
  { label: 'sensor de oxigeno', w: 3.3 },
];

const ORIGEN = [
  { label: 'Google', w: 46 },
  { label: 'Redes sociales', w: 24 },
  { label: 'Directo', w: 18 },
  { label: 'Campañas', w: 7 },
  { label: 'Otros sitios', w: 5 },
];

const DISPOSITIVOS = [
  { label: 'Celular', w: 74 },
  { label: 'Computadora', w: 23 },
  { label: 'Tablet', w: 3 },
];

const UBICACION = [
  { label: 'Ciudad de Buenos Aires', w: 54 },
  { label: 'Provincia de Buenos Aires', w: 33 },
  { label: 'Santa Fe', w: 4.5 },
  { label: 'Córdoba', w: 3.8 },
  { label: 'Mendoza', w: 1.6 },
  { label: 'Otras provincias', w: 3.1 },
];

export function profesional(period: Period) {
  const r = rng(7);
  const days = timeline();
  const visitas = daily(r, days, 52, 0.35).map(Math.round);
  const whatsapp = rate(r, visitas, 0.118);
  const llamadas = rate(r, visitas, 0.026, 0.6);
  const formularios = rate(r, visitas, 0.014, 0.7);
  const vistasProducto = rate(r, visitas, 1.35, 0.2);
  const contactos = visitas.map((_, i) => whatsapp[i] + llamadas[i] + formularios[i]);

  const p = rng(100 + period);
  const visitasM = metric(visitas, period);
  const whatsappM = metric(whatsapp, period);
  const contactosM = metric(contactos, period);
  const vistasM = metric(vistasProducto, period);
  const visitantes = Math.round(visitasM.cur * 0.81);
  const sesionesConProducto = Math.round(visitasM.cur * 0.58);

  const productos = distribute(vistasM.cur, AUTOPARTES, p).map((x) => {
    const consultas = Math.round(x.value * x.rate * jitter(p, 0.15));
    return { label: x.label, vistas: x.value, consultas, tasa: x.value ? consultas / x.value : 0 };
  });

  const busquedasTotal = Math.round(visitasM.cur * 0.21);

  return {
    visitantes,
    kpis: {
      visitas: visitasM,
      whatsapp: whatsappM,
      tasa: {
        cur: contactosM.cur / visitasM.cur,
        prev: contactosM.prev / visitasM.prev,
        spark: contactosM.spark.map((c, i) => c / (visitasM.spark[i] || 1)),
      },
      llamadas: metric(llamadas, period),
      formularios: metric(formularios, period),
    },
    visitasSerie: points(days, visitas, period),
    visitasPrev: previous(visitas, period),
    consultasSerie: points(days, contactos, period),
    consultasPrev: previous(contactos, period),
    embudo: [
      { label: 'Entraron a la web', value: visitasM.cur },
      { label: 'Vieron un producto', value: sesionesConProducto },
      { label: 'Te contactaron', value: contactosM.cur },
    ],
    contactoPor: [
      { label: 'WhatsApp', value: whatsappM.cur },
      { label: 'Llamada', value: metric(llamadas, period).cur },
      { label: 'Formulario', value: metric(formularios, period).cur },
    ],
    origen: distribute(visitasM.cur, ORIGEN, p),
    dispositivos: distribute(visitasM.cur, DISPOSITIVOS, p, 0.04),
    ubicacion: distribute(visitasM.cur, UBICACION, p),
    productos: productos.filter((x) => x.vistas > 0).sort((a, b) => b.consultas - a.consultas),
    sinInteres: productos.sort((a, b) => a.vistas - b.vistas).slice(0, 4),
    busquedas: distribute(busquedasTotal, BUSQUEDAS, p),
    sinResultados: distribute(Math.round(busquedasTotal * 0.24), SIN_RESULTADOS, p),
    horario: hourMatrix(p, contactosM.cur),
    catalogo: [
      { status: 'good' as const, label: 'Productos publicados y completos', value: 186 },
      { status: 'serious' as const, label: 'Productos sin foto', value: 12 },
      { status: 'warning' as const, label: 'Productos sin precio', value: 5 },
      { status: 'critical' as const, label: 'Sin actualizar hace más de 90 días', value: 34 },
    ],
  };
}

/* ─────────────────────────────── Plan Tienda ─────────────────────────────── */

const MOTOPARTES = [
  { label: 'Kit de arrastre 428 – 14/43', w: 10, precio: 46_900, conv: 0.062 },
  { label: 'Batería 12V 7Ah gel', w: 8.6, precio: 38_500, conv: 0.071 },
  { label: 'Aceite 4T 10W40 x 1 L', w: 8.2, precio: 9_800, conv: 0.11 },
  { label: 'Pastillas de freno delanteras', w: 7.4, precio: 12_400, conv: 0.083 },
  { label: 'Casco abierto talle M', w: 7.1, precio: 89_000, conv: 0.019 },
  { label: 'Cubierta 90/90-18 trasera', w: 6.3, precio: 54_200, conv: 0.041 },
  { label: 'Cadena 428H x 120 eslabones', w: 4.9, precio: 21_700, conv: 0.052 },
  { label: 'Bujía iridium', w: 4.6, precio: 15_900, conv: 0.064 },
  { label: 'Faro LED universal', w: 4.2, precio: 27_300, conv: 0.016 },
  { label: 'Guantes de cuero touch', w: 3.5, precio: 24_800, conv: 0.022 },
  { label: 'Filtro de aire Honda Wave', w: 3.1, precio: 6_900, conv: 0.09 },
];

const RECHAZOS = [
  { label: 'Fondos insuficientes', w: 41 },
  { label: 'Rechazado por el banco', w: 24 },
  { label: 'Datos de tarjeta inválidos', w: 18 },
  { label: 'Pago duplicado', w: 9 },
  { label: 'Otro motivo', w: 8 },
];

const MEDIOS = [
  { label: 'Tarjeta de crédito', w: 48 },
  { label: 'Dinero en cuenta', w: 27 },
  { label: 'Tarjeta de débito', w: 19 },
  { label: 'Efectivo', w: 6 },
];

const CUOTAS = [
  { label: '1 pago', w: 44 },
  { label: '3 cuotas', w: 31 },
  { label: '6 cuotas', w: 18 },
  { label: '12 cuotas', w: 7 },
];

const ORIGEN_VENTAS = [
  { label: 'Google', w: 39 },
  { label: 'Instagram', w: 27 },
  { label: 'Directo', w: 17 },
  { label: 'Campañas', w: 12 },
  { label: 'Otros sitios', w: 5 },
];

const ZONAS = [
  { label: 'Ciudad de Buenos Aires', w: 46 },
  { label: 'GBA Norte', w: 19 },
  { label: 'GBA Oeste', w: 17 },
  { label: 'GBA Sur', w: 11 },
  { label: 'Interior del país', w: 7 },
];

const CLIENTES = ['Martín G.', 'Lucía F.', 'Diego R.', 'Sofía M.', 'Nicolás P.', 'Carla V.'];

const CUPONES = [
  { label: 'BIENVENIDA10', w: 10, descuento: 0.1 },
  { label: 'ENVIOGRATIS', w: 7, descuento: 0.06 },
  { label: 'CYBERMOTO', w: 4.2, descuento: 0.15 },
];

export function tienda(period: Period) {
  const r = rng(21);
  const days = timeline();
  const visitas = daily(r, days, 138, 0.4).map(Math.round);
  const ordenes = rate(r, visitas, 0.0172, 0.45);
  const ticket = days.map(() => 37_800 * jitter(r, 0.22));
  const facturacion = ordenes.map((o, i) => Math.round(o * ticket[i]));
  const carritos = rate(r, visitas, 0.092, 0.25);
  const checkouts = rate(r, visitas, 0.041, 0.3);

  const p = rng(300 + period);
  const visitasM = metric(visitas, period);
  const ordenesM = metric(ordenes, period);
  const factM = metric(facturacion, period);
  const carritosM = metric(carritos, period);
  const checkoutM = metric(checkouts, period);
  const vistasProducto = Math.round(visitasM.cur * 0.63);

  const abandonados = Math.max(0, carritosM.cur - ordenesM.cur);
  const abandonadosPrev = Math.max(0, carritosM.prev - ordenesM.prev);
  const carritoPromedio = 41_200;

  const productos = distribute(vistasProducto * 1.7, MOTOPARTES, p).map((x) => {
    const unidades = Math.max(0, Math.round(x.value * x.conv * jitter(p, 0.15)));
    return { label: x.label, vistas: x.value, unidades, facturacion: unidades * x.precio, conv: x.value ? unidades / x.value : 0 };
  });

  const pagosIntentados = Math.round(ordenesM.cur / 0.86);
  const rechazados = Math.round(pagosIntentados * 0.1);
  const pendientes = pagosIntentados - ordenesM.cur - rechazados;
  const comision = factM.cur * 0.0629;
  const envios = factM.cur * 0.041;

  return {
    kpis: {
      facturacion: factM,
      ordenes: ordenesM,
      ticket: {
        cur: factM.cur / (ordenesM.cur || 1),
        prev: factM.prev / (ordenesM.prev || 1),
        spark: factM.spark.map((f, i) => f / (metric(ordenes, period).spark[i] || 1)),
      },
      conversion: {
        cur: ordenesM.cur / visitasM.cur,
        prev: ordenesM.prev / visitasM.prev,
        spark: ordenesM.spark.map((o, i) => o / (visitasM.spark[i] || 1)),
      },
      abandonados: {
        cur: abandonados * carritoPromedio,
        prev: abandonadosPrev * carritoPromedio,
        spark: carritosM.spark.map((c, i) => Math.max(0, c - ordenesM.spark[i]) * carritoPromedio),
      },
    },
    factSerie: points(days, facturacion, period),
    factPrev: previous(facturacion, period),
    embudo: [
      { label: 'Entraron a la tienda', value: visitasM.cur },
      { label: 'Vieron un producto', value: vistasProducto },
      { label: 'Agregaron al carrito', value: carritosM.cur },
      { label: 'Iniciaron el pago', value: checkoutM.cur },
      { label: 'Compraron', value: ordenesM.cur },
    ],
    carritos: {
      cantidad: abandonados,
      monto: abandonados * carritoPromedio,
      productos: distribute(abandonados, MOTOPARTES.slice(0, 5).map((x, i) => ({ ...x, w: [6, 9, 3, 4, 8][i] })), p).sort(
        (a, b) => b.value - a.value,
      ),
    },
    neto: [
      { label: 'Te queda', value: factM.cur - comision - envios },
      { label: 'Comisión de cobro', value: comision },
      { label: 'Costo de envíos', value: envios },
    ],
    productos: [...productos].sort((a, b) => b.facturacion - a.facturacion),
    oportunidades: [...productos].filter((x) => x.vistas > 200).sort((a, b) => a.conv - b.conv).slice(0, 4).sort((a, b) => b.vistas - a.vistas),
    pagos: [
      { status: 'good' as const, label: 'Aprobados', value: ordenesM.cur },
      { status: 'warning' as const, label: 'Pendientes', value: pendientes },
      { status: 'critical' as const, label: 'Rechazados', value: rechazados },
    ],
    rechazos: distribute(rechazados, RECHAZOS, p),
    medios: distribute(ordenesM.cur, MEDIOS, p),
    cuotas: distribute(ordenesM.cur, CUOTAS, p),
    estados: [
      { label: 'Para preparar', value: 6 + Math.round(p() * 4) },
      { label: 'Preparando', value: 3 + Math.round(p() * 3) },
      { label: 'En camino', value: 9 + Math.round(p() * 5) },
      { label: 'Entregadas este período', value: Math.round(ordenesM.cur * 0.86) },
    ],
    entrega: distribute(ordenesM.cur, [
      { label: 'Envío a domicilio', w: 58 },
      { label: 'Retiro en el local', w: 42 },
    ], p, 0.05),
    zonas: distribute(Math.round(ordenesM.cur * 0.58), ZONAS, p),
    clientes: distribute(ordenesM.cur, [
      { label: 'Primera compra', w: 64 },
      { label: 'Volvieron a comprar', w: 36 },
    ], p, 0.05),
    topClientes: CLIENTES.map((nombre, i) => {
      const compras = Math.max(2, Math.round((period / 30) * (5 - i * 0.6) * jitter(p, 0.2)));
      return { nombre, compras, total: compras * 41_000 * jitter(p, 0.3) };
    }).sort((a, b) => b.total - a.total),
    ventasPorOrigen: distribute(factM.cur, ORIGEN_VENTAS, p),
    cupones: distribute(Math.round(ordenesM.cur * 0.22), CUPONES, p).map((c) => ({
      codigo: c.label,
      usos: c.value,
      facturacion: c.value * 44_000,
      descuento: c.value * 44_000 * c.descuento,
    })),
    sinResultados: distribute(Math.round(visitasM.cur * 0.04), [
      { label: 'escape deportivo', w: 10 },
      { label: 'baul trasero 45 litros', w: 7.8 },
      { label: 'kit de arrastre rouser 200', w: 5.9 },
      { label: 'intercomunicador', w: 4.4 },
    ], p),
  };
}

export type ProfesionalData = ReturnType<typeof profesional>;
export type TiendaData = ReturnType<typeof tienda>;
