# Portal de métricas (demo)

Portal de métricas para clientes del **Plan Profesional** y el **Plan Tienda**. Solo frontend: los datos son de ejemplo,
generados con semilla fija para que la demo muestre siempre los mismos números.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # estático en dist/ (se puede subir a cualquier hosting)
```

- `#/profesional` → catálogo con consultas por WhatsApp (Repuestera Villa Crespo, negocio ficticio).
- `#/tienda` → ecommerce con ventas y pagos (MotoBox Chacarita, negocio ficticio).
- Selector de período: 7, 30 y 90 días, con comparación contra el período anterior.

Para conectarlo a datos reales, reemplazar `src/lib/mock.ts` por lecturas de `metrics_daily` del módulo
[`../tracking`](../tracking) (y de `orders`/`payments` para el Plan Tienda). Los componentes no cambian.
