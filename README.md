# Sistema Kiosko

MVP web para administrar productos, stock y ventas de un único kiosco. El repositorio sigue el documento de requisitos y está organizado como monorepo:

- `frontend`: React, Vite y TypeScript.
- `backend`: Express, Prisma, MySQL y TypeScript.
- `docs`: plan incremental y decisiones de implementación.

## Requisitos

- Node.js 22 o posterior.
- npm 11 o posterior.
- MySQL 8.4 (o Docker para el entorno local).

## Primer arranque

1. Copiar `backend/.env.example` a `backend/.env`.
2. Copiar `frontend/.env.example` a `frontend/.env`.
3. Iniciar MySQL con `docker compose up -d mysql`.
4. Ejecutar `npm install` en la raíz.
5. Ejecutar `npm run db:migrate --workspace backend`.
6. Definir las variables `ADMIN_*` y ejecutar `npm run db:seed --workspace backend`.
7. En terminales separadas, ejecutar `npm run dev:backend` y `npm run dev:frontend`.

La API queda disponible en `http://localhost:3000/api/v1` y el healthcheck en `http://localhost:3000/health`.

## Modo demostración sin MySQL

Este modo permite recorrer el MVP completo con datos en memoria. En dos terminales ejecutar:

```bash
npm run demo:backend
npm run demo:frontend
```

Abrir `http://127.0.0.1:5173` e ingresar con:

```text
Email: admin@kiosko.local
Contraseña: kiosko-demo
```

Los datos se reinician al detener la API demo. No utilizar este modo en producción.

## Estado

La base persistente incluye el esquema versionado, seed seguro, autenticación con access/refresh tokens, CRUD lógico de productos y movimientos transaccionales de stock. El modo demo permite además validar productos, stock, venta, historial, anulación y dashboard de punta a punta. El siguiente corte trasladará ventas y dashboard al backend Prisma/MySQL.

Ver [Plan de implementación](docs/PLAN_IMPLEMENTACION.md).
