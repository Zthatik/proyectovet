import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Calendar, Users, AlertTriangle } from 'lucide-react';

interface ReportData {
  revenueByMonth: { month: string; total: number; count: number }[];
  appointmentsByType: { type: string; count: number }[];
  appointmentsByStatus: { status: string; count: number }[];
  topPatients: { name: string; species: string; count: number }[];
  lowStock: { name: string; stock: number; minStock: number }[];
  summary: {
    totalRevenue: number;
    paidInvoices: number;
    pendingInvoices: number;
    totalAppointments: number;
    totalPatients: number;
  };
}

const TYPE_LABELS: Record<string, string> = {
  consulta: 'Consulta', vacunacion: 'Vacunación', cirugia: 'Cirugía',
  control: 'Control', emergencia: 'Emergencia', grooming: 'Grooming',
};
const STATUS_LABELS: Record<string, string> = {
  programada: 'Programada', confirmada: 'Confirmada', en_curso: 'En Curso',
  completada: 'Completada', cancelada: 'Cancelada', no_asistio: 'No Asistió',
};
const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);

function StatCard({ title, value, sub, icon: Icon, color }: { title: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export function ReportsCharts() {
  const [data, setData] = useState<ReportData | null>(null);
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?months=${months}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [months]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <TrendingUp className="h-5 w-5 animate-pulse mr-2" /> Cargando reportes...
      </div>
    );
  }

  const revenueFormatted = data.revenueByMonth.map((r) => ({
    ...r,
    mes: r.month.slice(5) + '/' + r.month.slice(2, 4),
    total: Number(r.total),
  }));

  const apptTypeFormatted = data.appointmentsByType.map((a) => ({
    name: TYPE_LABELS[a.type] || a.type,
    value: Number(a.count),
  }));

  const apptStatusFormatted = data.appointmentsByStatus.map((a) => ({
    name: STATUS_LABELS[a.status] || a.status,
    value: Number(a.count),
  }));

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Período:</span>
        {[3, 6, 12].map((m) => (
          <button
            key={m}
            onClick={() => setMonths(m)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${months === m ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
          >
            {m} meses
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ingresos Totales" value={fmt(Number(data.summary.totalRevenue))} icon={TrendingUp} color="bg-blue-100 text-blue-600" />
        <StatCard title="Facturas Pagadas" value={String(data.summary.paidInvoices)} sub={`${data.summary.pendingInvoices} pendientes`} icon={TrendingUp} color="bg-green-100 text-green-600" />
        <StatCard title="Total Citas" value={String(data.summary.totalAppointments)} icon={Calendar} color="bg-purple-100 text-purple-600" />
        <StatCard title="Pacientes Activos" value={String(data.summary.totalPatients)} icon={Users} color="bg-orange-100 text-orange-600" />
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold mb-4">Ingresos por Mes</h3>
        {revenueFormatted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sin datos en este período</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueFormatted} margin={{ top: 4, right: 16, left: 16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={(l) => `Mes: ${l}`} />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} name="Ingresos" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by type */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Citas por Tipo</h3>
          {apptTypeFormatted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={apptTypeFormatted} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {apptTypeFormatted.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Appointments by status */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Citas por Estado</h3>
          {apptStatusFormatted.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={apptStatusFormatted} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Citas" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top patients */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Pacientes con Más Citas</h3>
          {data.topPatients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos</p>
          ) : (
            <div className="space-y-3">
              {data.topPatients.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">({p.species})</span>
                  </div>
                  <span className="text-sm font-bold">{p.count} citas</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <h3 className="font-semibold">Productos con Bajo Stock</h3>
          </div>
          {data.lowStock.length === 0 ? (
            <p className="text-sm text-green-600">✓ Todo el inventario está en niveles normales</p>
          ) : (
            <div className="space-y-3">
              {data.lowStock.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${Math.min(100, (p.stock / p.minStock) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-red-600">{p.stock} / {p.minStock}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
