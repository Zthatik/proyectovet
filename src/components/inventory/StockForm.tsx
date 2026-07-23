import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface FormData { type: 'entrada' | 'salida' | 'ajuste' | 'consumo_interno'; quantity: string; reason: string; }

export function StockForm({ productId }: { productId: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: { type: 'entrada', quantity: '1' },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError('');
    const res = await fetch('/api/inventory/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, ...data, quantity: Number(data.quantity) }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || 'Error'); setError(json.error || 'Error'); setLoading(false); return; }
    toast.success('Movimiento de stock registrado');
    setTimeout(() => { window.location.href = `/inventario/${productId}`; }, 500);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">Tipo de movimiento</label>
        <select {...register('type')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="entrada">Entrada (agregar stock)</option>
          <option value="salida">Salida (reducir stock)</option>
          <option value="consumo_interno">Consumo interno (usado en la clínica)</option>
          <option value="ajuste">Ajuste</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cantidad</label>
        <input type="number" step="any" min="0.001" {...register('quantity')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <p className="text-xs text-muted-foreground mt-1">Admite decimales (ej. 1.5 ml).</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Motivo</label>
        <input {...register('reason')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Compra, uso en consulta, ajuste..." />
      </div>

      <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
        {loading ? 'Guardando...' : 'Registrar Movimiento'}
      </button>
    </form>
  );
}
