import { useState, useEffect } from 'react';
import { Receipt } from 'lucide-react';

interface Invoice {
  id: number;
  invoiceNumber: string;
  total: string;
  status: string;
  date: string;
  ownerId: number;
  ownerFirstName: string | null;
  ownerLastName: string | null;
}

const statusLabels: Record<string, string> = {
  borrador: 'Borrador', emitida: 'Emitida', parcial: 'Parcial',
};

const statusColors: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  emitida: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  parcial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

function formatCurrency(val: string | number): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return num.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 });
}

export function PendingInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((data) => setInvoices(data.pendingInvoices || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="h-5 w-44 rounded bg-muted animate-pulse mb-3" />
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
        </div>
      </div>
    );
  }

  const totalPending = invoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0);

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Facturas Pendientes</h3>
        </div>
        {invoices.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
            {formatCurrency(totalPending)}
          </span>
        )}
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay facturas pendientes de cobro.</p>
      ) : (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {invoices.map((inv) => (
            <a
              key={inv.id}
              href={`/facturacion/${inv.id}`}
              className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {inv.invoiceNumber}
                  <span className="text-muted-foreground font-normal"> — {inv.ownerFirstName} {inv.ownerLastName}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(inv.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status] || ''}`}>
                  {statusLabels[inv.status] || inv.status}
                </span>
                <span className="text-sm font-semibold">{formatCurrency(inv.total)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
