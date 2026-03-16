import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { medicalRecordFormSchema, type MedicalRecordFormData } from '../../lib/schemas';

interface Patient { id: number; name: string; ownerFirstName?: string; ownerLastName?: string; }

export function MedicalRecordForm({ patientId, appointmentId }: { patientId?: number; appointmentId?: number }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordFormSchema),
    defaultValues: { patientId: patientId?.toString() || '' },
  });

  useEffect(() => {
    fetch('/api/patients').then((r) => r.json()).then(setPatients);
  }, []);

  async function onSubmit(data: MedicalRecordFormData) {
    setLoading(true);
    setError('');
    const vitalSigns: Record<string, number> = {};
    if (data.temperature) vitalSigns.temperature = parseFloat(data.temperature);
    if (data.heartRate) vitalSigns.heartRate = parseInt(data.heartRate);
    if (data.weight) vitalSigns.weight = parseFloat(data.weight);
    if (data.respiratoryRate) vitalSigns.respiratoryRate = parseInt(data.respiratoryRate);

    const res = await fetch('/api/medical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: Number(data.patientId),
        appointmentId: appointmentId || null,
        reason: data.reason,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        observations: data.observations,
        vitalSigns: Object.keys(vitalSigns).length > 0 ? vitalSigns : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) { setError(json.error || 'Error al guardar'); setLoading(false); return; }
    window.location.href = `/pacientes/${data.patientId}`;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-2xl">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <div>
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
        <label className="block text-sm font-medium mb-1">Motivo de consulta *</label>
        <input {...register('reason')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Signos vitales</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Temperatura (°C)</label>
            <input type="number" step="0.1" {...register('temperature')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">FC (lpm)</label>
            <input type="number" {...register('heartRate')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Peso (kg)</label>
            <input type="number" step="0.01" {...register('weight')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">FR (rpm)</label>
            <input type="number" {...register('respiratoryRate')} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Diagnóstico</label>
        <textarea {...register('diagnosis')} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tratamiento</label>
        <textarea {...register('treatment')} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Observaciones</label>
        <textarea {...register('observations')} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
          {loading ? 'Guardando...' : 'Guardar Consulta'}
        </button>
        <button type="button" onClick={() => history.back()} className="px-6 py-2 rounded-lg text-sm font-medium border hover:bg-muted transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  );
}
