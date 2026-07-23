import { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogCloseButton } from '../ui/dialog';
import { Button } from '../ui/button';

interface CoOwner {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
}

export function CoOwnersSection({ patientId, canEdit }: { patientId: number; canEdit: boolean }) {
  const [coOwners, setCoOwners] = useState<CoOwner[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CoOwner[]>([]);
  const [adding, setAdding] = useState<number | null>(null);

  function load() {
    fetch(`/api/patients/${patientId}/co-owners`).then((r) => r.json()).then(setCoOwners);
  }

  useEffect(() => { load(); }, [patientId]);

  useEffect(() => {
    if (!open || !search.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/owners?search=${encodeURIComponent(search)}`).then((r) => r.json()).then(setResults);
    }, 250);
    return () => clearTimeout(t);
  }, [search, open]);

  async function addCoOwner(ownerId: number) {
    setAdding(ownerId);
    try {
      const res = await fetch(`/api/patients/${patientId}/co-owners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'No se pudo agregar'); return; }
      toast.success('Co-tutor agregado');
      setOpen(false);
      setSearch('');
      load();
    } finally {
      setAdding(null);
    }
  }

  async function removeCoOwner(ownerId: number) {
    if (!confirm('¿Quitar a este co-tutor? Perderá acceso a la mascota desde su portal.')) return;
    await fetch(`/api/patients/${patientId}/co-owners`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId }),
    });
    setCoOwners((prev) => prev.filter((o) => o.id !== ownerId));
  }

  if (coOwners.length === 0 && !canEdit) return null;

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Co-tutores
        </h3>
        {canEdit && (
          <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Agregar
          </button>
        )}
      </div>

      {coOwners.length === 0 ? (
        <p className="text-sm text-muted-foreground">Solo el tutor principal tiene acceso a esta mascota.</p>
      ) : (
        <ul className="space-y-2">
          {coOwners.map((o) => (
            <li key={o.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
              <div>
                <p className="font-medium">{o.firstName} {o.lastName}</p>
                {o.phone && <p className="text-xs text-muted-foreground">{o.phone}</p>}
              </div>
              {canEdit && (
                <button onClick={() => removeCoOwner(o.id)} className="text-muted-foreground hover:text-destructive transition-colors" title="Quitar">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <div><DialogTitle>Agregar co-tutor</DialogTitle></div>
          <DialogCloseButton onClose={() => setOpen(false)} />
        </DialogHeader>
        <DialogContent>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tutor por nombre, email o teléfono..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {results.filter((r) => !coOwners.some((c) => c.id === r.id)).map((r) => (
              <button
                key={r.id}
                onClick={() => addCoOwner(r.id)}
                disabled={adding === r.id}
                className="w-full text-left flex items-center justify-between border rounded-lg px-3 py-2 text-sm hover:bg-muted/40 transition-colors disabled:opacity-60"
              >
                <span>{r.firstName} {r.lastName}</span>
                <span className="text-xs text-primary">{adding === r.id ? 'Agregando...' : 'Agregar'}</span>
              </button>
            ))}
            {search.trim() && results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sin resultados.</p>
            )}
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
