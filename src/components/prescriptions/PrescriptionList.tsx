import { useState, useEffect } from 'react';
import { Plus, FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Prescription {
  id: number;
  date: string;
  status: string;
  patientName?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  veterinarianName?: string;
}

const statusColors: Record<string, string> = {
  activa: 'bg-green-100 text-green-700',
  completada: 'bg-gray-100 text-gray-600',
  cancelada: 'bg-red-100 text-red-700',
};

export function PrescriptionList() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/prescriptions');
      if (!res.ok) throw new Error();
      setPrescriptions(await res.json());
    } catch {
      setError('No se pudieron cargar las recetas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <a href="/recetas/nueva"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Nueva Receta
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-red-500 mb-3">{error}</p>
          <button onClick={fetchData} className="text-sm text-primary hover:underline">Reintentar</button>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No hay recetas registradas</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Paciente</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Tutor</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Veterinario</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {prescriptions.map((rx) => (
                <tr key={rx.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">
                    {format(new Date(rx.date), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3 font-medium">{rx.patientName || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{rx.ownerFirstName} {rx.ownerLastName}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{rx.veterinarianName || '—'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[rx.status] || 'bg-gray-100'}`}>
                      {rx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/recetas/${rx.id}`} className="flex items-center gap-1 text-primary hover:underline text-xs">
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
