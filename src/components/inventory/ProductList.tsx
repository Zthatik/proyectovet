import { useState, useEffect } from 'react';
import { Search, Plus, Package, Eye, AlertTriangle } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
  sku?: string;
  unitPrice: string;
  stock: number;
  minStock: number;
  unit: string;
  isActive: boolean;
}

const categoryLabels: Record<string, string> = {
  medicamento: 'Medicamento', vacuna: 'Vacuna', insumo: 'Insumo',
  alimento: 'Alimento', accesorio: 'Accesorio', otro: 'Otro',
};

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchProducts(); }, [search, category, lowStock]);

  async function fetchProducts() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (lowStock) params.set('lowStock', 'true');
      const res = await fetch(`/api/inventory?${params}`);
      if (!res.ok) throw new Error();
      setProducts(await res.json());
    } catch {
      setError('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar producto o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">Todas las categorías</option>
          {Object.entries(categoryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} className="rounded" />
          Stock bajo
        </label>
        <a href="/inventario/nuevo"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Nuevo Producto
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-red-500 mb-3">{error}</p>
          <button onClick={fetchProducts} className="text-sm text-primary hover:underline">Reintentar</button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No se encontraron productos</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Categoría</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">SKU</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Precio</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{categoryLabels[p.category] || p.category}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden lg:table-cell">{p.sku || '—'}</td>
                  <td className="px-4 py-3 text-right">₡{parseFloat(p.unitPrice).toLocaleString('es-CR')}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-1 font-medium ${p.stock <= p.minStock ? 'text-red-600' : 'text-green-700'}`}>
                      {p.stock <= p.minStock && <AlertTriangle className="h-3.5 w-3.5" />}
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/inventario/${p.id}`} className="flex items-center gap-1 text-primary hover:underline text-xs">
                      <Eye className="h-3.5 w-3.5" /> Ver
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
