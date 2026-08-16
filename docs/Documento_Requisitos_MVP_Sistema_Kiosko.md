# Documento de Requisitos y Diseño Técnico — MVP Sistema de Gestión para Kiosco

**Versión del documento:** 2.0  
**Versión del producto:** MVP 1.0  
**Objetivo:** construir una primera versión estable, simple de operar y preparada para evolucionar posteriormente hacia offline-first, múltiples kioscos, múltiples clientes, pagos y facturación.

---

## 1. Objetivo del MVP

El objetivo de la primera versión es desarrollar un **sistema web de gestión para un único kiosco**, utilizado exclusivamente por su dueño o administrador.

El sistema deberá resolver correctamente las operaciones esenciales del negocio:

- Inicio de sesión seguro.
- Administración de productos.
- Identificación mediante códigos de barras.
- Control de stock.
- Registro de ingresos y ajustes de stock.
- Registro de ventas.
- Descuento automático del stock.
- Historial completo de ventas.
- Dashboard con estadísticas básicas.
- Persistencia segura de la información.

La prioridad del MVP será:

1. Simplicidad.
2. Velocidad de uso.
3. Integridad de los datos.
4. Facilidad de mantenimiento.
5. Facilidad para agregar nuevas funcionalidades.

La versión 1 **no incluirá múltiples kioscos ni múltiples clientes**. Esta capacidad se incorporará en una versión 2 mediante migraciones y nuevos módulos.

---

# 2. Alcance del MVP

## 2.1. Funcionalidades incluidas

### Autenticación

- Login.
- Logout.
- Persistencia de sesión.
- Protección de rutas.
- Contraseñas almacenadas mediante hash.
- Usuario administrador.
- Registro de último inicio de sesión.

### Productos

- Crear producto.
- Consultar productos.
- Editar producto.
- Desactivar producto.
- Buscar producto por nombre.
- Buscar producto por código de barras.
- Escanear código de barras.
- Consultar precio.
- Consultar stock.
- Consultar stock mínimo.
- Consultar fecha del último ingreso de stock.

### Stock

- Ingreso de mercadería.
- Ajuste manual.
- Descuento automático mediante ventas.
- Registro histórico de movimientos.
- Stock mínimo.
- Alertas de stock bajo.
- Alertas de productos sin stock.

### Ventas

- Escaneo de productos.
- Búsqueda manual.
- Carrito.
- Modificación de cantidades.
- Eliminación de productos del carrito.
- Validación de disponibilidad.
- Precio unitario.
- Subtotal por producto.
- Total de la venta.
- Confirmación.
- Persistencia de venta.
- Actualización automática del stock.

### Historial

- Historial completo de ventas.
- Fecha y hora.
- Total.
- Productos vendidos.
- Cantidades.
- Precio utilizado al momento de vender.
- Subtotal.
- Estado de la venta.
- Visualización del detalle de cada operación.

### Dashboard

- Ventas del día.
- Facturación registrada del día.
- Cantidad de unidades vendidas.
- Cantidad de ventas.
- Productos con stock bajo.
- Productos sin stock.
- Productos más vendidos.
- Últimas ventas realizadas.

---

# 3. Funcionalidades excluidas del MVP

Quedan explícitamente fuera de la versión 1:

- Multi-kiosco.
- Multi-cliente.
- SuperAdministrador.
- Cajeros y empleados.
- Roles avanzados.
- Facturación electrónica ARCA.
- Mercado Pago.
- Procesamiento de pagos.
- Tarjetas.
- Caja y arqueo.
- Proveedores.
- Compras.
- Cuenta corriente.
- Aplicación móvil.
- Funcionamiento offline.
- Sincronización entre dispositivos.
- Transferencias de stock.
- Inteligencia artificial.
- Predicción de demanda.

Estas funcionalidades deberán incorporarse en versiones posteriores sin reconstruir el núcleo de productos, stock y ventas.

---

# 4. Actor del MVP

## Administrador

El único actor operativo de la versión 1 será el propietario o administrador del kiosco.

Tendrá acceso a:

- Dashboard.
- Productos.
- Stock.
- Ventas.
- Historial.
- Configuración de su usuario.

No existirán permisos diferenciados durante el MVP.

---

# 5. Flujo principal de utilización

El flujo esperado será:

```text
LOGIN
  │
  ▼
DASHBOARD
  │
  ├──────────────► PRODUCTOS
  │                   │
  │                   ├── Crear
  │                   ├── Editar
  │                   ├── Consultar
  │                   └── Desactivar
  │
  ├──────────────► STOCK
  │                   │
  │                   ├── Ingresar
  │                   ├── Ajustar
  │                   └── Consultar movimientos
  │
  ├──────────────► NUEVA VENTA
  │                   │
  │                   ├── Escanear
  │                   ├── Agregar
  │                   ├── Modificar cantidad
  │                   └── Confirmar
  │
  └──────────────► HISTORIAL
                      │
                      └── Ver detalle
```

---

# 6. Requisitos funcionales

## RF-001 — Login

El sistema deberá permitir iniciar sesión mediante:

- Email.
- Contraseña.

El sistema deberá:

1. Buscar el usuario.
2. Comprobar que esté activo.
3. Comparar la contraseña con su hash.
4. Crear una sesión válida.
5. Actualizar `last_login_at`.
6. Redirigir al Dashboard.

Ante credenciales inválidas deberá devolver un mensaje genérico como:

> Email o contraseña incorrectos.

Nunca deberá indicarse si el email existe o no.

---

## RF-002 — Logout

El administrador deberá poder finalizar la sesión.

Los tokens/sesiones existentes deberán quedar invalidados según la estrategia de autenticación utilizada.

---

