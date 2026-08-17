# El Kioskero

> Para publicar el sistema, consultar la [guía paso a paso de despliegue en producción](docs/DESPLIEGUE_PRODUCCION.md).

MVP web para administrar productos, stock y ventas de un único kiosco.

El repositorio está organizado como monorepo:

- `frontend`: React, Vite y TypeScript.
- `backend`: Express, Prisma, MySQL y TypeScript.
- `docs`: requisitos, plan incremental y decisiones de implementación.

## Requisitos

- Node.js 22 o posterior.
- npm 11 o posterior.
- Docker Desktop con WSL 2 habilitado en Windows.
- Puertos disponibles: `3000`, `3306` y `5173`.

> En PowerShell, si `npm` muestra un error relacionado con `npm.ps1` o la política de ejecución, utilizar `npm.cmd`, como en los ejemplos de esta guía.

## Levantar el proyecto con MySQL

Todos los comandos deben ejecutarse desde la raíz del repositorio.

### 1. Instalar dependencias

```powershell
npm.cmd install
```

### 2. Crear los archivos de entorno

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Editar `backend/.env` y completar, como mínimo:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://kiosko:kiosko_dev@localhost:3306/kiosko

JWT_ACCESS_SECRET=un-secreto-local-de-al-menos-32-caracteres
JWT_REFRESH_SECRET=otro-secreto-local-de-al-menos-32-caracteres

JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL_DAYS=7
CORS_ORIGIN=http://localhost:5173

ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@kiosko.local
ADMIN_PASSWORD=una-contraseña-local-de-al-menos-12-caracteres
```

El frontend debe apuntar a la API. Contenido de `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

Los archivos `.env` están ignorados por Git y no deben contener credenciales de producción.

### 3. Iniciar MySQL

Abrir Docker Desktop y esperar a que indique que el motor está ejecutándose. Después:

```powershell
docker compose up -d mysql
docker compose ps
```

El servicio debe aparecer como `healthy`. Para seguir la inicialización:

```powershell
docker compose logs -f mysql
```

Salir de los logs con `Ctrl + C`; esto no detiene MySQL.

La configuración local utilizada por Docker Compose es:

| Dato | Valor |
|---|---|
| Host | `localhost` |
| Puerto | `3306` |
| Base | `kiosko` |
| Usuario | `kiosko` |
| Contraseña | `kiosko_dev` |

### 4. Generar Prisma y aplicar migraciones

```powershell
npm.cmd run db:generate --workspace backend
npm.cmd run db:migrate:deploy --workspace backend
```

Comprobar que todas las migraciones estén aplicadas:

```powershell
npm.cmd exec --workspace backend prisma migrate status
```

Para crear una migración nueva durante el desarrollo, después de modificar `schema.prisma`:

```powershell
npm.cmd run db:migrate --workspace backend -- --name nombre_de_la_migracion
```

No utilizar `migrate dev` contra producción.

### 5. Crear o actualizar el administrador

El seed utiliza `ADMIN_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` de `backend/.env`.

```powershell
npm.cmd run db:seed --workspace backend
```

El comando es idempotente: puede ejecutarse nuevamente para actualizar el nombre o la contraseña del administrador configurado.

### 6. Iniciar backend y frontend

Abrir dos terminales desde la raíz.

Terminal 1 — API:

```powershell
npm.cmd run dev:backend
```

Terminal 2 — interfaz:

```powershell
npm.cmd run dev:frontend
```

Direcciones locales:

- Aplicación: http://localhost:5173
- API: http://localhost:3000/api/v1
- Healthcheck: http://localhost:3000/health

Comprobar el backend desde PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

La respuesta debe incluir:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

Para iniciar sesión, utilizar `ADMIN_EMAIL` y `ADMIN_PASSWORD` definidos en `backend/.env`.

## Ver las tablas y datos de MySQL

### Opción recomendada: Prisma Studio

Con MySQL iniciado y `backend/.env` configurado, ejecutar:

```powershell
npm.cmd run db:studio --workspace backend
```

