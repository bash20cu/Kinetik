# Deploy en Vercel + Neon

## 1. Base de datos Neon

- Crea un proyecto en Neon.
- Copia la cadena `DATABASE_URL`.

## 2. Variables en Vercel

Configura estas variables de entorno:

- `DATABASE_URL`
- `SESSION_SECRET`
- `APP_URL`

Ejemplo:

```bash
APP_URL=https://tu-dominio.vercel.app
```

## 3. Comportamiento de la app

- Las tablas se crean automaticamente cuando la app hace su primera consulta.
- El login usa email + cookie de sesion.
- La plantilla CSV se descarga desde `/api/plan/template`.

## 4. Checklist rapido

- Confirmar que Neon permite conexiones desde Vercel.
- Definir un `SESSION_SECRET` largo y privado.
- Hacer primera importacion CSV para activar la rutina.

## Desarrollo local con Docker

Para desarrollo, puedes usar PostgreSQL local con el archivo [docker-compose.yml](/home/migue/Documentos/proyectos/github/Kinetik/docker-compose.yml):

```bash
docker compose up -d
```

Usa esta URL en `.env.local`:

```bash
DATABASE_URL=postgresql://kinetik:kinetik@localhost:5432/kinetik
```

Para detener la base:

```bash
docker compose down
```
