import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { medicalRecords, vaccines } from '../../../db/schema/medical';
import { users } from '../../../db/schema/users';
import { patients } from '../../../db/schema/patients';
import { products, stockMovements } from '../../../db/schema/inventory';
import { eq, desc, inArray } from 'drizzle-orm';
import { medicalRecordCreateSchema, zodError, parseJsonBody } from '../../../lib/schemas';

const STAFF_ROLES = ['admin', 'veterinario', 'recepcionista'];

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (!STAFF_ROLES.includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403 });
  }

  const url = new URL(request.url);
  const patientId = url.searchParams.get('patientId');
  if (!patientId) return new Response(JSON.stringify({ error: 'patientId requerido' }), { status: 400 });

  const records = await db
    .select({
      id: medicalRecords.id,
      date: medicalRecords.date,
      reason: medicalRecords.reason,
      diagnosis: medicalRecords.diagnosis,
      treatment: medicalRecords.treatment,
      observations: medicalRecords.observations,
      vitalSigns: medicalRecords.vitalSigns,
      veterinarianId: medicalRecords.veterinarianId,
      veterinarianName: users.name,
    })
    .from(medicalRecords)
    .leftJoin(users, eq(medicalRecords.veterinarianId, users.id))
    .where(eq(medicalRecords.patientId, Number(patientId)))
    .orderBy(desc(medicalRecords.date));

  return new Response(JSON.stringify(records), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  if (user.role !== 'admin' && user.role !== 'veterinario') {
    return new Response(JSON.stringify({ error: 'Sin permiso' }), { status: 403 });
  }

  const parsed = await parseJsonBody(request);
  if ('error' in parsed) return parsed.error;
  const result_ = medicalRecordCreateSchema.safeParse(parsed.data);
  if (!result_.success) return zodError(result_.error);
  const { patientId, appointmentId, date, reason, diagnosis, treatment, observations, vitalSigns, suppliesUsed } = result_.data;

  // Valida stock disponible ANTES de crear nada, para no dejar un registro
  // médico a medio guardar si algún insumo no alcanza.
  if (suppliesUsed && suppliesUsed.length > 0) {
    const productIds = suppliesUsed.map((s) => s.productId);
    const found = await db.select({ id: products.id, name: products.name, stock: products.stock, unit: products.unit })
      .from(products).where(inArray(products.id, productIds));
    const byId = new Map(found.map((p) => [p.id, p]));

    for (const supply of suppliesUsed) {
      const product = byId.get(supply.productId);
      if (!product) {
        return new Response(JSON.stringify({ error: `Insumo con ID ${supply.productId} no encontrado` }), { status: 404 });
      }
      if (parseFloat(product.stock) < supply.quantity) {
        return new Response(
          JSON.stringify({ error: `Stock insuficiente de "${product.name}": quedan ${product.stock} ${product.unit}, se intentó usar ${supply.quantity}` }),
          { status: 400 },
        );
      }
    }
  }

  const newRecord = await db.transaction(async (tx) => {
    const [record] = await tx.insert(medicalRecords).values({
      patientId,
      veterinarianId: user.id,
      appointmentId: appointmentId ?? null,
      date: date ? new Date(date) : new Date(),
      reason, diagnosis, treatment, observations,
      vitalSigns: vitalSigns ?? null,
    }).returning();

    if (suppliesUsed && suppliesUsed.length > 0) {
      for (const supply of suppliesUsed) {
        const [product] = await tx.select({ stock: products.stock }).from(products).where(eq(products.id, supply.productId));
        const newStock = parseFloat(product.stock) - supply.quantity;
        await tx.update(products).set({ stock: String(newStock) }).where(eq(products.id, supply.productId));
        await tx.insert(stockMovements).values({
          productId: supply.productId,
          type: 'consumo_interno',
          quantity: String(supply.quantity),
          reason: `Consulta: ${reason}`,
          referenceType: 'medical_record',
          referenceId: record.id,
          userId: user.id,
        });
      }
    }

    return record;
  });

  return new Response(JSON.stringify(newRecord), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
