import { useState, useEffect } from 'react';
import { AlertTriangle, Package } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  expirationDate: string | null;
  stock: number;
  category: string | null;
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function ExpiringProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((data) => setProducts(data.expiringProducts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="h-5 w-48 rounded bg-muted animate-pulse mb-3" />
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  const expired = products.filter((p) => p.expirationDate && getDaysUntil(p.expirationDate) < 0);
  const expiringSoon = products.filter((p) => p.expirationDate && getDaysUntil(p.expirationDate) >= 0);

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Vencimientos</h3>
        </div>
        {products.length > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${expired.length > 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
            {products.length} producto{products.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay productos por vencer en los próximos 30 días.</p>
      ) : (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {expired.map((p) => (
            <ProductRow key={p.id} product={p} variant="expired" />
          ))}
          {expiringSoon.map((p) => (
            <ProductRow key={p.id} product={p} variant="soon" />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({ product, variant }: { product: Product; variant: 'expired' | 'soon' }) {
  const days = product.expirationDate ? getDaysUntil(product.expirationDate) : 0;
  const isExpired = variant === 'expired';
  const border = isExpired ? 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900' : 'border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900';
  const dayText = isExpired
    ? `Venció hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}`
    : days === 0 ? 'Vence hoy' : `Vence en ${days} día${days !== 1 ? 's' : ''}`;

  return (
    <a
      href={`/inventario/${product.id}`}
      className={`flex items-center justify-between rounded-lg border px-3 py-2 hover:opacity-80 transition-opacity ${border}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{product.name}</p>
        <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {isExpired && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
        <span className={`text-xs font-medium ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
          {dayText}
        </span>
      </div>
    </a>
  );
}
