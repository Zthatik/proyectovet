# Evaluación de Impacto en Protección de Datos (EIPD) — Plantilla

**Sistema:** Alma Veterinaria (gestión de clínica veterinaria a domicilio)
**Normativa:** Ley 21.719 sobre Protección de Datos Personales (Chile) — plena vigencia 1 de diciembre de 2026
**Estado:** Borrador de trabajo — **requiere revisión de un abogado o asesor en protección de datos antes de considerarse válido**. Este documento no es asesoría legal; es un punto de partida basado en la arquitectura real del sistema.

---

## 1. Identificación del responsable del tratamiento

| Campo | Valor |
|---|---|
| Nombre de la clínica | Alma Veterinaria |
| Responsable del tratamiento | _(completar: nombre del veterinario/dueño del negocio)_ |
| Contacto | contacto@almaveterinaria.cl |
| Fecha de esta evaluación | _(completar)_ |
| Responsable de esta evaluación | _(completar)_ |

---

## 2. Descripción del tratamiento

### 2.1 ¿Qué datos se tratan?

Basado en el esquema real de la base de datos (`src/db/schema/`):

| Categoría de dato | Tablas | Ejemplos de campos |
|---|---|---|
| Identificación del tutor | `owners`, `users` | Nombre, email, teléfono, dirección, documento de identidad |
| **Datos de salud de la mascota** (categoría especialmente protegida) | `medical_records`, `vaccines`, `prescriptions`, `lab_orders` | Diagnóstico, tratamiento, signos vitales, vacunas aplicadas, resultados de laboratorio |
| Datos de la mascota (no de salud) | `patients` | Nombre, especie, raza, foto, microchip |
| Datos financieros | `invoices`, `payments` | Montos facturados, método de pago, historial de pagos |
| Datos de acceso/seguridad | `sessions`, `accounts`, `audit_logs` | Contraseñas (hash), sesiones activas, registro de acciones sensibles |

> **Nota importante:** aunque los datos de salud son de la *mascota* (no una persona natural), el registro clínico está indisolublemente ligado al *tutor* como titular de datos — el historial médico revela información sobre su mascota, sus hábitos de cuidado, su capacidad de pago, y su ubicación (visitas a domicilio). La Ley 21.719 trata estos datos con el mismo estándar exigente que los datos de salud humana cuando el tratamiento es realizado por "cualquier persona natural o jurídica que preste servicios de salud" — se recomienda tratarlos como categoría especial por precaución.

### 2.2 ¿Con qué finalidad?

- Gestión clínica de mascotas (historial, vacunas, recetas, exámenes).
- Agendamiento y recordatorio de citas a domicilio.
- Facturación y cobro de servicios.
- Comunicación con tutores (WhatsApp, email).

### 2.3 ¿Cuál es la base de licitud?

- Ejecución de un contrato/relación comercial (prestación del servicio veterinario contratado por el tutor).
- Consentimiento del tutor al registrarse en el portal (aceptación de términos — **verificar si existe hoy un checkbox de consentimiento explícito en `RegisterForm.tsx`; si no existe, agregarlo**).

### 2.4 ¿Quién accede a los datos?

| Rol | Acceso |
|---|---|
| Admin | Acceso total |
| Veterinario | Pacientes, historial médico, recetas, laboratorio, citas |
| Recepcionista | Pacientes, tutores, citas, facturación, inventario (lectura) |
| Tutor | Solo sus propios datos y los de sus mascotas (portal) |

Matriz completa en `src/lib/permissions.ts`.

### 2.5 ¿Se transfieren datos a terceros?

| Tercero | Dato compartido | Propósito |
|---|---|---|
| Proveedor de email (SMTP/Resend, pendiente de definir) | Nombre, email, datos de la cita | Envío de recordatorios |
| Mercado Pago (si se activa) | Nombre, monto de factura | Procesamiento de pago |
| Supabase (Estados Unidos/infraestructura cloud) | Todos los datos (alojamiento de la base de datos) | Hosting |
| Vercel | Todos los datos que pasan por la app (hosting) | Hosting/ejecución |

> Verificar si Supabase/Vercel tienen centros de datos en Chile o si hay transferencia internacional de datos — la Ley 21.719 exige garantías adicionales para transferencias fuera de Chile.

---

## 3. Necesidad y proporcionalidad

