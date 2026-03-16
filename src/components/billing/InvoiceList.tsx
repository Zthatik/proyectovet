import { useState, useEffect } from 'react';
import { Plus, Receipt, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Invoice {
  id: number;
  invoiceNumber: string;
  date: string;
  total: string;
  status: string;
  ownerFirstName?: string;
  ownerLastName?: string;
}

const statusColors: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-600',
  emitida: 'bg-blue-100 text-blue-700',
  pagada: 'bg-green-100 text-green-700',
  parcial: 'bg-yellow-100 text-yellow-700',
  anulada: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  borrador: 'Borrador', emitida: 'Emitida', pagada: 'Pagada', parcial: 'Pago parcial', anulada: 'Anulada',
};

export function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchInvoices(); }, []);

  async function fetchInvoices() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error();
      setInvoices(await res.json());
    } catch {
      setError('No se pudieron cargar las facturas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a href="/facturacion/nueva"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Nueva Factura
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-red-500 mb-3">{error}</p>
          <button onClick={fetchInvoices} className="text-sm text-primary hover:underline">Reintentar</button>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No hay facturas registradas</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Número</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Cliente</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {format(new Date(inv.date), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">{inv.ownerFirstName} {inv.ownerLastName}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${parseFloat(inv.total).toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || 'bg-gray-100'}`}>
                      {statusLabels[inv.status] || inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/facturacion/${inv.id}`} className="flex items-center gap-1 text-primary hover:underline text-xs">
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
