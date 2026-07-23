import {
  pgTable,
  varchar,
  integer,
  serial,
  text,
  boolean,
  timestamp,
  date,
  decimal,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const productCategoryEnum = pgEnum('category', [
  'medicamento',
  'vacuna',
  'insumo',
  'alimento',
  'accesorio',
  'otro',
]);

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  category: productCategoryEnum('category').notNull(),
  sku: varchar('sku', { length: 50 }).unique(),
  barcode: varchar('barcode', { length: 50 }),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  // Decimal (no entero): permite registrar consumo fraccionario, ej. 1 ml
  // de un frasco de 100 ml usado en una consulta.
  stock: decimal('stock', { precision: 12, scale: 3 }).notNull().default('0'),
  minStock: decimal('min_stock', { precision: 12, scale: 3 }).notNull().default('5'),
  unit: varchar('unit', { length: 20 }).notNull().default('unidad'),
  expirationDate: date('expiration_date'),
  supplier: varchar('supplier', { length: 200 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (t) => ({
  idxActive: index('idx_products_active').on(t.isActive),
  idxExpiration: index('idx_products_expiration').on(t.expirationDate),
}));

export const stockMovementTypeEnum = pgEnum('movement_type', [
  'entrada',
  'salida',
  'ajuste',
  // Consumo propio de la clínica (ej. medicamento usado durante una
  // consulta), a diferencia de "salida" que hoy se usa para ventas/retiros.
  'consumo_interno',
]);

export const stockMovements = pgTable('stock_movements', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  type: stockMovementTypeEnum('movement_type').notNull(),
  quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
  reason: varchar('reason', { length: 255 }),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: integer('reference_id'),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => ({
  idxProductId: index('idx_stock_movements_product').on(t.productId),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type StockMovement = typeof stockMovements.$inferSelect;