# 7. Gestión de productos

## RF-003 — Crear producto

Los datos obligatorios serán:

- Nombre.
- Código de barras.
- Precio de venta.
- Stock mínimo.

Datos opcionales:

- Descripción.

El stock inicial podrá cargarse inmediatamente después de crear el producto mediante un movimiento de stock.

### Regla

No se recomienda permitir que el formulario de producto modifique directamente `current_stock`.

Todo cambio de stock deberá producir un movimiento.

---

## RF-004 — Editar producto

Se podrá modificar:

- Nombre.
- Descripción.
- Código de barras.
- Precio.
- Stock mínimo.
- Estado.

Modificar el producto nunca deberá alterar una venta histórica.

---

## RF-005 — Desactivar producto

Un producto que haya participado en ventas **no deberá eliminarse físicamente**.

Se utilizará:

```text
is_active = false
```

Esto garantiza la conservación del historial.

---

## RF-006 — Listar productos

La pantalla deberá mostrar como mínimo:

| Campo | Descripción |
|---|---|
| Nombre | Nombre comercial |
| Código | Código de barras |
| Precio | Precio actual |
| Stock | Unidades actuales |
| Stock mínimo | Límite configurado |
| Último ingreso | Fecha de reposición |
| Estado | Activo / Inactivo |

---

## RF-007 — Búsqueda

Se deberá poder buscar mediante:

- Nombre.
- Código de barras.

El código de barras deberá estar indexado en MySQL.

---

# 8. Código de barras

## RF-008 — Lectura

La aplicación deberá soportar lectores USB que funcionen como dispositivos HID/Keyboard.

Ejemplo:

```text
LECTOR
   │
   ▼
7791234567890
   │
   ▼
Frontend
   │
   ▼
Buscar producto
```

No deberá existir dependencia directa respecto de una marca específica de lector.

---

## RF-009 — Código único

No podrán existir dos productos activos con el mismo código de barras.

La base de datos también deberá garantizar su unicidad.

---

# 9. Gestión de stock

## RF-010 — Stock actual

Cada producto deberá mantener:

```text
current_stock
```

representando la cantidad actualmente disponible.

Nunca podrá ser negativo en una operación normal.

---

## RF-011 — Ingreso de stock

El administrador podrá indicar:

```text
Producto: Coca-Cola 500ml

Stock actual: 10

Cantidad ingresada:
24

Nuevo stock:
34
```

Al confirmar:

```text
stock_before = 10
quantity_delta = +24
stock_after = 34
```

---

## RF-012 — Ajuste de stock

Será necesario permitir correcciones.

Ejemplo:

```text
Sistema: 20
Conteo físico: 18

Ajuste: -2
```

Deberá poder registrarse una observación:

> Botellas dañadas.

---

# 10. Historial de stock

Cada modificación deberá producir un registro en:

```text
stock_movements
```

Tipos iniciales:

```text
IN
SALE
ADJUSTMENT
SALE_VOID
```

De esta forma se podrá reconstruir por qué cambió el stock.

---

# 11. Último ingreso

La fecha del último ingreso no será un valor editable manualmente.

Se obtendrá del último:

```text
stock_movements.type = IN
```

Esto evita inconsistencias.

---

# 12. Alertas

Un producto estará bajo de stock cuando:

```text
current_stock <= minimum_stock
```

Y agotado cuando:

```text
current_stock = 0
```

---

# 13. Venta

## RF-013 — Iniciar venta

La pantalla deberá cargar automáticamente el foco en el campo de código de barras.

El administrador deberá poder comenzar a escanear sin utilizar el mouse.

---

## RF-014 — Agregar producto

Al escanear:

```text
7791234567890
```

el sistema deberá identificar el producto.

Si ya se encontraba en el carrito:

```text
cantidad = cantidad + 1
```

---

## RF-015 — Carrito

Cada producto deberá mostrar:

| Producto | Cantidad | Precio | Subtotal |
|---|---:|---:|---:|
| Coca-Cola | 2 | $1.500 | $3.000 |
| Alfajor | 3 | $900 | $2.700 |

Resultado:

```text
TOTAL = $5.700
```

---

## RF-016 — Validación

No podrá venderse una cantidad mayor que el stock disponible.

Ejemplo:

```text
Stock: 3
Solicitado: 5

ERROR:
Stock insuficiente.
```

---

# 14. Confirmación de venta

La operación deberá ejecutarse dentro de **una transacción de base de datos**.

Conceptualmente:

```text
BEGIN

1. Crear sale
2. Crear sale_items
3. Validar nuevamente stock
4. Actualizar products.current_stock
5. Crear stock_movements

COMMIT
```

Ante cualquier error:

```text
ROLLBACK
```

Esto es obligatorio para evitar una venta registrada sin descuento de stock o viceversa.

---

# 15. Datos históricos de la venta

El detalle deberá almacenar una copia de:

- Nombre del producto.
- Código de barras.
- Precio unitario.
- Cantidad.
- Subtotal.

No se debe reconstruir una venta histórica utilizando el precio actual del producto.

Ejemplo:

```text
Precio actual Coca-Cola:
$2.000

Precio durante venta #123:
$1.500
```

La venta #123 deberá continuar mostrando:

```text
$1.500
```

---

# 16. Anulación de una venta

Para un MVP operativo es recomendable permitir anular una venta por error.

Nunca deberá eliminarse físicamente.

La operación será:

```text
COMPLETED
    ↓
VOIDED
```

Y deberá generarse automáticamente un movimiento:

```text
SALE_VOID
```

que devuelva las unidades al stock.

---

# 17. Historial de ventas

La vista deberá permitir consultar:

