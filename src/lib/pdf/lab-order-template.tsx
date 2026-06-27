import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { clinic, brandColors as c } from '../clinic';
import { ALMA_LOGO_DATA_URI } from './logo-data';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: c.ink },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: c.green },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 88, height: 78, objectFit: 'contain' },
  clinicName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: c.green },
  clinicSub: { fontSize: 9, color: c.muted, marginTop: 2 },
  clinicContact: { fontSize: 8, color: c.muted, marginTop: 1 },
  docTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: c.green, textAlign: 'right' },
  docNum: { fontSize: 9, color: c.muted, textAlign: 'right', marginTop: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, color: c.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 24, marginBottom: 8 },
  field: { flex: 1 },
  label: { fontSize: 8, color: c.mutedLight, marginBottom: 2 },
  value: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  divider: { borderBottomWidth: 1, borderBottomColor: c.border, marginBottom: 16 },
  examCard: { border: `1 solid ${c.border}`, borderRadius: 4, padding: '12 14', marginBottom: 8 },
  examType: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: c.green, marginBottom: 6 },
  block: { backgroundColor: c.cream, padding: 10, borderRadius: 4, marginTop: 8 },
  statusBadge: { padding: '3 10', borderRadius: 20, fontSize: 9, fontFamily: 'Helvetica-Bold', alignSelf: 'flex-start' },
  footer: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16 },
  signatureBox: { width: 180, alignItems: 'center' },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#374151', width: '100%', marginBottom: 4 },
  signatureLabel: { fontSize: 8, color: c.muted, textAlign: 'center' },
  bookingBar: { marginTop: 18, backgroundColor: c.greenSoft, borderRadius: 6, padding: '10 14', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  bookingText: { fontSize: 9, color: c.green, fontFamily: 'Helvetica-Bold' },
  bookingNumber: { fontSize: 9, color: c.accent, fontFamily: 'Helvetica-Bold' },
  pageNumber: { fontSize: 8, color: c.mutedLight, textAlign: 'center', marginTop: 12 },
});

const typeLabels: Record<string, string> = {
  hemograma: 'Hemograma',
  quimica_sanguinea: 'Química Sanguínea',
  urinalisis: 'Urianálisis',
  coproparasitario: 'Coproparasitario',
  radiografia: 'Radiografía',
  ecografia: 'Ecografía',
  cultivo: 'Cultivo y Antibiograma',
  otro: 'Otro',
};

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  solicitado: { label: 'Solicitado', bg: '#dbeafe', color: '#1d4ed8' },
  en_proceso: { label: 'En Proceso', bg: '#fef9c3', color: '#a16207' },
  completado: { label: 'Completado', bg: '#dcfce7', color: '#15803d' },
  cancelado: { label: 'Cancelado', bg: '#fee2e2', color: '#b91c1c' },
};

interface LabOrderPDFProps {
  order: {
    id: number;
    type: string;
    description?: string | null;
    status: string;
    results?: string | null;
    requestedAt: string;
    completedAt?: string | null;
    patientName?: string | null;
    patientSpecies?: string | null;
    ownerFirstName?: string | null;
    ownerLastName?: string | null;
    ownerPhone?: string | null;
    veterinarianName?: string | null;
  };
}

export function LabOrderPDF({ order }: LabOrderPDFProps) {
  const requested = new Date(order.requestedAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
  const sc = statusConfig[order.status] || statusConfig.solicitado;
  const typeLabel = typeLabels[order.type] || order.type;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image style={styles.logo} src={ALMA_LOGO_DATA_URI} />
            <View>
              <Text style={styles.clinicName}>{clinic.name}</Text>
              <Text style={styles.clinicSub}>{clinic.subtitle}</Text>
              <Text style={styles.clinicContact}>WhatsApp: {clinic.whatsapp.display}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.docTitle}>ORDEN DE EXÁMENES</Text>
            <Text style={styles.docNum}>Orden #{order.id}</Text>
            <Text style={styles.docNum}>{requested}</Text>
          </View>
        </View>

        {/* Patient info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Paciente</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>PACIENTE</Text>
              <Text style={styles.value}>{order.patientName || '—'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>ESPECIE</Text>
              <Text style={styles.value}>{order.patientSpecies ? order.patientSpecies.charAt(0).toUpperCase() + order.patientSpecies.slice(1) : '—'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>PROPIETARIO</Text>
              <Text style={styles.value}>{order.ownerFirstName} {order.ownerLastName}</Text>
            </View>
            {order.ownerPhone && (
              <View style={styles.field}>
                <Text style={styles.label}>TELÉFONO</Text>
                <Text style={styles.value}>{order.ownerPhone}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.divider} />

        {/* Exam */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Examen Solicitado</Text>
          <View style={styles.examCard}>
            <Text style={styles.examType}>{typeLabel}</Text>
            <Text style={[styles.statusBadge, { backgroundColor: sc.bg, color: sc.color }]}>{sc.label}</Text>
            {order.description && (
              <View style={styles.block}>
                <Text style={styles.label}>INDICACIONES / DESCRIPCIÓN</Text>
                <Text style={{ marginTop: 4 }}>{order.description}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Results (si existen) */}
        {order.results && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resultados</Text>
            <View style={styles.block}>
              <Text style={{ lineHeight: 1.4 }}>{order.results}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{order.veterinarianName || 'Veterinario'}</Text>
            <Text style={styles.signatureLabel}>Médico Veterinario</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8, color: c.mutedLight }}>Emitida el {requested}</Text>
            <Text style={{ fontSize: 8, color: c.mutedLight, marginTop: 2 }}>{clinic.name} — {clinic.subtitle}</Text>
          </View>
        </View>

        {/* Agenda por WhatsApp (único canal) */}
        <View style={styles.bookingBar}>
          <Text style={styles.bookingText}>{clinic.bookingCta}:</Text>
          <Text style={styles.bookingNumber}>{clinic.whatsapp.display}</Text>
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
