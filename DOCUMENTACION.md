# Documentación del Sistema — Alma Veterinaria

Sistema de gestión para clínica veterinaria: pacientes, citas, historial médico,
recetas, laboratorio, inventario y facturación, con autenticación por roles.

---

## 1. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | **Astro 6** (SSR, `output: 'server'`) |
| UI | **React 19** (islas), Tailwind CSS 4, Recharts, lucide-react |
| Autenticación | **Better Auth 1.5** (email + contraseña, cookies firmadas) |
| ORM | **Drizzle ORM 0.45** |
| Base de datos | **PostgreSQL** (Supabase) — *migrado desde MySQL* |
| Validación | **Zod 4** |
| PDF | `@react-pdf/renderer` (facturas y recetas) |
| Recordatorios | WhatsApp clic-para-enviar (wa.me), sin proveedor externo |
| Hosting | **Vercel** (adaptador `@astrojs/vercel`) |

> Histórico: el proyecto nació sobre **MySQL + Railway + Docker**. Se migró a
> **PostgreSQL (Supabase) + Vercel**. Ver §7.

---

## 2. Estructura del proyecto

```
src/
├── components/        Componentes React por dominio
│   ├── admin/         Gestión de usuarios y horarios
│   ├── appointments/  Calendario, formulario y lista de citas
│   ├── billing/       Facturas y pagos
│   ├── dashboard/     Widgets (próxima cita, vacunas, facturas pendientes…)
│   ├── inventory/     Productos y movimientos de stock
│   ├── lab-orders/    Órdenes de laboratorio
│   ├── medical/       Historial clínico
│   ├── patients/      Pacientes y tutores
│   ├── prescriptions/ Recetas
│   ├── reports/       Gráficas de reportes
│   ├── layout/        Shell, header, sidebar
│   └── ui/            Primitivas (button, card, input, label)
├── db/
│   ├── index.ts       Cliente Drizzle (conexión Postgres)
│   ├── schema/        7 archivos de esquema (ver §4)
│   ├── seed.ts        Datos de demostración
│   ├── clean.ts       Limpieza de tablas
│   └── set-passwords.ts  Establece contraseñas a usuarios del seed
├── layouts/           Layouts Astro (Auth, Base, Dashboard)
├── lib/
│   ├── auth.ts        Configuración de Better Auth (servidor)
│   ├── auth-client.ts Cliente de Better Auth (navegador)
│   ├── permissions.ts Matriz de permisos por rol
│   ├── rateLimit.ts   Rate limiter en memoria
│   ├── schemas.ts     Esquemas Zod de validación
│   ├── whatsapp.ts    Enlaces wa.me para recordatorios de citas
│   ├── pdf/           Plantillas PDF de factura y receta
│   └── utils.ts       Utilidades (cn, formato)
├── middleware.ts      Auth + headers de seguridad + rate limit
├── pages/
│   ├── api/           Endpoints REST (ver §5)
│   └── *.astro        Páginas SSR (dashboard, pacientes, citas…)
└── styles/global.css  Tailwind + variables de tema (incluye modo oscuro)
```

---

## 3. Roles y permisos

Cuatro roles definidos en `src/lib/permissions.ts`:

| Recurso | admin | veterinario | recepcionista | cliente |
|---|---|---|---|---|
| Pacientes / Tutores | ✅ | ✅ | ✅ (escr.) | ❌ |
| Historial médico | ✅ | ✅ | ❌ | ❌ |
| Recetas | ✅ | ✅ | ❌ | solo propias |
| Laboratorio | ✅ | ✅ | ❌ | ❌ |
| Citas | ✅ | ✅ | ✅ | solo propias |
| Inventario | ✅ | lectura | lectura | ❌ |
| Facturación | ✅ | ❌ | ✅ | solo propias |
| Usuarios | ✅ | ❌ | ❌ | ❌ |

El `cliente` accede a un portal (`/api/client/portal`) que solo expone sus propios datos.

---

## 4. Modelo de datos

Esquemas en `src/db/schema/` (Drizzle, dialecto PostgreSQL):

- **users.ts** — `users`, `sessions`, `accounts`, `verifications` (tablas de Better Auth). `users.role` es enum: `admin | veterinario | recepcionista | cliente`.
- **patients.ts** — `owners` (tutores), `patients` (mascotas). Enums `species`, `sex`.
- **appointments.ts** — `appointments`, `veterinarian_schedules`. Enums `type`, `status`.
- **medical.ts** — `medical_records` (con `vital_signs` en JSON), `vaccines`.
- **prescriptions.ts** — `prescriptions`, `prescription_items`, `lab_orders`.
- **inventory.ts** — `products`, `stock_movements`. Enum `category`, `movement_type`.
- **billing.ts** — `invoices`, `invoice_items`, `payments`. Enums `invoice_status`, `payment_method`.

