# Plan de implementación del MVP

## Principios de entrega

- Construir cortes verticales que se puedan demostrar de punta a punta.
- Tratar `products.current_stock` como estado actual y `stock_movements` como auditoría obligatoria.
- Guardar snapshots de producto y precio en cada ítem de venta.
- Mantener toda venta, anulación y cambio de stock dentro de transacciones de base de datos.
- Postergar multi-kiosco, pagos, facturación y modo offline hasta después del MVP.

## Hitos

### 1. Base técnica — iniciado

- Monorepo con workspaces.
- React/Vite y Express/Prisma.
- MySQL local, variables de entorno, healthcheck y logging.
- Modelo de datos y migración inicial.
- Resultado verificable: ambos proyectos compilan y la API informa su estado.

### 2. Seguridad — iniciado

- Seed de administrador sin credenciales en Git.
- Login, refresh rotativo, logout y endpoint `me`.
- Cookies HttpOnly, rate limit, Helmet, CORS y validación Zod.
- Resultado verificable: las rutas privadas rechazan tokens inválidos y el logout revoca la sesión.

### 3. Productos — funcional en demo

- Alta, consulta, búsqueda, edición y baja lógica.
- Código de barras único e indexado.
- Resultado verificable: un producto histórico nunca se elimina físicamente.

### 4. Stock — funcional en demo

- Ingreso, ajuste por conteo real y consulta de movimientos.
- Actualización de producto y movimiento dentro de una misma transacción.
- Resultado verificable: no existe una operación normal que deje stock negativo o cambie stock sin auditoría.

### 5. Ventas — implementado y validado en MySQL

- Carrito orientado al escáner HID, búsqueda manual y cantidades.
- Creación atómica de venta, ítems, descuento de stock y movimientos.
- Clave de idempotencia para evitar doble confirmación.
- Resultado verificable: si un ítem falla, no se persiste ninguna parte de la venta.

### 6. Historial y anulaciones — implementado y validado en MySQL

- Filtros por fecha/estado, detalle con snapshot histórico y anulación.
- Reintegro de unidades con movimientos `SALE_VOID` en una transacción.
- Resultado verificable: una venta anulada sigue visible y no puede anularse dos veces.

### 7. Dashboard — implementado y validado en MySQL

- Facturación, cantidad de ventas y unidades del día.
- Stock bajo/sin stock, top cinco y últimas ventas.
- Resultado verificable: solo las ventas `COMPLETED` participan de los indicadores.

### 8. Calidad y operación

- Pruebas unitarias de dinero/stock y pruebas de integración de los flujos críticos.
- Estados accesibles, feedback de errores y operación por teclado.
- Logs sin secretos, builds reproducibles y CI.

### 9. Producción

- Servicios frontend, backend y MySQL en Railway.
- Migraciones pre-deploy, dominios, HTTPS, CORS final, backups y smoke test.
- Resultado verificable: completar el flujo de aceptación del documento en producción.

## Orden de las próximas iteraciones

1. Convertir el smoke test persistente en una prueba automatizada de CI.
2. Ampliar las pruebas de concurrencia sobre confirmaciones simultáneas.
3. Preparar migraciones de producción y despliegue.

## Corte 2 validado

El modo demostración ya permite recorrer todas las secciones del MVP:

```text
LOGIN → PRODUCTOS → STOCK → NUEVA VENTA → HISTORIAL → ANULACIÓN → DASHBOARD
```

Las operaciones respetan stock disponible, snapshot histórico, idempotencia de venta y devolución de unidades al anular. Este flujo sirvió como contrato para la implementación persistente del corte siguiente.

## Corte 3 implementado

Los contratos de ventas, anulaciones e indicadores ya cuentan con implementación Prisma/MySQL:

- transacción `Serializable` con reintentos ante conflictos;
- descuento condicional para impedir stock negativo;
- snapshot histórico de cada ítem;
- clave de idempotencia única;
- anulación transaccional y movimientos `SALE_VOID`;
- métricas diarias en zona horaria de Buenos Aires;
- ranking de productos y últimas ventas;
- serialización segura de `BIGINT` y `DECIMAL`.

## Integración MySQL validada

El flujo real fue ejecutado contra MySQL 8.4 con ambas migraciones aplicadas:

```text
LOGIN → PRODUCTO → INGRESO +10 → VENTA -3 → RECHAZO DE SOBREVENTA
      → IDEMPOTENCIA → DASHBOARD → ANULACIÓN +3 → HISTORIAL
```

La comprobación directa en base confirmó una venta `VOIDED`, stock final restaurado a `10` y movimientos `IN`, `SALE` y `SALE_VOID` consistentes.

## Riesgos controlados desde el inicio

| Riesgo | Decisión |
|---|---|
| Stock inconsistente | Transacción y movimiento obligatorio |
| Precios históricos alterados | Snapshot en `sale_items` |
| Venta duplicada por doble clic/red | Idempotencia en la confirmación |
| Tokens filtrados | Refresh token hasheado y cookie HttpOnly |
| Dinero impreciso | `DECIMAL(12,2)` y cálculo en centavos/Decimal |
| Evolución offline | UUID como identidad funcional |
