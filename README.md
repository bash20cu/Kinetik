# Kinetik

App web SSR para gestionar rutinas de gimnasio, importar planes por CSV y registrar sesiones.

## Stack

- Next.js App Router + TypeScript
- SSR en Vercel
- Neon PostgreSQL
- Prisma ORM
- Autenticacion privada por email + contrasena con cookie de sesion

## Variables de entorno

Crear `.env.local` con:

```bash
DATABASE_URL=postgresql://kinetik:kinetik@localhost:5432/kinetik
SESSION_SECRET=
APP_URL=http://localhost:3000
APP_TIMEZONE=America/Costa_Rica
```

`SESSION_SECRET` debe ser una cadena larga y privada. `APP_TIMEZONE` es opcional y
define la zona horaria de negocio usada para `hoy`, calendario y fechas de sesion.

## Base de datos local con Docker

El proyecto incluye [docker-compose.yml](/home/migue/Documentos/proyectos/github/Kinetik/docker-compose.yml) para levantar PostgreSQL localmente:

```bash
docker compose up -d
```

La instancia queda disponible en `localhost:5432` con:

- database: `kinetik`
- user: `kinetik`
- password: `kinetik`

Cuando quieras volver a Neon, solo cambia `DATABASE_URL` en `.env.local`.

## Desarrollo

```bash
npm install
npx prisma migrate deploy
npm run dev
```

## Crear usuarios

No hay registro publico. El seed crea automaticamente un usuario por defecto:

- Email: `admin@kinetik.app`
- Password: `kinetik123`

Puedes cambiarlo con variables de entorno `SEED_USER_EMAIL` y `SEED_USER_PASSWORD`.

Usuarios adicionales se crean o actualizan manualmente con:

```bash
npm run user:create -- usuario@correo.com "tu-password"
```

## Prisma

El esquema vive en [prisma/schema.prisma](/home/migue/Documentos/proyectos/github/Kinetik/prisma/schema.prisma) y la migracion inicial SQL en [prisma/migrations/20260502184500_init/migration.sql](/home/migue/Documentos/proyectos/github/Kinetik/prisma/migrations/20260502184500_init/migration.sql).

Comandos utiles:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npx prisma migrate deploy
npm run prisma:studio
```

## Deploy

En deploy:

- `postinstall` ejecuta `prisma generate`
- `prebuild` ejecuta `prisma migrate deploy`
- `build` ejecuta `next build`
- `postbuild` ejecuta el seed (ejercicios + usuario por defecto)

Esto asegura que el cliente Prisma exista, la base tenga las migraciones aplicadas y haya datos iniciales.

## CSV de rutina

La plantilla se descarga desde `/api/plan/template` y usa estas columnas:

`day_name,day_order,block_name,block_order,exercise_name,group_name,variant,planned_sets,planned_reps,notes`

Cada fila representa un ejercicio.
