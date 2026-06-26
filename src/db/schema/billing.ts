import {
  pgTable,
  varchar,
  integer,
  serial,
  text,
  timestamp,
  decimal,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { owners } from './patients';
import { products } from './inventory';

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'borrador',
  'emitida',
  'pagada',
  'parcial',
  'anulada',
]);

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 20 }).notNull().unique(),
  ownerId: integer('owner_id')
    .notNull()
    .references(() => owners.id),
  appointmentId: integer('appointment_id'),
  date: timestamp('date').notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  taxRate: decimal('tax_rate', { precision: 4, scale: 2 }).notNull().default('0.00'),
  taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  discount: decimal('discount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  status: invoiceStatusEnum('invoice_status').notNull().default('borrador'),
  notes: text('notes'),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  idxOwnerId: index('idx_invoices_owner').on(t.ownerId),
  idxDate: index('idx_invoices_date').on(t.date),
  idxStatus: index('idx_inv_status').on(t.status),
}));

export const invoiceItems = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id),
  description: varchar('description', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
});

export const paymentMethodEnum = pgEnum('payment_method', [
  'efectivo',
  'tarjeta',
  'transferencia',
  'otro',
]);

export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  invoiceId: integer('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  method: paymentMethodEnum('payment_method').notNull(),
  reference: varchar('reference', { length: 100 }),
  date: timestamp('date').notNull(),
  receivedBy: varchar('received_by', { length: 36 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type Payment = typeof payments.$inferSelect;
