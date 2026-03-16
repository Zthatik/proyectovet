import {
  mysqlTable,
  varchar,
  int,
  text,
  timestamp,
  datetime,
  decimal,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core';
import { users } from './users';
import { owners } from './patients';
import { products } from './inventory';

export const invoiceStatusEnum = mysqlEnum('invoice_status', [
  'borrador',
  'emitida',
  'pagada',
  'parcial',
  'anulada',
]);

export const invoices = mysqlTable('invoices', {
  id: int('id').primaryKey().autoincrement(),
  invoiceNumber: varchar('invoice_number', { length: 20 }).notNull().unique(),
  ownerId: int('owner_id')
    .notNull()
    .references(() => owners.id),
  appointmentId: int('appointment_id'),
  date: datetime('date').notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  taxRate: decimal('tax_rate', { precision: 4, scale: 2 }).notNull().default('0.00'),
  taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  discount: decimal('discount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  status: invoiceStatusEnum.notNull().default('borrador'),
  notes: text('notes'),
  createdBy: varchar('created_by', { length: 36 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (t) => ({
  idxOwnerId: index('idx_invoices_owner').on(t.ownerId),
  idxDate: index('idx_invoices_date').on(t.date),
  idxStatus: index('idx_inv_status').on(t.status),
}));

export const invoiceItems = mysqlTable('invoice_items', {
  id: int('id').primaryKey().autoincrement(),
  invoiceId: int('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  productId: int('product_id').references(() => products.id),
  description: varchar('description', { length: 255 }).notNull(),
  quantity: int('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
});

export const paymentMethodEnum = mysqlEnum('payment_method', [
  'efectivo',
  'tarjeta',
  'transferencia',
  'otro',
]);

export const payments = mysqlTable('payments', {
  id: int('id').primaryKey().autoincrement(),
  invoiceId: int('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  method: paymentMethodEnum.notNull(),
  reference: varchar('reference', { length: 100 }),
  date: datetime('date').notNull(),
  receivedBy: varchar('received_by', { length: 36 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type Payment = typeof payments.$inferSelect;
