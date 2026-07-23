import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogCloseButton } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface Props {
  phone: string | null;
  address: string | null;
  onSaved: () => void;
}

export function EditContactDialog({ phone, address, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ phone: phone ?? '', address: address ?? '' });

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error || 'No se pudo guardar');
        return;
      }
      toast.success('Datos actualizados');
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
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Pencil className="h-3 w-3" /> Editar
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <div>
            <DialogTitle>Editar datos de contacto</DialogTitle>
          </div>
          <DialogCloseButton onClose={() => setOpen(false)} />
        </DialogHeader>
        <DialogContent>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+56 9 1234 5678" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Calle, número, comuna" />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
