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
  rxBadge: { backgroundColor: c.green, color: '#ffffff', padding: '6 12', borderRadius: 4, fontSize: 16, fontFamily: 'Helvetica-Bold' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 24, marginBottom: 8 },
  field: { flex: 1 },
  label: { fontSize: 8, color: '#9ca3af', marginBottom: 2 },
  value: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 16 },
  medCard: { border: '1 solid #e5e7eb', borderRadius: 4, padding: '10 12', marginBottom: 8 },
  medName: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  medGrid: { flexDirection: 'row', gap: 12 },
  medField: { flex: 1 },
  notes: { backgroundColor: c.cream, padding: 10, borderRadius: 4, marginTop: 8 },
  footer: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16 },
  signatureBox: { width: 160, alignItems: 'center' },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#374151', width: '100%', marginBottom: 4 },
  signatureLabel: { fontSize: 8, color: c.muted, textAlign: 'center' },
  pageNumber: { fontSize: 8, color: c.mutedLight, textAlign: 'center', marginTop: 12 },
  statusBadge: { padding: '3 8', borderRadius: 20, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  bookingBar: { marginTop: 18, backgroundColor: c.greenSoft, borderRadius: 6, padding: '10 14', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  bookingText: { fontSize: 9, color: c.green, fontFamily: 'Helvetica-Bold' },
  bookingNumber: { fontSize: 9, color: c.accent, fontFamily: 'Helvetica-Bold' },
});

interface PrescriptionItem {
  medicationName: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  quantity?: number | null;
  instructions?: string | null;
}

interface PrescriptionPDFProps {
  prescription: {
    id: number;
    date: string;
    status: string;
    notes?: string | null;
    patientName?: string | null;
    patientSpecies?: string | null;
    ownerFirstName?: string | null;
    ownerLastName?: string | null;
    ownerPhone?: string | null;
    veterinarianName?: string | null;
  };
  items: PrescriptionItem[];
}

export function PrescriptionPDF({ prescription: rx, items }: PrescriptionPDFProps) {
  const date = new Date(rx.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

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
            <Text style={styles.rxBadge}>Rx</Text>
            <Text style={{ fontSize: 9, color: c.muted, marginTop: 6 }}>Receta #{rx.id}</Text>
            <Text style={{ fontSize: 9, color: c.muted }}>{date}</Text>
          </View>
        </View>

        {/* Patient info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Paciente</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>PACIENTE</Text>
              <Text style={styles.value}>{rx.patientName || '—'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>ESPECIE</Text>
              <Text style={styles.value}>{rx.patientSpecies ? rx.patientSpecies.charAt(0).toUpperCase() + rx.patientSpecies.slice(1) : '—'}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>TUTOR</Text>
              <Text style={styles.value}>{rx.ownerFirstName} {rx.ownerLastName}</Text>
            </View>
            {rx.ownerPhone && (
              <View style={styles.field}>
                <Text style={styles.label}>TELÉFONO</Text>
                <Text style={styles.value}>{rx.ownerPhone}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.divider} />

        {/* Medications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medicamentos Recetados</Text>
          {items.map((item, i) => (
            <View key={i} style={styles.medCard}>
              <Text style={styles.medName}>{i + 1}. {item.medicationName}</Text>
              <View style={styles.medGrid}>
                {item.dosage && (
                  <View style={styles.medField}>
                    <Text style={styles.label}>DOSIS</Text>
                    <Text>{item.dosage}</Text>
                  </View>
                )}
                {item.frequency && (
                  <View style={styles.medField}>
                    <Text style={styles.label}>FRECUENCIA</Text>
                    <Text>{item.frequency}</Text>
                  </View>
                )}
                {item.duration && (
                  <View style={styles.medField}>
                    <Text style={styles.label}>DURACIÓN</Text>
                    <Text>{item.duration}</Text>
                  </View>
                )}
                {item.quantity != null && (
                  <View style={styles.medField}>
                    <Text style={styles.label}>CANTIDAD</Text>
                    <Text>{item.quantity}</Text>
                  </View>
                )}
              </View>
              {item.instructions && (
                <View style={{ marginTop: 6 }}>
                  <Text style={styles.label}>INSTRUCCIONES</Text>
                  <Text>{item.instructions}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Notes */}
        {rx.notes && (
          <View style={styles.notes}>
            <Text style={styles.label}>NOTAS DEL VETERINARIO</Text>
            <Text style={{ marginTop: 4 }}>{rx.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{rx.veterinarianName || 'Veterinario'}</Text>
            <Text style={styles.signatureLabel}>Médico Veterinario</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 8, color: c.mutedLight }}>Emitida el {date}</Text>
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
