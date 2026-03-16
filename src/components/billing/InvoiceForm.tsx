import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Owner { id: number; firstName: string; lastName: string; }
interface Product { id: number; name: string; unitPrice: string; }
interface LineItem { description: string; productId?: number; quantity: number; unitPrice: number; }

export function InvoiceForm() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ownerId, setOwnerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [taxRate, setTaxRate] = useState('0');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/owners').then((r) => r.json()).then(setOwners);
    fetch('/api/inventory').then((r) => r.json()).then(setProducts);
  }, []);

  function addItem() { setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]); }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, field: keyof LineItem, value: any) {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: value };
    if (field === 'productId' && value) {
      const p = products.find((p) => p.id === Number(value));
      if (p) { updated[i].description = p.name; updated[i].unitPrice = parseFloat(p.unitPrice); }
    }
    setItems(updated);
  }

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const tax = subtotal * (parseFloat(taxRate) / 100);
  const total = subtotal + tax;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ownerId) { setError('Selecciona un cliente'); return; }
    if (items.some((it) => !it.description || it.quantity < 1)) { setError('Completa todos los items'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId: Number(ownerId), items, taxRate: parseFloat(taxRate), notes }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error || 'Error al guardar'); setLoading(false); return; }
    window.location.href = `/facturacion/${json.id}`;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">Cliente *</label>
        <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">Seleccionar cliente...</option>
          {owners.map((o) => <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>)}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Servicios / Productos</label>
          <button type="button" onClick={addItem}
            className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Agregar línea
          </button>
        </div>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Descripción</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground w-20">Cant.</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground w-28">Precio unit.</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground w-28">Subtotal</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <select
                        value={item.productId || ''}
                        onChange={(e) => updateItem(i, 'productId', e.target.value ? Number(e.target.value) : undefined)}
                        className="text-xs border rounded px-2 py-1 w-28 shrink-0">
                        <option value="">Producto...</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)}
                        placeholder="Descripción del servicio..."
                        className="flex-1 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                      className="w-full border rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" step="0.01" min="0" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full border rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-medium">
                    ₡{(item.quantity * item.unitPrice).toLocaleString('es-CR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-2">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-6 justify-end text-sm">
        <div className="space-y-2 w-56">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₡{subtotal.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">IVA (%)</span>
            <input type="number" min="0" max="100" step="0.1" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}
              className="w-16 border rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total</span>
            <span>₡{total.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notas</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {loading ? 'Guardando...' : 'Emitir Factura'}
        </button>
        <a href="/facturacion" className="px-6 py-2 rounded-lg text-sm font-medium border hover:bg-muted transition-colors">Cancelar</a>
      </div>
    </form>
  );
}