Relaciones clave: `patients → owners`; `appointments/medical_records/prescriptions/lab_orders → patients + users(veterinario)`; `invoices → owners + users(createdBy)`; `invoice_items → products`.

---

## 5. API (endpoints REST)

Todos bajo `/api/`, protegidos por el middleware (sesión obligatoria salvo `/api/auth`).

| Recurso | Rutas |
|---|---|
| Auth | `/api/auth/[...all]` (Better Auth) |
| Pacientes | `/api/patients`, `/api/patients/[id]` |
| Tutores | `/api/owners`, `/api/owners/[id]` |
| Citas | `/api/appointments`, `/api/appointments/[id]` |
| Historial | `/api/medical`, `/api/medical/[id]`, `/api/medical/vaccines` |
| Vacunas | `/api/vaccines`, `/api/vaccines/[id]`, `/api/vaccines/upcoming` |
| Recetas | `/api/prescriptions`, `/api/prescriptions/[id]`, `.../pdf` |
| Laboratorio | `/api/lab-orders`, `/api/lab-orders/[id]` |
| Inventario | `/api/inventory`, `/api/inventory/[id]`, `/api/inventory/stock` |
| Facturación | `/api/invoices`, `/api/invoices/[id]`, `.../pdf`, `/api/invoices/payment` |
| Reportes | `/api/reports`, `/api/dashboard/stats` |
| Usuarios | `/api/users`, `/api/users/[id]` (solo admin) |
| Horarios | `/api/schedules`, `/api/schedules/[id]` |
| Portal cliente | `/api/client/portal` |

Convenciones: `GET` lista/lee, `POST` crea (valida con Zod), `PUT` actualiza (valida con Zod), `DELETE` elimina con reglas de integridad (p.ej. no se borran registros médicos).

---

## 6. Seguridad (resumen)

Detalle completo en [SECURITY.md](SECURITY.md).

1. **Autenticación** — Better Auth, cookies `HttpOnly`/`SameSite`, verificación en middleware.
2. **Autorización** — chequeo de rol en cada endpoint; el `cliente` solo ve lo propio.
3. **Validación** — Zod en todos los `POST`/`PUT`.
4. **SQL** — Drizzle parametriza; sin concatenación de strings.
5. **Rate limiting** — login 10/min, escrituras 60/min por IP.
6. **Headers HTTP** — CSP, HSTS, X-Frame-Options, etc.

---

## 7. Despliegue (Vercel + Supabase)

### Variables de entorno (en Vercel)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena del **pooler de transacciones** de Supabase (puerto 6543, `?pgbouncer=true`). Usada por la app en runtime. |
| `DIRECT_URL` | Cadena **directa/sesión** de Supabase (puerto 5432). Usada por `drizzle-kit` para migraciones. |
| `BETTER_AUTH_SECRET` | Secreto aleatorio ≥ 32 chars (`openssl rand -base64 32`). |
| `BETTER_AUTH_URL` | URL pública HTTPS del despliegue (sin barra final). |

### Notas técnicas (verificadas con Context7)

- **Drizzle + Supabase serverless**: el cliente usa `postgres-js` con `{ prepare: false }`,
  obligatorio en el modo *Transaction* del pooler (puerto 6543).
- **Migraciones**: `drizzle-kit` usa `DIRECT_URL` (puerto 5432), porque las migraciones
  no funcionan a través del pooler de transacciones.
- **Adaptador**: `@astrojs/vercel` con `output: 'server'`.

### Pasos

```bash
# 1. Generar el esquema en la base de Supabase
npm run db:push          # usa DIRECT_URL

# 2. Cargar datos demo + contraseñas (opcional)
npm run db:seed
npx tsx src/db/set-passwords.ts   # contraseña por defecto: Vet2026!

# 3. Desplegar (Vercel detecta Astro automáticamente)
#    Configurar las variables de entorno en el panel de Vercel.
```

### Cuentas de prueba (tras seed + set-passwords)

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@vetclinic.com | Vet2026! |
| Veterinario | veterinario@vetclinic.com | Vet2026! |
| Recepcionista | recepcion@vetclinic.com | Vet2026! |
| Cliente | cliente@vetclinic.com | Vet2026! |

> ⚠️ Cambiar estas contraseñas antes de un uso real en producción.

---

## 8. Comandos

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo (`localhost:4321`) |
| `npm run build` | Build de producción |
| `npm run db:generate` | Genera migraciones SQL desde el esquema |
| `npm run db:push` | Aplica el esquema a la base de datos |
| `npm run db:studio` | Explorador de la base de datos |
| `npm run db:seed` | Carga datos de demostración |
| `npm run db:clean` | Vacía las tablas |
| `npm run test` | Ejecuta la suite de tests (Vitest) |
