import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, PawPrint, Stethoscope, FileText, MapPin, CalendarDays, X } from 'lucide-react';

interface Appointment {
  id: number;
  scheduledAt: string;
  endAt: string;
  type: string;
  status: string;
  reason: string | null;
  notes: string | null;
  visitAddress: string | null;
  patientName: string | null;
  patientSpecies: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  veterinarianName: string | null;
}

const STATUS_CONFIG: Record<string, { bg: string; border: string; text: string; accent: string; dot: string }> = {
  programada: { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-900',  accent: 'bg-blue-500',  dot: 'bg-blue-500'  },
  confirmada: { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-900', accent: 'bg-green-500', dot: 'bg-green-500' },
  en_camino:  { bg: 'bg-purple-50', border: 'border-purple-200',text: 'text-purple-900',accent: 'bg-purple-500',dot: 'bg-purple-500'},
  en_curso:   { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-900', accent: 'bg-amber-500', dot: 'bg-amber-500' },
  completada: { bg: 'bg-gray-50',   border: 'border-gray-200',  text: 'text-gray-600',  accent: 'bg-gray-400',  dot: 'bg-gray-400'  },
  cancelada:  { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-800',   accent: 'bg-red-400',   dot: 'bg-red-400'   },
};

const STATUS_LABEL: Record<string, string> = {
  programada: 'Programada', confirmada: 'Confirmada', en_camino: 'En camino',
  en_curso: 'En curso', completada: 'Completada', cancelada: 'Cancelada',
};

const TYPE_LABEL: Record<string, string> = {
  consulta: 'Consulta', vacunacion: 'Vacunación', cirugia: 'Cirugía',
  control: 'Control', emergencia: 'Emergencia', desparasitacion: 'Desparasitación',
};

const TYPE_EMOJI: Record<string, string> = {
  consulta: '🩺', vacunacion: '💉', cirugia: '🔬',
  control: '📋', emergencia: '🚨', desparasitacion: '🐛',
};

const DAYS_SHORT  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const GRID_START = 7 * 60;
const GRID_END   = 21 * 60;
const GRID_RANGE = GRID_END - GRID_START;
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

function timeToMinutes(d: Date) { return d.getHours() * 60 + d.getMinutes(); }
function fmt(d: Date) { return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, n: number): Date { const d = new Date(date); d.setDate(d.getDate() + n); return d; }

export function AppointmentCalendar() {
  const [weekStart, setWeekStart]     = useState<Date>(() => getWeekStart(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<Appointment | null>(null);
  const [nowPct, setNowPct]           = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchWeek(); }, [weekStart]);

  useEffect(() => {
    function updateNow() {
      const now = new Date();
      const min = timeToMinutes(now);
      if (min >= GRID_START && min <= GRID_END) {
        setNowPct(((min - GRID_START) / GRID_RANGE) * 100);
      } else {
        setNowPct(null);
      }
    }
    updateNow();
    const id = setInterval(updateNow, 60_000);
    return () => clearInterval(id);
  }, []);

  async function fetchWeek() {
    setLoading(true);
    const from = weekStart.toISOString();
    const to   = addDays(weekStart, 7).toISOString();
    const res  = await fetch(`/api/appointments?from=${from}&to=${to}`);
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }

  function getAppointmentsForDay(dayIdx: number): Appointment[] {
    const dayDate = addDays(weekStart, dayIdx);
    return appointments.filter(a => {
      const d = new Date(a.scheduledAt);
      return d.getFullYear() === dayDate.getFullYear() &&
             d.getMonth()     === dayDate.getMonth() &&
             d.getDate()      === dayDate.getDate();
    });
  }

  function blockStyle(a: Appointment) {
    const startMin = Math.max(timeToMinutes(new Date(a.scheduledAt)), GRID_START) - GRID_START;
    const endMin   = Math.min(timeToMinutes(new Date(a.endAt)),   GRID_END)   - GRID_START;
    const top    = (startMin / GRID_RANGE) * 100;
    const height = Math.max(((endMin - startMin) / GRID_RANGE) * 100, 1.8);
    return { top: `${top}%`, height: `${height}%` };
  }

  const today        = new Date();
  const isCurrentWeek = getWeekStart(today).getTime() === weekStart.getTime();
  const monthLabel   = weekStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-3">
      {/* ── Navigation bar ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekStart(d => addDays(d, -7))}
            className="p-2 rounded-lg hover:bg-muted transition-colors border border-border/60"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setWeekStart(d => addDays(d, 7))}
            className="p-2 rounded-lg hover:bg-muted transition-colors border border-border/60"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <span className="text-base font-semibold capitalize">{monthLabel}</span>

        {!isCurrentWeek && (
          <button
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted transition-colors"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Hoy
          </button>
        )}

        {loading && (
          <span className="ml-auto text-xs text-muted-foreground animate-pulse">Cargando…</span>
        )}
      </div>

      {/* ── Calendar grid ──────────────────────────────────── */}
      <div className="rounded-xl border border-border/60 overflow-hidden shadow-sm">

        {/* Day headers */}
        <div className="grid grid-cols-8 bg-muted/40 border-b border-border/60">
          <div className="py-3 text-xs text-muted-foreground text-center border-r border-border/40 font-medium">
            GMT-3
          </div>
          {DAYS_SHORT.map((d, i) => {
            const colDate = addDays(weekStart, i);
            const isToday = colDate.toDateString() === today.toDateString();
            return (
              <div key={i} className={`py-3 text-center border-r last:border-r-0 border-border/40 ${isToday ? 'bg-primary/8' : ''}`}>
                <p className={`text-xs uppercase tracking-wide font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {d}
                </p>
                <div className={`mx-auto mt-1 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold transition-colors
                  ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                  {colDate.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div ref={gridRef} className="grid grid-cols-8 relative" style={{ height: '560px' }}>

          {/* Hour labels column */}
          <div className="border-r border-border/40 relative">
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute w-full flex items-start justify-end pr-2"
                style={{ top: `${((h * 60 - GRID_START) / GRID_RANGE) * 100}%` }}
              >
                <span className="text-[10px] text-muted-foreground/70 -mt-2 font-mono">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS_SHORT.map((_, dayIdx) => {
            const colDate  = addDays(weekStart, dayIdx);
            const isToday  = colDate.toDateString() === today.toDateString();
            const dayAppts = getAppointmentsForDay(dayIdx);

            return (
              <div
                key={dayIdx}
                className={`relative border-r last:border-r-0 border-border/40 ${isToday ? 'bg-primary/[0.03]' : ''}`}
              >
                {/* Hour grid lines */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute w-full border-t border-border/25"
                    style={{ top: `${((h * 60 - GRID_START) / GRID_RANGE) * 100}%` }}
                  />
                ))}

                {/* Current time indicator */}
                {isToday && nowPct !== null && (
                  <div
                    className="absolute inset-x-0 z-10 flex items-center pointer-events-none"
                    style={{ top: `${nowPct}%` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                    <div className="flex-1 h-px bg-red-500" />
                  </div>
                )}

                {/* Appointments */}
                {dayAppts.map(a => {
                  const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.programada;
                  return (
                    <button
                      key={a.id}
                      className={`absolute inset-x-0.5 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.text}
                        flex overflow-hidden text-left hover:brightness-95 hover:shadow-md transition-all cursor-pointer group`}
                      style={blockStyle(a)}
                      onClick={() => setSelected(a)}
                    >
                      {/* Left accent bar */}
                      <div className={`w-1 shrink-0 rounded-l-lg ${cfg.accent}`} />
                      <div className="flex-1 p-1 min-w-0">
                        <p className="text-[10px] font-bold leading-tight truncate">
                          {fmt(new Date(a.scheduledAt))}
                        </p>
                        <p className="text-[10px] leading-tight truncate opacity-80 mt-0.5">
                          {TYPE_EMOJI[a.type] ?? ''} {a.patientName}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(STATUS_LABEL).map(([key, label]) => {
          const cfg = STATUS_CONFIG[key];
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {label}
            </div>
          );
        })}
      </div>

      {/* ── Detail modal ────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border/60 w-full max-w-sm shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header with accent */}
            {(() => {
              const cfg = STATUS_CONFIG[selected.status] ?? STATUS_CONFIG.programada;
              return (
                <>
                  <div className={`${cfg.bg} ${cfg.border} border-b px-5 py-4 flex items-start justify-between gap-2`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{TYPE_EMOJI[selected.type] ?? '📅'}</span>
                        <h3 className={`font-bold text-base ${cfg.text}`}>
                          {TYPE_LABEL[selected.type] ?? selected.type}
                        </h3>
                      </div>
                      <span className={`inline-flex items-center gap-1 mt-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.border} border ${cfg.text}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {STATUS_LABEL[selected.status] ?? selected.status}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="p-1.5 rounded-lg hover:bg-black/10 transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="px-5 py-4 space-y-3">
                    <InfoRow icon={<Clock className="h-4 w-4 text-muted-foreground shrink-0" />}>
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {new Date(selected.scheduledAt).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {fmt(new Date(selected.scheduledAt))} – {fmt(new Date(selected.endAt))}
                        </p>
                      </div>
                    </InfoRow>

                    {selected.patientName && (
                      <InfoRow icon={<PawPrint className="h-4 w-4 text-muted-foreground shrink-0" />}>
                        <span className="text-sm">
                          {selected.patientName}
                          {selected.patientSpecies && (
                            <span className="text-muted-foreground ml-1 text-xs">({selected.patientSpecies})</span>
                          )}
                        </span>
                      </InfoRow>
                    )}

                    {(selected.ownerFirstName || selected.ownerLastName) && (
                      <InfoRow icon={<User className="h-4 w-4 text-muted-foreground shrink-0" />}>
                        <span className="text-sm">
                          {[selected.ownerFirstName, selected.ownerLastName].filter(Boolean).join(' ')}
                        </span>
                      </InfoRow>
                    )}

                    {selected.veterinarianName && (
                      <InfoRow icon={<Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />}>
                        <span className="text-sm">{selected.veterinarianName}</span>
                      </InfoRow>
                    )}

                    {selected.visitAddress && (
                      <InfoRow icon={<MapPin className="h-4 w-4 text-muted-foreground shrink-0" />}>
                        <div>
                          <p className="text-sm text-muted-foreground">{selected.visitAddress}</p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.visitAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            Ver en Google Maps ↗
                          </a>
                        </div>
                      </InfoRow>
                    )}

                    {selected.reason && (
                      <InfoRow icon={<FileText className="h-4 w-4 text-muted-foreground shrink-0" />}>
                        <span className="text-sm text-muted-foreground">{selected.reason}</span>
                      </InfoRow>
                    )}
                  </div>

                  <div className="px-5 pb-5">
                    <a
                      href={`/citas/${selected.id}`}
                      className="block w-full text-center px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Ver cita completa →
                    </a>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