- [ ] ¿Se recolecta solo el dato mínimo necesario para el fin declarado? _(revisar campos opcionales vs. obligatorios en los formularios)_
- [ ] ¿Existe un plazo de conservación definido, o los datos se guardan indefinidamente? _(hoy: indefinido — no hay política de retención/purga)_
- [ ] ¿Los tutores pueden solicitar la eliminación de sus datos (derecho de supresión)? _(hoy: no hay flujo de "derecho al olvido" implementado)_
- [ ] ¿Los tutores pueden solicitar una copia de sus datos (derecho de acceso/portabilidad)? _(hoy: no implementado — se podría construir un endpoint de exportación)_

---

## 4. Identificación y evaluación de riesgos

| Riesgo | Probabilidad | Impacto | Nivel | Mitigación implementada | Mitigación pendiente |
|---|---|---|---|---|---|
| Acceso no autorizado a fichas clínicas por vulneración de cuenta | Media | Alto | **Alto** | Verificación de invitación por token (ya no auto-vinculación por email) | Autenticación de 2 factores para staff |
| Pérdida total de datos (sin backups) | Media | Alto | **Alto** | Script de respaldo manual (`npm run db:backup`) | Backups automáticos off-site o upgrade a Supabase Pro |
| Exposición vía API pública de Supabase (RLS deshabilitado) | Baja | Alto | **Medio-Alto** | — | Activar RLS con políticas (ver hallazgo de seguridad) |
| Filtración de datos de salud en tránsito | Baja | Alto | Medio | HTTPS forzado (Vercel), headers de seguridad (HSTS, CSP) | — |
| Acceso indebido de un empleado que ya no trabaja en la clínica | Media | Medio | Medio | Desactivación de cuenta cierra sesiones activas | Revisión periódica de cuentas activas |
| Uso de los datos por un proveedor externo (SMTP, pagos) fuera de lo acordado | Baja | Medio | Bajo-Medio | — | Firmar DPA (acuerdo de tratamiento de datos) con cada proveedor |

---

## 5. Medidas de mitigación (plan de acción)

1. **Corto plazo:** activar RLS en Supabase con políticas mínimas (ver hallazgo de seguridad — coordinar con el equipo técnico).
2. **Corto plazo:** definir política de retención de datos (¿cuánto tiempo se conserva la ficha de un tutor/mascota que ya no es cliente?).
3. **Mediano plazo:** agregar checkbox de consentimiento explícito + link a política de privacidad en el registro.
4. **Mediano plazo:** habilitar un flujo de solicitud de acceso/eliminación de datos para tutores (derecho ARCO).
5. **Mediano plazo:** firmar acuerdos de tratamiento de datos (DPA) con Supabase, Vercel, el proveedor de email y Mercado Pago si se usa.
6. **Continuo:** mantener la bitácora de auditoría (`audit_logs`) y revisarla periódicamente.

---

## 6. Registro de Actividades de Tratamiento (RAT) — resumen

| Actividad | Datos | Base legal | Plazo de conservación | Responsable |
|---|---|---|---|---|
| Gestión de fichas clínicas | Salud de mascota, datos del tutor | Ejecución de contrato | _(definir)_ | Alma Veterinaria |
| Facturación | Datos financieros | Obligación legal (tributaria) | 6 años (plazo tributario general en Chile — confirmar con contador) | Alma Veterinaria |
| Recordatorios de citas | Contacto (email/teléfono) | Consentimiento / interés legítimo | Mientras dure la relación | Alma Veterinaria |
| Cobro con link de pago | Nombre, monto | Ejecución de contrato | Según política de Mercado Pago | Alma Veterinaria + Mercado Pago |

---

## 7. Conclusión

- [ ] Riesgo residual aceptable tras aplicar las mitigaciones — **pendiente de firma del responsable**.
- [ ] Se requiere consulta previa a la Agencia de Protección de Datos Personales (si el riesgo residual sigue siendo alto tras mitigar).

**Firma del responsable:** _______________________  **Fecha:** _______________

---

*Este documento fue generado como punto de partida a partir de una auditoría técnica del sistema (julio 2026). Debe ser completado, validado y aprobado por el responsable del negocio y, idealmente, revisado por un profesional con conocimiento en la Ley 21.719 antes de su entrada en vigencia (1 de diciembre de 2026).*
