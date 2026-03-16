import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface FormData { amount: string; method: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro'; reference: string; }

export function PaymentForm({ invoiceId, total }: { invoiceId: number; total: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit } = useForm<FormData>({
    defaultValues: { amount: String(total), method: 'efectivo' },
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError('');
    const res = await fetch('/api/invoices/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, ...data, amount: parseFloat(data.amount) }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error || 'Error'); setLoading(false); return; }
    window.location.href = `/facturacion/${invoiceId}`;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">Monto recibido ($)</label>
        <input type="number" step="0.01" {...register('amount')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Método de pago</label>
        <select {...register('method')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Referencia (opcional)</label>
        <input {...register('reference')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Número de transacción..." />
      </div>

      <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
        {loading ? 'Procesando...' : 'Confirmar Pago'}
      </button>
    </form>
  );
}
