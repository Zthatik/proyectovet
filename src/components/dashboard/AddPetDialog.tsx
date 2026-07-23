import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogCloseButton } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';

const EMPTY_FORM = {
  name: '', species: 'perro', sex: 'desconocido', breed: '', color: '', dateOfBirth: '', weight: '', notes: '',
};

export function AddPetDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  async function save() {
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/client/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, weight: form.weight || undefined, dateOfBirth: form.dateOfBirth || undefined }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error || 'No se pudo registrar la mascota');
        return;
      }
      toast.success('Mascota registrada correctamente');
      setForm(EMPTY_FORM);
      setOpen(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        <Plus className="h-3.5 w-3.5" /> Agregar mascota
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <div>
            <DialogTitle>Registrar nueva mascota</DialogTitle>
          </div>
          <DialogCloseButton onClose={() => setOpen(false)} />
        </DialogHeader>
        <DialogContent>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pet-name">Nombre *</Label>
              <Input id="pet-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Rocky" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pet-species">Especie</Label>
                <Select id="pet-species" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}>
                  <option value="perro">Perro</option>
                  <option value="gato">Gato</option>
                  <option value="ave">Ave</option>
                  <option value="conejo">Conejo</option>
                  <option value="reptil">Reptil</option>
                  <option value="roedor">Roedor</option>
                  <option value="otro">Otro</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pet-sex">Sexo</Label>
                <Select id="pet-sex" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                  <option value="desconocido">No sé / prefiero no decir</option>
                  <option value="macho">Macho</option>
                  <option value="hembra">Hembra</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pet-breed">Raza</Label>
                <Input id="pet-breed" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pet-color">Color</Label>
                <Input id="pet-color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pet-dob">Nacimiento (aprox.)</Label>
                <Input id="pet-dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pet-weight">Peso (kg)</Label>
                <Input id="pet-weight" type="number" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Registrar mascota'}</Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
