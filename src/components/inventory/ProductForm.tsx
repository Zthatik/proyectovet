import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productFormSchema, type ProductFormData } from '../../lib/schemas';

export function ProductForm({ productId }: { productId?: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { category: 'medicamento', unit: 'unidad', stock: '0', minStock: '5' },
  });

  async function onSubmit(data: ProductFormData) {
    setLoading(true);
    setError('');
    const url = productId ? `/api/inventory/${productId}` : '/api/inventory';
    const method = productId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error || 'Error al guardar'); setLoading(false); return; }
    window.location.href = `/inventario/${json.id}`;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Nombre del producto *</label>
          <input {...register('name')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Categoría *</label>
          <select {...register('category')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="medicamento">Medicamento</option>
            <option value="vacuna">Vacuna</option>
            <option value="insumo">Insumo</option>
            <option value="alimento">Alimento</option>
            <option value="accesorio">Accesorio</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Unidad de medida</label>
          <input {...register('unit')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="unidad, ml, mg, kg..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">SKU</label>
          <input {...register('sku')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Código de barras</label>
          <input {...register('barcode')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Precio de venta ($) *</label>
          <input type="number" step="0.01" {...register('unitPrice')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          {errors.unitPrice && <p className="text-red-500 text-xs mt-1">{errors.unitPrice.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Precio de costo ($)</label>
          <input type="number" step="0.01" {...register('costPrice')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stock inicial</label>
          <input type="number" {...register('stock')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stock mínimo (alerta)</label>
          <input type="number" {...register('minStock')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fecha de vencimiento</label>
          <input type="date" {...register('expirationDate')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Proveedor</label>
          <input {...register('supplier')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea {...register('description')} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {loading ? 'Guardando...' : productId ? 'Actualizar Producto' : 'Registrar Producto'}
        </button>
        <a href="/inventario" className="px-6 py-2 rounded-lg text-sm font-medium border hover:bg-muted transition-colors">Cancelar</a>
      </div>
    </form>
  );
}
