import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentFormSchema, type AppointmentFormData } from '../../lib/schemas';

interface Patient {
  id: number;
  name: string;
  ownerId: number;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerAddress?: string;
}
interface Vet { id: string; name: string; role: string; }

export function AppointmentForm({ appointmentId }: { appointmentId?: number }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: { type: 'consulta' },
  });

  const selectedPatientId = watch('patientId');

  useEffect(() => {
    fetch('/api/patients').then((r) => r.json()).then(setPatients);
    fetch('/api/users?role=veterinario').then((r) => r.json()).then(setVets).catch(() => setVets([]));
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      const p = patients.find((p) => String(p.id) === selectedPatientId);
      if (p) {
        setValue('ownerId', String(p.ownerId));
        if (!appointmentId && p.ownerAddress) {
          setValue('visitAddress', p.ownerAddress);
        }
      }
    }
  }, [selectedPatientId, patients]);

  async function onSubmit(data: AppointmentFormData) {
    setLoading(true);
    setError('');
    const url = appointmentId ? `/api/appointments/${appointmentId}` : '/api/appointments';
    const method = appointmentId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error || 'Error al guardar'); setLoading(false); return; }
    window.location.href = `/citas/${json.id}`;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Paciente *</label>
          <select {...register('patientId')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Seleccionar paciente...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {p.ownerFirstName} {p.ownerLastName}</option>
            ))}
          </select>
          {errors.patientId && <p className="text-red-500 text-xs mt-1">{errors.patientId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tipo *</label>
          <select {...register('type')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="consulta">Consulta</option>
            <option value="vacunacion">Vacunación</option>
            <option value="cirugia">Cirugía</option>
            <option value="control">Control</option>
            <option value="emergencia">Emergencia</option>
            <option value="grooming">Grooming</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Veterinario *</label>
          <select {...register('veterinarianId')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Seleccionar...</option>
            {vets.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          {errors.veterinarianId && <p className="text-red-500 text-xs mt-1">{errors.veterinarianId.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fecha y hora inicio *</label>
          <input type="datetime-local" {...register('scheduledAt')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          {errors.scheduledAt && <p className="text-red-500 text-xs mt-1">{errors.scheduledAt.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fecha y hora fin *</label>
          <input type="datetime-local" {...register('endAt')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          {errors.endAt && <p className="text-red-500 text-xs mt-1">{errors.endAt.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Dirección de la visita</label>
          <input
            {...register('visitAddress')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Dirección donde se realizará la visita..."
          />
          <p className="text-xs text-muted-foreground mt-1">Se pre-llena con la dirección del dueño al seleccionar paciente.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Motivo</label>
          <input {...register('reason')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Motivo de la consulta..." />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Notas adicionales</label>
          <textarea {...register('notes')} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>

        <input type="hidden" {...register('ownerId')} />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {loading ? 'Guardando...' : appointmentId ? 'Actualizar Cita' : 'Programar Cita'}
        </button>
        <a href="/citas" className="px-6 py-2 rounded-lg text-sm font-medium border hover:bg-muted transition-colors">Cancelar</a>
      </div>
    </form>
  );
}
