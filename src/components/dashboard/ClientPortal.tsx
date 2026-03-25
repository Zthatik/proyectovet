import { useEffect, useState } from 'react';
import { PawPrint, Calendar, Receipt, MapPin, Phone, Mail, AlertCircle } from 'lucide-react';

interface Owner {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  sex: string;
  dateOfBirth: string | null;
  weight: string | null;
}

interface Appointment {
  id: number;
  scheduledAt: string;
  endAt: string;
  type: string;
  status: string;
  reason: string | null;
  visitAddress: string | null;
  veterinarianName: string | null;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  date: string;
  total: string;
  status: string;
}

interface PortalData {
  owner: Owner | null;
  pets: Pet[];
  appointments: Appointment[];
  invoices: Invoice[];
}

const typeLabels: Record<string, string> = {
  consulta: 'Consulta', vacunacion: 'Vacunación', cirugia: 'Cirugía',
  control: 'Control', emergencia: 'Emergencia', grooming: 'Grooming',
};

const statusColors: Record<string, string> = {
  programada: 'bg-blue-100 text-blue-700', confirmada: 'bg-cyan-100 text-cyan-700',
  en_camino: 'bg-purple-100 text-purple-700', en_curso: 'bg-yellow-100 text-yellow-700',
  completada: 'bg-green-100 text-green-700', cancelada: 'bg-red-100 text-red-700',
  no_asistio: 'bg-gray-100 text-gray-600',
};

const statusLabels: Record<string, string> = {
  programada: 'Programada', confirmada: 'Confirmada', en_camino: 'En camino',
  en_curso: 'En curso', completada: 'Completada', cancelada: 'Cancelada', no_asistio: 'No asistió',
};

const invoiceStatusColors: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-600', emitida: 'bg-blue-100 text-blue-700',
  parcial: 'bg-orange-100 text-orange-700', anulada: 'bg-red-100 text-red-700',
};

const speciesEmoji: Record<string, string> = {
  perro: '🐶', gato: '🐱', ave: '🦜', reptil: '🦎', roedor: '🐹', otro: '🐾',
};

export function ClientPortal({ userName }: { userName: string }) {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/client/portal')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data?.owner) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold mb-1">Perfil no vinculado</h3>
        <p className="text-sm text-muted-foreground">
          Tu cuenta aún no está vinculada a un tutor en el sistema. Contacta a la clínica para que asocien tu perfil.
        </p>
      </div>
    );
  }

  const { owner, pets, appointments, invoices } = data;

  return (
    <div className="space-y-6">
      {/* Greeting + owner info */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-semibold">Hola, {owner.firstName}!</h2>
            <p className="text-sm text-muted-foreground">Aquí puedes ver toda la información de tus mascotas.</p>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            {owner.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {owner.phone}
              </div>
            )}
            {owner.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {owner.email}
              </div>
            )}
            {owner.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {owner.address}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Pets */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <PawPrint className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Mis Mascotas</h3>
            <span className="ml-auto text-xs text-muted-foreground">{pets.length} registradas</span>
          </div>
          {pets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes mascotas registradas.</p>
          ) : (
            <div className="space-y-2">
              {pets.map((pet) => (
                <a
                  key={pet.id}
                  href={`/pacientes/${pet.id}`}
                  className="flex items-center gap-3 border rounded-lg px-3 py-2.5 hover:bg-muted/30 transition-colors"
                >
                  <span className="text-xl">{speciesEmoji[pet.species] || '🐾'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{pet.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {pet.breed || pet.species} · {pet.sex}
                      {pet.weight ? ` · ${pet.weight} kg` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-primary">Ver →</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming appointments */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Próximas Citas</h3>
          </div>
          {appointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes citas próximas programadas.</p>
          ) : (
            <div className="space-y-2">
              {appointments.map((appt) => (
                <a
                  key={appt.id}
                  href={`/citas/${appt.id}`}
                  className="block border rounded-lg px-3 py-2.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{typeLabels[appt.type] || appt.type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[appt.status] || 'bg-gray-100'}`}>
                      {statusLabels[appt.status] || appt.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(appt.scheduledAt).toLocaleDateString('es-CL', {
                      weekday: 'long', day: '2-digit', month: 'long',
                    })}{' '}
                    {new Date(appt.scheduledAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {appt.visitAddress && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" /> {appt.visitAddress}
                    </p>
                  )}
                  {appt.veterinarianName && (
                    <p className="text-xs text-muted-foreground mt-0.5">Dr. {appt.veterinarianName}</p>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending invoices */}
      {invoices.length > 0 && (
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Facturas Pendientes</h3>
            <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
              {invoices.length} pendiente{invoices.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {invoices.map((inv) => (
              <a
                key={inv.id}
                href={`/facturacion/${inv.id}`}
                className="flex items-center justify-between border rounded-lg px-3 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inv.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${invoiceStatusColors[inv.status] || 'bg-gray-100'}`}>
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </span>
                  <span className="text-sm font-semibold">
                    ${parseFloat(inv.total).toLocaleString('es-CL')}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
