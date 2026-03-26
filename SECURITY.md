# Seguridad — Alma Veterinaria

Documento de referencia para el modelo de seguridad de la aplicación.

---

## Capas de protección

### 1. Autenticación

- **Better Auth** gestiona sesiones mediante cookies firmadas (`HttpOnly`, `SameSite=Strict`).
- El middleware de Astro (`src/middleware.ts`) verifica la sesión en cada request a `/dashboard/**` y `/api/**`.
- Sin sesión válida → redirección a `/login` (páginas) o respuesta `401` (API).

### 2. Autorización por rol

Cuatro roles: `admin`, `veterinario`, `recepcionista`, `cliente`.

| Recurso | admin | veterinario | recepcionista | cliente |
|---|---|---|---|---|
| Pacientes / Tutores | ✅ | ✅ | ✅ | ❌ |
| Historial médico | ✅ | ✅ | ❌ | ❌ |
| Citas | ✅ | ✅ | ✅ | solo propias |
| Inventario | ✅ | lectura | lectura | ❌ |
| Facturación | ✅ | ❌ | ✅ | solo propias |
| Usuarios | ✅ | ❌ | ❌ | ❌ |

Los endpoints `GET /api/patients`, `GET /api/owners`, `GET /api/invoices`, `GET /api/medical` rechazan clientes con `403`.

### 3. Validación de entradas (Zod)

Todos los endpoints `POST` y `PUT` validan el body con esquemas Zod (`src/lib/schemas.ts`):

- **`parseJsonBody`** — rechaza bodies no-JSON con `400` (evita `500` por JSON malformado).
- **Enums estrictos** — `species`, `sex`, `status`, `type`, `role` solo aceptan valores conocidos.
- **Límites de longitud** — `name` ≤ 100, `reason` ≤ 500, `results` ≤ 2000, `search` ≤ 100 caracteres.
- **Foto base64** — máximo 700.000 caracteres; debe comenzar con `data:image/`.
- **Precios y cantidades** — `z.coerce.number()` con validación positiva.
- **Descuento** — el total de una factura no puede ser negativo.

### 4. ORM con consultas parametrizadas

Drizzle ORM genera consultas preparadas. No hay concatenación de strings SQL → no hay inyección SQL.

### 5. Rate limiting

Rate limiting en memoria (`src/lib/rateLimit.ts`):

| Contexto | Límite | Ventana |
|---|---|---|
| Login / registro (`/api/auth/**`) | 10 requests | 60 segundos |
| Escritura (`POST`, `PUT`, `DELETE`, `PATCH`) | 60 requests por IP | 60 segundos |

La IP se extrae de `x-forwarded-for` o `cf-connecting-ip` (Railway / Cloudflare).

### 6. Headers de seguridad HTTP

Añadidos por el middleware en cada respuesta:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;
  font-src 'self'; connect-src 'self'; frame-ancestors 'none'
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

> `'unsafe-inline'` es necesario para la hidratación de Astro/React. `data: blob:` habilita fotos base64 de pacientes.

---

## Checklist de deploy en Railway

- [ ] Variables de entorno configuradas: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- [ ] `BETTER_AUTH_URL` apunta al dominio HTTPS de producción (Railway genera un dominio automáticamente)
- [ ] `NODE_ENV=production`
- [ ] El dominio usa HTTPS (Railway lo provee automáticamente) — HSTS activado
- [ ] Verificar headers con `curl -I https://almaveterinaria.up.railway.app/login`

### Verificación manual de headers

```bash
curl -I https://almaveterinaria.up.railway.app/login
```

Debe incluir:
```
x-frame-options: DENY
x-content-type-options: nosniff
content-security-policy: default-src 'self'; ...
strict-transport-security: max-age=31536000; includeSubDomains
```

### Verificación de rate limiting

```bash
# Debe retornar 429 en la 61ª solicitud de escritura
for i in $(seq 1 65); do
  curl -s -o /dev/null -w "%{http_code}\n" -X PUT \
    https://almaveterinaria.up.railway.app/api/patients/1 \
    -H "Content-Type: application/json" \
    -d '{"name":"test"}'
done
```

### Verificación de validación PUT

```bash
# Debe retornar 400 (no 500)
curl -X PUT https://almaveterinaria.up.railway.app/api/patients/1 \
  -H "Content-Type: text/plain" -d "invalid"

# Debe retornar 400 por enum inválido
curl -X PUT https://almaveterinaria.up.railway.app/api/appointments/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"hacked"}'
```

---

## Suite de tests

```bash
npm run test           # ejecutar todos los tests
npm run test:coverage  # con reporte de cobertura
```

### Archivos de test

| Archivo | Qué cubre |
|---|---|
| `src/lib/schemas.test.ts` | 60+ casos: validación Zod de todos los schemas |
| `src/lib/permissions.test.ts` | Matriz de permisos por rol |
| `src/lib/rateLimit.test.ts` | Rate limiter: allow / block / reset por ventana |
| `src/pages/api/__tests__/auth.test.ts` | 401 sin auth en todos los endpoints |
| `src/pages/api/__tests__/roles.test.ts` | 403 para rol `cliente` en endpoints de staff |
| `src/pages/api/__tests__/put-validation.test.ts` | 400 por enum inválido, JSON malformado, foto >700KB |

---

## Historial de cambios de seguridad

| Fecha | Cambio |
|---|---|
| 2026-03-25 | Añadidos headers CSP y HSTS en middleware |
| 2026-03-25 | Rate limiting extendido a todos los métodos de escritura (POST/PUT/DELETE/PATCH) |
| 2026-03-25 | Fix `status as any` en `GET /api/appointments` → validación explícita del enum |
| 2026-03-25 | Validación Zod en los 8 endpoints PUT (antes sin validación) |
| 2026-03-25 | `parseJsonBody` helper — previene 500 por JSON malformado |
| 2026-03-25 | Validación de foto base64: máximo 700KB, prefijo `data:image/` obligatorio |
| 2026-03-25 | Fix total negativo en facturas (descuento > subtotal) |
| 2026-03-25 | Límite de 100 chars en parámetro `search` (prevención DoS) |
| 2026-03-25 | Suite de tests de seguridad: 126 tests en 6 archivos |
| 2026-03-25 | Registros médicos y vacunas protegidos contra eliminación (integridad clínica) |
| 2026-03-25 | DELETE de tutores bloqueado si tienen pacientes (previene cascade destructivo) |
| 2026-03-25 | Transacción atómica en movimientos de stock (stock + registro) |
| 2026-03-25 | Role checks en 5 POST endpoints que solo verificaban autenticación |
| 2026-03-25 | Toast notifications (sonner) en todos los formularios |
| 2026-03-25 | Confirmación obligatoria para cancelar citas y enviar recordatorios masivos |
