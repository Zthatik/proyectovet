import {
  mysqlTable,
  varchar,
  int,
  text,
  boolean,
  timestamp,
  date,
  decimal,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core';
import { users } from './users';

export const productCategoryEnum = mysqlEnum('category', [
  'medicamento',
  'vacuna',
  'insumo',
  'alimento',
  'accesorio',
  'otro',
]);

export const products = mysqlTable('products', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  category: productCategoryEnum.notNull(),
  sku: varchar('sku', { length: 50 }).unique(),
  barcode: varchar('barcode', { length: 50 }),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
  stock: int('stock').notNull().default(0),
  minStock: int('min_stock').notNull().default(5),
  unit: varchar('unit', { length: 20 }).notNull().default('unidad'),
  expirationDate: date('expiration_date'),
  supplier: varchar('supplier', { length: 200 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

export const stockMovementTypeEnum = mysqlEnum('movement_type', [
  'entrada',
  'salida',
  'ajuste',
]);

export const stockMovements = mysqlTable('stock_movements', {
  id: int('id').primaryKey().autoincrement(),
  productId: int('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  type: stockMovementTypeEnum.notNull(),
  quantity: int('quantity').notNull(),
  reason: varchar('reason', { length: 255 }),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: int('reference_id'),
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