- Número de venta.
- Fecha.
- Hora.
- Cantidad de productos.
- Cantidad de unidades.
- Total.
- Estado.

Inicialmente se recomienda filtrar por:

- Fecha desde.
- Fecha hasta.
- Estado.

Y poder abrir:

```text
Venta #ABC123
```

para consultar el detalle completo.

---

# 18. Dashboard

El Dashboard debe entregar información útil sin convertirse todavía en un sistema de Business Intelligence.

## Métricas principales

### Ventas de hoy

```text
$185.500
```

### Cantidad de ventas

```text
47
```

### Unidades vendidas

```text
82
```

### Stock bajo

```text
12 productos
```

### Sin stock

```text
3 productos
```

---

## Productos más vendidos

Mostrar los cinco productos con mayor cantidad vendida durante un período.

Ejemplo:

```text
1. Coca-Cola 500ml       32
2. Alfajor Jorgito       27
3. Agua 500ml            22
4. Papas fritas          19
5. Galletitas            17
```

---

## Últimas ventas

Mostrar las últimas cinco o diez ventas.

---

# 19. Requisitos no funcionales

## Seguridad

El sistema deberá utilizar:

- HTTPS en producción.
- Hash seguro para contraseñas.
- Cookies HttpOnly cuando corresponda.
- Cookies Secure en producción.
- Protección CORS.
- Rate limiting en login.
- Validación de todos los datos recibidos.
- Variables de entorno.
- Errores sin información sensible.

---

## Rendimiento

Las operaciones críticas deberán sentirse inmediatas:

- Escaneo.
- Buscar producto.
- Agregar al carrito.
- Confirmar venta.
- Consultar stock.

`barcode` deberá poseer índice único.

---

## Integridad

Las operaciones financieras y de stock utilizarán:

```text
DECIMAL
```

para precios y totales, nunca `FLOAT`.

Las ventas utilizarán transacciones.

---

## Disponibilidad

La infraestructura deberá contar con:

- Backups.
- Logs.
- Healthcheck.
- Reinicio automático.
- Base de datos persistente.