Prisma Studio abrirá normalmente http://localhost:5555. Desde allí se pueden consultar y relacionar visualmente:

- `User`
- `RefreshToken`
- `Product`
- `StockMovement`
- `Sale`
- `SaleItem`

Cerrar Studio con `Ctrl + C`.

> Prisma Studio modifica datos reales. Evitar editar manualmente stock, ventas o movimientos, porque esas operaciones deben pasar por las transacciones de la API.

### Opción por consola: cliente MySQL del contenedor

Abrir una consola SQL dentro del contenedor:

```powershell
docker compose exec mysql mysql -ukiosko -pkiosko_dev kiosko
```

Consultas útiles:

```sql
SHOW TABLES;

SELECT id, name, email, role, is_active, last_login_at
FROM users;

SELECT id, barcode, name, sale_price, current_stock,
       minimum_stock, is_active
FROM products
ORDER BY name;

SELECT sale_number, total, total_units, status, created_at, voided_at
FROM sales
ORDER BY created_at DESC;

SELECT sale_id, product_name, barcode, quantity, unit_price, subtotal
FROM sale_items
ORDER BY created_at DESC;

SELECT movement_type, quantity_delta, stock_before, stock_after,
       reference_type, reference_id, notes, created_at
FROM stock_movements
ORDER BY created_at DESC;

SELECT migration_name, finished_at, rolled_back_at
FROM _prisma_migrations
ORDER BY started_at;
```

Para salir:

```sql
exit;
```

### Consultar tablas con un cliente gráfico externo

También puede utilizarse MySQL Workbench, DBeaver o una extensión SQL de VS Code con estos datos:

```text
Host: localhost
Port: 3306
Database: kiosko
User: kiosko
Password: kiosko_dev
```

## Detener el proyecto

Detener frontend y backend con `Ctrl + C` en sus terminales.

Detener MySQL conservando todos los datos:

```powershell
docker compose stop mysql
```

Eliminar los contenedores conservando el volumen de datos:

```powershell
docker compose down
```

### Reiniciar completamente la base

El siguiente comando elimina el contenedor y el volumen local de MySQL. Se perderán productos, ventas, movimientos y usuarios locales:

```powershell
docker compose down -v
```

Después será necesario repetir las migraciones y el seed.

## Modo demostración sin MySQL

El modo demo permite recorrer el MVP con datos temporales en memoria. En dos terminales:

```powershell
npm.cmd run demo:backend
npm.cmd run demo:frontend
```

Abrir http://127.0.0.1:5173 e ingresar con:

```text
Email: admin@kiosko.local
Contraseña: kiosko-demo
```

Los datos se reinician al detener la API demo. No utilizar este modo en producción.

## Comandos de calidad

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

## Problemas frecuentes

### Docker no puede iniciar

Comprobar que WSL 2 esté instalado:

```powershell
wsl --status
wsl --list --verbose
```

Docker Desktop debe mostrar `running` antes de ejecutar Compose.

### MySQL no aparece como healthy

```powershell
docker compose ps
docker compose logs --tail 100 mysql
```

### Prisma muestra `P1001` o no encuentra la base

Verificar:

1. Que Docker Desktop y el contenedor MySQL estén activos.
2. Que `DATABASE_URL` coincida con el usuario, contraseña y puerto de `docker-compose.yml`.
3. Que el puerto `3306` no esté ocupado por otra instalación de MySQL.

### El navegador bloquea las peticiones por CORS

La URL utilizada para abrir el frontend debe coincidir exactamente con `CORS_ORIGIN`. Por ejemplo:

```env
CORS_ORIGIN=http://localhost:5173
```

No mezclar `localhost` y `127.0.0.1` entre el navegador, frontend y backend.

## Estado del MVP

El flujo de autenticación, productos, stock, ventas, anulaciones, historial y dashboard está implementado y fue validado contra MySQL 8.4.

Ver [Plan de implementación](docs/PLAN_IMPLEMENTACION.md).
