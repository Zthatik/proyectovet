# 🐾 Alma Veterinaria

Sistema de gestión para clínica veterinaria: pacientes, citas, historial médico,
recetas, laboratorio, inventario y facturación, con autenticación por roles.

**Stack:** Astro 6 (SSR) · React 19 · Tailwind 4 · Drizzle ORM · Better Auth · PostgreSQL (Supabase) · Vercel.

> 📚 Documentación completa del sistema en [DOCUMENTACION.md](DOCUMENTACION.md).
> 🔒 Modelo de seguridad en [SECURITY.md](SECURITY.md).

---

## Desarrollo local

```sh
npm install
cp .env.example .env      # y completa los valores (ver abajo)
npm run db:push           # crea el esquema en la base
npm run db:seed           # datos de demostración (opcional)
npx tsx src/db/set-passwords.ts   # contraseñas demo (Vet2026!)
npm run dev               # http://localhost:4321
```

### Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Pooler de transacciones de Supabase (puerto 6543, `?pgbouncer=true`). |
| `DIRECT_URL` | Conexión directa de Supabase (puerto 5432), para migraciones. |
| `BETTER_AUTH_SECRET` | Secreto aleatorio ≥ 32 chars (`openssl rand -base64 32`). |
| `BETTER_AUTH_URL` | URL pública HTTPS (sin barra final). |
| `SMTP_*` | (Opcional) correo para recordatorios. |

---

## Comandos

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run db:push` | Aplica el esquema a la base |
| `npm run db:generate` | Genera migraciones SQL |
| `npm run db:studio` | Explorador de la base |
| `npm run db:seed` | Datos de demostración |
| `npm run db:clean` | Vacía las tablas |
| `npm run test` | Tests (Vitest) |

---

## Despliegue (Vercel + Supabase)

1. Crear proyecto en [Supabase](https://supabase.com) (PostgreSQL).
2. Configurar `DATABASE_URL` y `DIRECT_URL` y ejecutar `npm run db:push`.
3. Importar el repo en [Vercel](https://vercel.com) (detecta Astro automáticamente).
4. Añadir las variables de entorno en Vercel y desplegar.

Detalle paso a paso en [DOCUMENTACION.md §7](DOCUMENTACION.md#7-despliegue-vercel--supabase).

---

## Cuentas de prueba (tras seed)

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@vetclinic.com | Vet2026! |
| Veterinario | veterinario@vetclinic.com | Vet2026! |
| Recepcionista | recepcion@vetclinic.com | Vet2026! |
| Cliente | cliente@vetclinic.com | Vet2026! |

> ⚠️ Cambiar estas contraseñas antes de un uso real.
