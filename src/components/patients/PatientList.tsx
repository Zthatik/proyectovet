import { useState, useEffect } from 'react';
import { Search, Plus, PawPrint, Eye } from 'lucide-react';

interface Patient {
  id: number;
  name: string;
  species: string;
  breed?: string;
  sex: string;
  weight?: string;
  isActive: boolean;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerPhone?: string;
}

export function PatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [search]);

  async function fetchPatients() {
    setLoading(true);
    setError('');
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/patients${params}`);
      if (!res.ok) throw new Error('Error al cargar pacientes');
      setPatients(await res.json());
    } catch {
      setError('No se pudieron cargar los pacientes');
    } finally {
      setLoading(false);
    }
  }

  const speciesIcon: Record<string, string> = {
    perro: '🐕', gato: '🐈', ave: '🐦', reptil: '🦎', roedor: '🐭', otro: '🐾',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar paciente o raza..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar paciente"
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <a
          href="/pacientes/nuevo"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Paciente
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-red-500 mb-3">{error}</p>
          <button onClick={fetchPatients} className="text-sm text-primary hover:underline">Reintentar</button>
        </div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <PawPrint className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No se encontraron pacientes</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Lista de pacientes</caption>
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Paciente</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Especie / Raza</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tutor</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Teléfono</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <span className="mr-2">{speciesIcon[p.species] || '🐾'}</span>
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize hidden sm:table-cell">
                    {p.species}{p.breed ? ` · ${p.breed}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    {p.ownerFirstName} {p.ownerLastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.ownerPhone || '—'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {p.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/pacientes/${p.id}`}
                      className="flex items-center gap-1 text-primary hover:underline text-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver
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
