import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  clinicName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#2563eb' },
  clinicSub: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  rxBadge: { backgroundColor: '#2563eb', color: '#ffffff', padding: '6 12', borderRadius: 4, fontSize: 16, fontFamily: 'Helvetica-Bold' },
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
  notes: { backgroundColor: '#f9fafb', padding: 10, borderRadius: 4, marginTop: 8 },
  footer: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 16 },
  signatureBox: { width: 160, alignItems: 'center' },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#374151', width: '100%', marginBottom: 4 },
  signatureLabel: { fontSize: 8, color: '#6b7280', textAlign: 'center' },
  pageNumber: { fontSize: 8, color: '#9ca3af', textAlign: 'center', marginTop: 24 },
  statusBadge: { padding: '3 8', borderRadius: 20, fontSize: 8, fontFamily: 'Helvetica-Bold' },
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
  const date = new Date(rx.date).toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.clinicName}>VetClinic</Text>
            <Text style={styles.clinicSub}>Clínica Veterinaria</Text>
            <Text style={styles.clinicSub}>Tel: (506) 2222-2222</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.rxBadge}>Rₓ</Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 6 }}>Receta #{rx.id}</Text>
            <Text style={{ fontSize: 9, color: '#6b7280' }}>{date}</Text>
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
              <Text style={styles.label}>PROPIETARIO</Text>
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
            <Text style={{ fontSize: 8, color: '#9ca3af' }}>Emitida el {date}</Text>
            <Text style={{ fontSize: 8, color: '#9ca3af', marginTop: 2 }}>VetClinic — Sistema de Gestión Veterinaria</Text>
          </View>
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