Railway permite programar backups de volúmenes en frecuencia diaria, semanal y mensual. Debe recordarse que sus templates de bases de datos son servicios no administrados y la responsabilidad sobre backups, seguridad y mantenimiento continúa siendo del responsable de la aplicación. ([docs.railway.com](https://docs.railway.com/volumes/backups?utm_source=chatgpt.com))

---

# 20. Tecnologías del MVP

## Frontend

```text
React
Vite
TypeScript
```

### Librerías

```text
React Router
TanStack Query
React Hook Form
Zod
Tailwind CSS
```

### Responsabilidad

El frontend manejará:

- Interfaz.
- Formularios.
- Carrito temporal.
- Navegación.
- Peticiones HTTP.
- Estados de carga.
- Errores.
- Validación visual.

---

# 21. Backend

```text
Node.js
TypeScript
Express
```

Librerías recomendadas:

```text
Prisma ORM
Zod
bcrypt
jsonwebtoken
helmet
cors
express-rate-limit
pino
```

El backend será responsable de:

- Autenticación.
- Autorización.
- Validación definitiva.
- Productos.
- Stock.
- Ventas.
- Transacciones.
- Dashboard.
- Persistencia.
- Reglas de negocio.

---

# 22. Base de datos

Se utilizará:

> **MySQL**

con:

> **Prisma ORM + Prisma Migrate**

Prisma Migrate mantiene un historial versionado de migraciones SQL y distingue entre `migrate dev` para desarrollo y `migrate deploy` para aplicar migraciones pendientes en producción. ([docs.prisma.io](https://docs.prisma.io/docs/orm/prisma-migrate?utm_source=chatgpt.com))

---

# 23. Arquitectura

Se utilizará un **monolito modular**.

No se utilizarán microservicios para el MVP.

```text
                    INTERNET
                       │
                       ▼
              ┌─────────────────┐
              │ React + Vite    │
              │ Frontend        │
              └────────┬────────┘
                       │
                    HTTPS
                       │
                       ▼
              ┌─────────────────┐
              │ Node + Express  │
              │ API REST        │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ MySQL           │
              │ Prisma ORM      │
              └─────────────────┘
```

---

# 24. Estructura del repositorio

Se recomienda un monorepo:

```text
kiosko-system/
│
├── frontend/
│
├── backend/
│
├── docs/
│
├── .gitignore
├── README.md
└── docker-compose.yml
```

Railway permite desplegar frontend y backend de un monorepo como servicios diferentes indicando el `Root Directory` de cada servicio. ([docs.railway.com](https://docs.railway.com/guides/deploying-a-monorepo?utm_source=chatgpt.com))

---

# 25. Frontend

```text
frontend/
│
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── forms/
│   │   └── layout/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── sales/
│   │   └── stock/
│   │
│   ├── hooks/
│   ├── pages/
│   ├── router/
│   ├── schemas/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
│
├── public/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

La organización principal será por **features**, no por tipos genéricos de archivo.

---

# 26. Backend

```text
backend/
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── config/
│   ├── middlewares/
│   ├── modules/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── sales/
│   │   └── stock/
│   │
│   ├── shared/
│   │   ├── errors/
│   │   ├── logger/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
├── package.json
└── tsconfig.json
```

---

# 27. Estructura interna de módulo

Ejemplo:

```text
modules/products/
│
├── product.controller.ts
├── product.service.ts
├── product.repository.ts
├── product.routes.ts
├── product.schema.ts
└── product.types.ts
```

Flujo:

```text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Prisma
  ↓
MySQL
```

---

# 28. Responsabilidades

## Controller

Se ocupa únicamente de HTTP.

```text
request
response
status codes
```

## Service

Contiene reglas de negocio.

Ejemplo:

```text
¿Hay stock?
¿Producto activo?
¿Venta válida?
```

## Repository

Encapsula consultas a base de datos.

## Schema

Valida entradas utilizando Zod.

Esto evita controladores gigantes y código difícil de mantener.

---

# 29. Base de datos exacta del MVP

El modelo utilizará UUID como identificador.

Esto facilita una futura implementación offline y reduce dependencia de IDs secuenciales.

## Tablas

```text
users
refresh_tokens
products
stock_movements
sales
sale_items
```

---

# 30. Tabla `users`

```sql
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'ADMIN',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);
```

---

# 31. Tabla `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_token_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_refresh_token_user (user_id),
    INDEX idx_refresh_token_expiration (expires_at)
);
```

Los refresh tokens no deberán almacenarse en texto plano.

---

# 32. Tabla `products`

```sql
CREATE TABLE products (
    id CHAR(36) PRIMARY KEY,

    barcode VARCHAR(64) NOT NULL,

    name VARCHAR(160) NOT NULL,

    description VARCHAR(500) NULL,

    sale_price DECIMAL(12,2) NOT NULL,

    current_stock INT NOT NULL DEFAULT 0,

    minimum_stock INT NOT NULL DEFAULT 0,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uk_products_barcode
        UNIQUE (barcode),

    INDEX idx_products_name (name),

    INDEX idx_products_active (is_active)
);
```

### Reglas

```text
sale_price >= 0
current_stock >= 0
minimum_stock >= 0
```

Además de validarlo en aplicación, las migraciones podrán incorporar constraints compatibles con la versión de MySQL utilizada.

---

# 33. Tabla `sales`

```sql
CREATE TABLE sales (
    id CHAR(36) PRIMARY KEY,

    sale_number BIGINT NOT NULL AUTO_INCREMENT UNIQUE,

    total DECIMAL(12,2) NOT NULL,

    total_units INT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',

    created_by CHAR(36) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    voided_at DATETIME NULL,

    CONSTRAINT fk_sales_user
        FOREIGN KEY (created_by)
        REFERENCES users(id),

    INDEX idx_sales_created_at (created_at),

    INDEX idx_sales_status (status)
);
```

Estados:

```text
COMPLETED
VOIDED
```

---

# 34. Tabla `sale_items`

```sql
CREATE TABLE sale_items (
    id CHAR(36) PRIMARY KEY,

    sale_id CHAR(36) NOT NULL,

    product_id CHAR(36) NOT NULL,

    product_name VARCHAR(160) NOT NULL,

    barcode VARCHAR(64) NOT NULL,

    quantity INT NOT NULL,

    unit_price DECIMAL(12,2) NOT NULL,

    subtotal DECIMAL(12,2) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_sale_item_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_sale_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    INDEX idx_sale_items_sale (sale_id),

    INDEX idx_sale_items_product (product_id)
);
```

Se guardan:

```text
product_name
barcode
unit_price
```

como **snapshot histórico**.

---

# 35. Tabla `stock_movements`

```sql
CREATE TABLE stock_movements (
    id CHAR(36) PRIMARY KEY,

    product_id CHAR(36) NOT NULL,

    user_id CHAR(36) NOT NULL,

    movement_type VARCHAR(30) NOT NULL,

    quantity_delta INT NOT NULL,

    stock_before INT NOT NULL,

    stock_after INT NOT NULL,

    reference_type VARCHAR(30) NULL,

    reference_id CHAR(36) NULL,

    notes VARCHAR(500) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_stock_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    INDEX idx_stock_product (product_id),

    INDEX idx_stock_created_at (created_at),

    INDEX idx_stock_product_date (
        product_id,
        created_at
    ),

    INDEX idx_stock_reference (
        reference_type,
        reference_id
    )
);
```

Tipos:

```text
IN
SALE
ADJUSTMENT
SALE_VOID
```

---

# 36. Relaciones

```text
USERS
 │
 ├──────── SALES
 │
 ├──────── STOCK_MOVEMENTS
 │
 └──────── REFRESH_TOKENS


PRODUCTS
 │
 ├──────── SALE_ITEMS
 │
 └──────── STOCK_MOVEMENTS


SALES
 │
 └──────── SALE_ITEMS
```

---

# 37. Regla fundamental del stock

`products.current_stock` representa el estado actual.

`stock_movements` representa su historia.

Ejemplo:

```text
PRODUCT
current_stock = 25

STOCK_MOVEMENTS

+20 IN
+10 IN
 -2 SALE
 -1 SALE
 -2 ADJUSTMENT
---------------
 25
```

Nunca deberá modificarse `current_stock` sin crear el movimiento correspondiente.

---

# 38. Fuente de verdad del esquema

Aunque se documentó el SQL exacto, durante el desarrollo **la fuente de verdad deberá ser:**

```text
backend/prisma/schema.prisma
```

más:

```text
backend/prisma/migrations/
```

No deberán crearse/modificarse tablas manualmente en producción.

Prisma recomienda versionar el directorio de migraciones y utilizar `prisma migrate deploy` para aplicar en producción las migraciones pendientes. ([docs.prisma.io](https://docs.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate?utm_source=chatgpt.com))

---

# 39. Migraciones

## Desarrollo

Cada modificación estructural:

```bash
npx prisma migrate dev --name nombre_migracion
```

Ejemplo:

```bash
npx prisma migrate dev --name init
```

Después:

```bash
npx prisma generate
```

---

## Producción

Nunca utilizar:

```bash
prisma migrate dev
```

contra producción.

Utilizar:

```bash
npx prisma migrate deploy
```

Prisma documenta `migrate dev` para desarrollo y `migrate deploy` para testing/producción. ([docs.prisma.io](https://docs.prisma.io/docs/orm/v6/prisma-migrate/workflows/development-and-production?utm_source=chatgpt.com))

---

# 40. API REST propuesta

## Auth

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

---

## Productos

```text
GET    /api/v1/products
GET    /api/v1/products/:id
GET    /api/v1/products/barcode/:barcode
POST   /api/v1/products
PATCH  /api/v1/products/:id
DELETE /api/v1/products/:id
```

`DELETE` realizará eliminación lógica.

---

## Stock

```text
GET  /api/v1/stock/movements
GET  /api/v1/products/:id/stock/movements

POST /api/v1/products/:id/stock/in
POST /api/v1/products/:id/stock/adjustment
```

---

## Ventas

```text
POST /api/v1/sales

GET /api/v1/sales

GET /api/v1/sales/:id

POST /api/v1/sales/:id/void
```

---

## Dashboard

```text
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/top-products
GET /api/v1/dashboard/recent-sales
```

---

# 41. Versionado API

Desde el comienzo:

```text
/api/v1/
```

Esto permitirá incorporar posteriormente:

```text
/api/v2/
```

sin romper clientes existentes.

---

# 42. Validaciones

Frontend y backend deberán validar.

Pero el backend será siempre la autoridad final.

Ejemplos:

```text
barcode       obligatorio
barcode       único
name          obligatorio
salePrice     >= 0
quantity      > 0
minimumStock  >= 0
```

En ventas:

```text
product exists
product.isActive
quantity > 0
stock >= quantity
```

---

# 43. Manejo monetario

Nunca utilizar:

```javascript
float
```

como representación persistente del dinero.

MySQL utilizará:

```sql
DECIMAL(12,2)
```

Ejemplo:

```text
9999999999.99
```

Para cálculos críticos se deberá evitar depender de imprecisiones binarias de JavaScript.

---

# 44. Buenas prácticas de código

## TypeScript estricto

Activar:

```json
{
  "strict": true
}
```

No utilizar indiscriminadamente:

```typescript
any
```

---

## Nombres descriptivos

Evitar:

```typescript
const x = ...
const data2 = ...
const p = ...
```

Preferir:

```typescript
const availableStock
const saleItems
const selectedProduct
```

---

## Funciones pequeñas

Evitar funciones que:

- consultan BD;
- validan;
- calculan;
- envían HTTP;
- registran logs;

todo al mismo tiempo.

---

# 45. Principios

Se deberán aplicar razonablemente:

```text
SOLID
DRY
KISS
YAGNI
```

Especialmente `YAGNI`.

No se construirán funciones de multi-kiosco, facturación o IA antes de necesitarlas.

---

# 46. Manejo de errores

Crear errores de dominio.

Ejemplos:

```text
ProductNotFoundError
InsufficientStockError
BarcodeAlreadyExistsError
SaleAlreadyVoidedError
InvalidCredentialsError
```

El controller transformará posteriormente esos errores en respuestas HTTP.

---

# 47. Respuesta estándar de API

Ejemplo exitoso:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Stock insuficiente."
  }
}
```

---

# 48. Logging

No utilizar únicamente:

```typescript
console.log()
```

en producción.

Se recomienda:

```text
Pino
```

Registrar:

- errores;
- inicio de servidor;
- login fallido;
- venta creada;
- anulación;
- fallos críticos.

Nunca registrar:

- contraseñas;
- tokens;
- secretos;
- cookies completas.

---

# 49. Tests mínimos

El MVP deberá poseer pruebas particularmente sobre lógica crítica.

## Unitarias

- cálculo de venta;
- validación de stock;
- ajuste de stock;
- creación de movimientos.

## Integración

- login;
- creación de producto;
- ingreso de stock;
- creación de venta;
- rollback ante stock insuficiente;
- anulación.

## End-to-End

Como mínimo:

```text
Login
 ↓
Crear producto
 ↓
Ingresar stock
 ↓
Realizar venta
 ↓
Ver historial
```

---

# 50. Git

Branches recomendadas:

```text
main
develop
feature/*
fix/*
```

Ejemplo:

```text
feature/product-crud
feature/sales
feature/dashboard
fix/stock-validation
```

`main` deberá contener únicamente código apto para producción.

---

# 51. Commits

Preferentemente usar Conventional Commits:

```text
feat: add product creation
feat: implement sales transaction
fix: prevent negative stock
refactor: move stock logic to service
test: add sale transaction tests
docs: update deployment instructions
```

---

# 52. Variables de entorno

Nunca subir `.env` a Git.

Backend:

```env
NODE_ENV=development

DATABASE_URL=mysql://...

JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...

CORS_ORIGIN=http://localhost:5173
```

Frontend:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

Railway permite definir variables por servicio y utilizarlas durante build y ejecución. ([docs.railway.com](https://docs.railway.com/variables?utm_source=chatgpt.com))

---

# 53. Desarrollo local

Arquitectura recomendada:

```text
Docker Compose
│
├── MySQL
│
├── Backend
│
└── opcionalmente frontend
```

Durante desarrollo también es válido ejecutar:

```text
Frontend → npm run dev

Backend → npm run dev

MySQL → Docker
```

---

# 54. Producción con Railway

La arquitectura de producción será:

```text
                 RAILWAY PROJECT
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    FRONTEND        BACKEND         MYSQL
 React/Vite      Node/Express      Database
        │              │
        │              ▼
        │          Prisma ORM
        │              │
        └──── HTTPS ───┘
```

Railway ofrece actualmente un template oficial de MySQL y expone variables como `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` y `MYSQL_URL`. ([docs.railway.com](https://docs.railway.com/databases/mysql?utm_source=chatgpt.com))

---

# 55. Preparación previa al deploy

Antes de producción deberán completarse:

```text
✓ tests
✓ build frontend
✓ build backend
✓ migraciones
✓ seed administrador
✓ variables de entorno
✓ health endpoint
✓ CORS
✓ manejo de errores
✓ logs
✓ backup configurado
```

---

# 56. Paso 1 — Subir proyecto a GitHub

Repositorio:

```text
kiosko-system
│
├── frontend
└── backend
```

Ejecutar:

```bash
git init

git add .

git commit -m "chore: initial production version"

git branch -M main

git remote add origin <repositorio>

git push -u origin main
```

---

# 57. Paso 2 — Crear proyecto Railway

Ingresar a Railway.

Crear:

```text
New Project
```

El resultado conceptual será:

```text
kiosko-production
```

---

# 58. Paso 3 — Crear MySQL

Dentro del proyecto:

```text
+ New
 ↓
Database
 ↓
MySQL
```

Railway desplegará un servicio MySQL basado en su template oficial. ([docs.railway.com](https://docs.railway.com/databases/mysql?utm_source=chatgpt.com))

Renombrarlo:

```text
mysql
```

---

# 59. Paso 4 — Crear backend

Crear:

```text
Empty Service
```

Nombre:

```text
backend
```

Conectar:

```text
GitHub Repo
 ↓
kiosko-system
```

Configurar:

```text
Root Directory:

/backend
```

Railway utiliza el Root Directory para indicar qué subdirectorio de un monorepo corresponde a cada servicio. ([docs.railway.com](https://docs.railway.com/deployments/monorepo?utm_source=chatgpt.com))

---

# 60. Paso 5 — Configurar backend

Agregar variables:

```env
NODE_ENV=production

DATABASE_URL=${{mysql.MYSQL_URL}}

JWT_ACCESS_SECRET=<secreto-seguro>

JWT_REFRESH_SECRET=<secreto-seguro>
```

Todavía podrá dejarse temporalmente:

```env
CORS_ORIGIN=*
```

únicamente durante la primera prueba.

Antes de abrir producción deberá sustituirse por el dominio real del frontend.

Las reference variables de Railway permiten que un servicio consuma variables expuestas por otro servicio del mismo proyecto. ([docs.railway.com](https://docs.railway.com/guides/express?utm_source=chatgpt.com))

---

# 61. Paso 6 — Build backend

El `backend/package.json` deberá contar con scripts equivalentes a:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate:deploy": "prisma migrate deploy"
  }
}
```

Build:

```bash
npm run build
```

Start:

```bash
npm run start
```

Railway detecta aplicaciones Node.js automáticamente y permite personalizar tanto build como start commands. ([docs.railway.com](https://docs.railway.com/guides/express?utm_source=chatgpt.com))

---

# 62. Paso 7 — Migraciones automáticas

Configurar en:

```text
Backend
 ↓
Settings
 ↓
Deploy
 ↓
Pre-Deploy Command
```

comando:

```bash
npx prisma migrate deploy
```

Railway ejecuta el Pre-Deploy Command después del build y antes de poner la nueva aplicación en servicio; si falla, el deployment no continúa. Esta función está específicamente indicada para migraciones. ([docs.railway.com](https://docs.railway.com/deployments/pre-deploy-command?utm_source=chatgpt.com))

De esta forma:

```text
git push
   ↓
Railway build
   ↓
prisma migrate deploy
   ↓
start backend
```

---

# 63. Paso 8 — Healthcheck

Backend:

```text
GET /health
```

Respuesta:

```json
{
  "status": "ok"
}
```

Configurar Railway:

```text
Healthcheck Path:

/health
```

Railway incluye healthchecks dentro de sus herramientas de confiabilidad de deployments. ([docs.railway.com](https://docs.railway.com/deployments?utm_source=chatgpt.com))

---

# 64. Paso 9 — Dominio backend

Ingresar:

```text
backend
 ↓
Settings
 ↓
Networking
 ↓
Generate Domain
```

Ejemplo:

```text
kiosko-backend-production.up.railway.app
```

Posteriormente:

```text
api.midominio.com
```

---

# 65. Paso 10 — Crear frontend

Crear otro servicio:

```text
frontend
```

Conectar el mismo repositorio:

```text
kiosko-system
```

Configurar:

```text
Root Directory:

/frontend
```

Este patrón de dos servicios conectados al mismo monorepo está soportado directamente por Railway. ([docs.railway.com](https://docs.railway.com/guides/deploying-a-monorepo?utm_source=chatgpt.com))

---

# 66. Paso 11 — Configurar frontend

Variable:

```env
VITE_API_URL=https://api.midominio.com/api/v1
```

O inicialmente:

```env
VITE_API_URL=https://<backend-railway-domain>/api/v1
```

Importante:

Las variables `VITE_*` forman parte del bundle generado por el frontend y **no deberán contener secretos**.

---

# 67. Paso 12 — Frontend en producción

El frontend deberá ejecutar:

```bash
npm run build
```

generando:

```text
dist/
```

Los archivos deberán servirse mediante un servidor web apropiado para producción.

Una opción simple será utilizar:

```text
Caddy
```

dentro de un Dockerfile del frontend.

Estructura:

```text
React/Vite
   ↓
npm run build
   ↓
dist/
   ↓
Caddy
```

Railway utiliza este mismo enfoque con React/Vite + Caddy en su ejemplo oficial de despliegue de monorepos. ([docs.railway.com](https://docs.railway.com/guides/deploying-a-monorepo?utm_source=chatgpt.com))

---

# 68. Dockerfile recomendado del frontend

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM caddy:2-alpine

COPY --from=builder /app/dist /usr/share/caddy

COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 8080
```

---

# 69. Caddyfile

```text
:{$PORT}

root * /usr/share/caddy

encode gzip

try_files {path} /index.html

file_server
```

`try_files` es importante para rutas de React Router.

Por ejemplo:

```text
/products/123
```

deberá devolver:

```text
index.html
```

para que React Router resuelva la ruta.

---

# 70. Paso 13 — Dominio frontend

Generar:

```text
frontend
 ↓
Settings
 ↓
Networking
 ↓
Generate Domain
```

Luego reemplazar el CORS del backend:

```env
CORS_ORIGIN=https://<frontend-domain>
```

Nunca dejar:

```text
*
```

en producción final si se utilizan credenciales/cookies.

---

# 71. Paso 14 — Crear administrador

Crear un script:

```text
backend/prisma/seed.ts
```

No guardar una contraseña fija en Git.

El seed deberá utilizar variables:

```env
ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

El password deberá convertirse a hash antes de insertarse.

---

# 72. Paso 15 — Backups

Entrar al servicio MySQL:

```text
MySQL
 ↓
Backups
```

Configurar como mínimo:

```text
Daily
+
Weekly
```

Railway permite backups manuales y programados de los volúmenes, incluyendo los utilizados por sus bases de datos. ([docs.railway.com](https://docs.railway.com/volumes/backups?utm_source=chatgpt.com))

Para un sistema que almacena ventas y stock, los backups no deberán considerarse opcionales.

---

# 73. Paso 16 — Primera verificación de producción

Ejecutar manualmente:

```text
1. Login
2. Crear producto
3. Buscar producto
4. Escanear código
5. Ingresar stock
6. Realizar venta
7. Revisar descuento de stock
8. Consultar historial
9. Consultar Dashboard
10. Logout
```

---

# 74. Flujo de deploy posterior

Una vez configurado:

```text
Developer
   │
   ▼
feature branch
   │
   ▼
Pull Request
   │
   ▼
Tests
   │
   ▼
Merge main
   │
   ▼
GitHub
   │
   ▼
Railway
   │
   ├── build
   │
   ├── prisma migrate deploy
   │
   ├── deploy backend
   │
   └── deploy frontend
```

Railway puede desplegar directamente desde repositorios GitHub y detectar aplicaciones Node automáticamente. ([docs.railway.com](https://docs.railway.com/guides/express?utm_source=chatgpt.com))

---

# 75. Migraciones posteriores

Supongamos que se agrega:

```text
products.cost_price
```

En desarrollo:

```bash
npx prisma migrate dev --name add_product_cost
```

Esto genera:

```text
prisma/migrations/
└── 2026..._add_product_cost/
    └── migration.sql
```

Se sube a Git:

```bash
git add .

git commit -m "feat: add product cost"

git push
```

Railway:

```text
build
 ↓
prisma migrate deploy
 ↓
migration SQL
 ↓
MySQL actualizado
 ↓
nueva versión backend
```

No se deberá modificar manualmente MySQL en Railway.

---

# 76. Estrategia de ambientes

Para comenzar:

```text
LOCAL
 ↓
PRODUCTION
```

Cuando el producto tenga clientes reales adicionales:

```text
LOCAL
 ↓
STAGING
 ↓
PRODUCTION
```

Railway soporta ambientes separados y permite que cada environment tenga sus propias variables y bases de datos. ([docs.railway.com](https://docs.railway.com/guides/fullstack-nextjs?utm_source=chatgpt.com))

---

# 77. Seguridad de producción

Antes del lanzamiento:

```text
HTTPS
✓

CORS restringido
✓

Secrets fuera de Git
✓

Password hash
✓

Rate limiting
✓

Helmet
✓

Validation
✓

Backups
✓

Logs
✓

Healthcheck
✓
```

---

# 78. Preparación para offline-first

La versión 1 será online.

Sin embargo, deberá evitarse utilizar IDs autoincrementales como identidad funcional principal.

El uso de:

```text
UUID
```

facilitará posteriormente generar operaciones desde dispositivos offline.

En una futura versión podrán agregarse:

```text
PWA
IndexedDB
Dexie
Service Worker
Sync Queue
Idempotency Keys
```

sin reconstruir completamente productos, ventas y movimientos.

---

# 79. Preparación para multi-kiosco — Versión 2

La versión 2 incorporará:

```text
clients
kiosks
users
```

Arquitectura futura:

```text
PLATAFORMA
     │
     ├── CLIENTE A
     │      │
     │      ├── KIOSCO 1
     │      └── KIOSCO 2
     │
     └── CLIENTE B
            │
            └── KIOSCO 3
```

Las tablas operativas incorporarán referencias como:

```text
client_id
kiosk_id
```

según corresponda.

No se implementará todavía para evitar complejidad innecesaria en el MVP.

---

# 80. Versión 2 prevista

La siguiente evolución podrá incorporar:

- Multi-cliente.
- Multi-kiosco.
- SuperAdministrador.
- Administradores por cliente.
- Usuarios por kiosco.
- Roles.
- Permisos.
- Stock por sucursal.
- Transferencias entre sucursales.
- Dashboard consolidado.
- Suscripciones.

---

# 81. Versión posterior offline

Posteriormente:

```text
React
 ↓
PWA
 ↓
IndexedDB
 ↓
sync_queue
 ↓
API
 ↓
MySQL
```

permitirá realizar ventas aun sin Internet.

---

# 82. Versiones comerciales posteriores

Una evolución posible:

```text
MVP 1.0
Productos + stock + ventas
       ↓
1.5
Offline-first
       ↓
2.0
Multi-kiosco + SaaS
       ↓
3.0
Caja + medios de pago
       ↓
4.0
ARCA + facturación
       ↓
5.0
Predicción + IA
```

---

# 83. Criterios de aceptación del MVP

El MVP se considerará completo cuando el siguiente flujo funcione correctamente en producción:

```text
Administrador
     │
     ▼
LOGIN
     │
     ▼
CREAR PRODUCTO
     │
     ▼
ESCANEAR CÓDIGO
     │
     ▼
INGRESAR STOCK
     │
     ▼
CONSULTAR STOCK
     │
     ▼
NUEVA VENTA
     │
     ▼
ESCANEAR PRODUCTOS
     │
     ▼
MODIFICAR CANTIDADES
     │
     ▼
CONFIRMAR
     │
     ▼
GUARDAR VENTA
     │
     ▼
DESCONTAR STOCK
     │
     ▼
REGISTRAR MOVIMIENTOS
     │
     ▼
HISTORIAL
     │
     ▼
DASHBOARD
```

Todo el flujo deberá ejecutarse:

- sin inconsistencias;
- sin stock negativo;
- sin ventas duplicadas;
- sin perder historial;
- sin exponer información sensible.

---

# 84. Prioridad de implementación

## Etapa 1 — Base

```text
Proyecto
TypeScript
MySQL
Prisma
Express
React
```

## Etapa 2 — Seguridad

```text
Users
Login
Logout
Auth middleware
```

## Etapa 3 — Productos

```text
CRUD
Barcode
Search
```

## Etapa 4 — Stock

```text
Ingresos
Ajustes
Historial
Alertas
```

## Etapa 5 — Ventas

```text
Carrito
Barcode
Validación
Transaction
Sale items
Stock movements
```

## Etapa 6 — Historial

```text
Listado
Filtros
Detalle
Anulación
```

## Etapa 7 — Dashboard

```text
KPIs
Top productos
Últimas ventas
Stock bajo
```

## Etapa 8 — Calidad

```text
Tests
Error handling
Logging
Security
```

## Etapa 9 — Producción

```text
GitHub
Railway
MySQL
Migraciones
Domains
Backups
Healthcheck
```

---

# 85. Arquitectura final del MVP

```text
                         USUARIO
                            │
                            ▼
                  ┌──────────────────┐
                  │     FRONTEND     │
                  │                  │
                  │ React            │
                  │ Vite             │
                  │ TypeScript       │
                  │ Tailwind         │
                  │ TanStack Query   │
                  └────────┬─────────┘
                           │
                        HTTPS
                           │
                           ▼
                  ┌──────────────────┐
                  │      BACKEND     │
                  │                  │
                  │ Node.js          │
                  │ Express          │
                  │ TypeScript       │
                  │ Zod              │
                  │ Prisma           │
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │      MySQL       │
                  │                  │
                  │ users            │
                  │ refresh_tokens   │
                  │ products         │
                  │ stock_movements  │
                  │ sales            │
                  │ sale_items       │
                  └──────────────────┘
```

Producción:

```text
                         RAILWAY
                            │
           ┌────────────────┼────────────────┐
           │                │                │
           ▼                ▼                ▼
       FRONTEND          BACKEND           MYSQL
           │                │                │
           │                ├──── Prisma ────┘
           │                │
           └──── HTTPS ─────┘
```

---

# 86. Decisiones técnicas finales del MVP

| Área | Decisión |
|---|---|
| Aplicación | Web |
| Arquitectura | Monolito modular |
| Repositorio | Monorepo |
| Frontend | React |
| Build frontend | Vite |
| Lenguaje | TypeScript |
| UI | Tailwind CSS |
| Routing | React Router |
| Server State | TanStack Query |
| Formularios | React Hook Form |
| Validaciones | Zod |
| Backend | Node.js + Express |
| API | REST `/api/v1` |
| ORM | Prisma |
| Database | MySQL |
| IDs | UUID |
| Dinero | DECIMAL(12,2) |
| Passwords | bcrypt |
| Auth | Access + Refresh Token |
| Logging | Pino |
| Deploy | Railway |
| CI/CD inicial | GitHub + Railway |
| DB migrations | Prisma Migrate |
| Production migrations | `prisma migrate deploy` |
| Backups | Railway Volume Backups |
| Código de barras | USB HID/Keyboard |
| Versionado | Git + GitHub |

---

# 87. Conclusión

El MVP deberá concentrarse en resolver de manera excelente cinco problemas del kiosco:

```text
IDENTIFICAR PRODUCTOS
        ↓
CONTROLAR STOCK
        ↓
VENDER RÁPIDO
        ↓
CONSERVAR HISTORIAL
        ↓
ENTENDER EL NEGOCIO
```

Por ese motivo, la versión inicial estará deliberadamente limitada a:

**Login + Productos + CRUD + Código de barras + Stock + Ventas + Historial + Dashboard.**

No se implementará multi-kiosco todavía.

La arquitectura propuesta —React, TypeScript, Node.js, Express, Prisma y MySQL— permite mantener un MVP comprensible sin introducir microservicios ni infraestructura innecesaria.

Railway permitirá comenzar con una estructura sencilla de tres servicios:

```text
Frontend
Backend
MySQL
```

y el uso de GitHub, migraciones versionadas, variables de entorno, healthchecks y backups permitirá que el proyecto pueda evolucionar sin depender de modificaciones manuales de producción.

La regla principal será:

> **Construir un MVP pequeño en funcionalidades, pero profesional en arquitectura, seguridad, integridad de datos y mantenibilidad.**

Esta base permitirá posteriormente incorporar offline-first, multi-kiosco, múltiples clientes, pagos y facturación sin desechar el núcleo desarrollado para la primera versión.
