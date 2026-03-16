import { useEffect, useState } from 'react';
import { Syringe, Phone, AlertTriangle, Clock, Calendar } from 'lucide-react';

interface VaccineReminder {
  id: number;
  vaccineName: string;
  nextDoseDate: string;
  patientId: number;
  patientName: string | null;
  patientSpecies: string | null;
  ownerId: number | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerPhone: string | null;
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function VaccineReminders() {
  const [reminders, setReminders] = useState<VaccineReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    setError(false);
    fetch('/api/vaccines/upcoming')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setReminders(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Syringe className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Recordatorios de Vacunas</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Syringe className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Recordatorios de Vacunas</h3>
        </div>
        <p className="text-sm text-red-500 mb-2">No se pudieron cargar los recordatorios.</p>
        <button onClick={load} className="text-sm text-primary hover:underline">Reintentar</button>
      </div>
    );
  }

  const overdue = reminders.filter((r) => getDaysUntil(r.nextDoseDate) < 0);
  const thisWeek = reminders.filter((r) => { const d = getDaysUntil(r.nextDoseDate); return d >= 0 && d <= 7; });
  const later = reminders.filter((r) => getDaysUntil(r.nextDoseDate) > 7);

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Syringe className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Recordatorios de Vacunas</h3>
        </div>
        {reminders.length > 0 && (
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
            {reminders.length} pendientes
          </span>
        )}
      </div>

      {reminders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay vacunas pendientes en los próximos 30 días.</p>
      ) : (
        <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
          {overdue.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 mb-2">
                <AlertTriangle className="h-3.5 w-3.5" /> Vencidas ({overdue.length})
              </div>
              <div className="space-y-1.5">
                {overdue.map((r) => (
                  <ReminderRow key={r.id} reminder={r} days={getDaysUntil(r.nextDoseDate)} variant="overdue" />
                ))}
              </div>
            </div>
          )}

          {thisWeek.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 mb-2">
                <Clock className="h-3.5 w-3.5" /> Esta semana ({thisWeek.length})
              </div>
              <div className="space-y-1.5">
                {thisWeek.map((r) => (
                  <ReminderRow key={r.id} reminder={r} days={getDaysUntil(r.nextDoseDate)} variant="soon" />
                ))}
              </div>
            </div>
          )}

          {later.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                <Calendar className="h-3.5 w-3.5" /> Este mes ({later.length})
              </div>
              <div className="space-y-1.5">
                {later.map((r) => (
                  <ReminderRow key={r.id} reminder={r} days={getDaysUntil(r.nextDoseDate)} variant="normal" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReminderRow({
  reminder, days, variant,
}: {
  reminder: VaccineReminder;
  days: number;
  variant: 'overdue' | 'soon' | 'normal';
}) {
  const border = variant === 'overdue' ? 'border-red-200 bg-red-50' : variant === 'soon' ? 'border-orange-200 bg-orange-50' : 'border bg-background';
  const dayText = days < 0 ? `Hace ${Math.abs(days)} días` : days === 0 ? 'Hoy' : `En ${days} días`;
  const dayColor = variant === 'overdue' ? 'text-red-600' : variant === 'soon' ? 'text-orange-600' : 'text-muted-foreground';

  return (
    <a
      href={`/pacientes/${reminder.patientId}`}
      className={`flex items-center justify-between rounded-lg border px-3 py-2 hover:opacity-80 transition-opacity ${border}`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{reminder.patientName} — {reminder.vaccineName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {reminder.ownerFirstName} {reminder.ownerLastName}
          </span>
          {reminder.ownerPhone && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" /> {reminder.ownerPhone}
            </span>
          )}
        </div>
      </div>
      <span className={`text-xs font-medium shrink-0 ml-2 ${dayColor}`}>{dayText}</span>
    </a>
  );
}
