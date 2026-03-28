import { useState, useEffect } from 'react';
import { Clock, MapPin, Navigation } from 'lucide-react';

interface Appointment {
  id: number;
  scheduledAt: string;
  type: string;
  status: string;
  visitAddress: string | null;
  patientName: string | null;
  patientSpecies: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerPhone: string | null;
}

const typeLabels: Record<string, string> = {
  consulta: 'Consulta', vacunacion: 'Vacunación', cirugia: 'Cirugía',
  control: 'Control', emergencia: 'Emergencia', grooming: 'Grooming',
  desparasitacion: 'Desparasitación',
};

const statusLabels: Record<string, string> = {
  programada: 'Programada', confirmada: 'Confirmada',
  en_camino: 'En camino', en_curso: 'En curso',
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Ahora';
  const totalMins = Math.floor(ms / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `en ${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `en ${hours}h ${mins}m`;
  return `en ${mins}m`;
}

export function NextAppointment() {
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((data) => {
        setAppt(data.nextAppointment);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!appt) return;
    function update() {
      const diff = new Date(appt!.scheduledAt).getTime() - Date.now();
      setCountdown(formatCountdown(diff));
    }
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [appt]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="h-5 w-40 rounded bg-muted animate-pulse mb-3" />
        <div className="h-20 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (!appt) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Próxima Cita</h3>
        </div>
        <p className="text-sm text-muted-foreground">No hay citas próximas programadas.</p>
      </div>
    );
  }

  const date = new Date(appt.scheduledAt);
  const mapsUrl = appt.visitAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appt.visitAddress + ', Talca, Chile')}`
    : null;

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Próxima Cita</h3>
        </div>
        <span className="text-sm font-bold text-primary">{countdown}</span>
      </div>

      <a href={`/citas/${appt.id}`} className="block border rounded-xl p-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold">
                {date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {typeLabels[appt.type] || appt.type}
              </span>
              <span className="text-xs text-muted-foreground">
                {statusLabels[appt.status] || appt.status}
              </span>
            </div>
            <p className="text-sm font-medium">
              {appt.patientName}
              {appt.patientSpecies && <span className="text-muted-foreground font-normal"> · {appt.patientSpecies}</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {appt.ownerFirstName} {appt.ownerLastName}
              {appt.ownerPhone && <span> · {appt.ownerPhone}</span>}
            </p>
            {appt.visitAddress && (
              <div className="flex items-center gap-1.5 mt-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{appt.visitAddress}</span>
              </div>
            )}
          </div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" /> Ir
            </a>
          )}
        </div>
      </a>
    </div>
  );
}
