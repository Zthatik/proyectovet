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
  badge: { backgroundColor: c.accent, color: '#ffffff', padding: '6 12', borderRadius: 4, fontSize: 12, fontFamily: 'Helvetica-Bold' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  row: { flexDirection: 'row', gap: 24, marginBottom: 8, flexWrap: 'wrap' },
  field: { minWidth: 100 },
  label: { fontSize: 8, color: '#9ca3af', marginBottom: 2 },
  value: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 16 },
  table: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: c.greenSoft, paddingVertical: 6, paddingHorizontal: 8 },
  tableHeaderCell: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: c.green, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  tableCell: { fontSize: 9 },
  colVaccine: { flex: 2.2 },
  colBrand: { flex: 1.6 },
  colDate: { flex: 1.3 },
  colVet: { flex: 1.6 },
  overdueDate: { color: c.ink },
  notes: { fontSize: 8, color: c.muted, marginTop: 2, fontStyle: 'italic' },
  emptyBox: { padding: 20, textAlign: 'center', color: c.muted, fontSize: 10 },
  footer: { marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16 },
  pageNumber: { fontSize: 8, color: c.mutedLight, textAlign: 'center', marginTop: 12 },
  bookingBar: { marginTop: 18, backgroundColor: c.greenSoft, borderRadius: 6, padding: '10 14', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  bookingText: { fontSize: 9, color: c.green, fontFamily: 'Helvetica-Bold' },
  bookingNumber: { fontSize: 9, color: c.accent, fontFamily: 'Helvetica-Bold' },
});

const speciesLabels: Record<string, string> = {
  perro: 'Perro', gato: 'Gato', ave: 'Ave', conejo: 'Conejo', reptil: 'Reptil', roedor: 'Roedor', otro: 'Otro',
};
const sexLabels: Record<string, string> = { macho: 'Macho', hembra: 'Hembra', desconocido: 'Desconocido' };

interface VaccineEntry {
  name: string;
  brand?: string | null;
  batchNumber?: string | null;
  applicationDate: string;
  nextDoseDate?: string | null;
  notes?: string | null;
  veterinarianName?: string | null;
}

interface VaccineCardPDFProps {
  pet: {
    name: string;
    species: string;
    breed?: string | null;
    sex: string;
    dateOfBirth?: string | null;
    color?: string | null;
    microchipNumber?: string | null;
    ownerFirstName?: string | null;
    ownerLastName?: string | null;
  };
  vaccines: VaccineEntry[];
}

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  const date = d.length === 10 ? new Date(d + 'T12:00:00') : new Date(d);
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function VaccineCardPDF({ pet, vaccines }: VaccineCardPDFProps) {
  const today = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
  const sorted = [...vaccines].sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime());

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
            <Text style={styles.badge}>Carnet de Vacunación</Text>
            <Text style={{ fontSize: 9, color: c.muted, marginTop: 6 }}>Emitido el {today}</Text>
          </View>
        </View>

        {/* Pet info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos de la Mascota</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>NOMBRE</Text>
              <Text style={styles.value}>{pet.name}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>ESPECIE</Text>
              <Text style={styles.value}>{speciesLabels[pet.species] || pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>SEXO</Text>
              <Text style={styles.value}>{sexLabels[pet.sex] || pet.sex}</Text>
            </View>
            {pet.color && (
              <View style={styles.field}>
                <Text style={styles.label}>COLOR</Text>
                <Text style={styles.value}>{pet.color}</Text>
              </View>
            )}
          </View>
          <View style={styles.row}>
            {pet.dateOfBirth && (
              <View style={styles.field}>
                <Text style={styles.label}>NACIMIENTO</Text>
                <Text style={styles.value}>{fmtDate(pet.dateOfBirth)}</Text>
              </View>
            )}
            {pet.microchipNumber && (
              <View style={styles.field}>
                <Text style={styles.label}>MICROCHIP</Text>
                <Text style={styles.value}>{pet.microchipNumber}</Text>
              </View>
            )}
            <View style={styles.field}>
              <Text style={styles.label}>TUTOR</Text>
              <Text style={styles.value}>{pet.ownerFirstName} {pet.ownerLastName}</Text>
            </View>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Vaccines table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registro de Vacunas</Text>
          {sorted.length === 0 ? (
            <View style={styles.table}>
              <Text style={styles.emptyBox}>Aún no hay vacunas registradas.</Text>
            </View>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, styles.colVaccine]}>Vacuna</Text>
                <Text style={[styles.tableHeaderCell, styles.colBrand]}>Marca / Lote</Text>
                <Text style={[styles.tableHeaderCell, styles.colDate]}>Aplicada</Text>
                <Text style={[styles.tableHeaderCell, styles.colDate]}>Próxima dosis</Text>
                <Text style={[styles.tableHeaderCell, styles.colVet]}>Veterinario</Text>
              </View>
              {sorted.map((v, i) => (
                <View key={i} style={styles.tableRow} wrap={false}>
                  <View style={styles.colVaccine}>
                    <Text style={styles.tableCell}>{v.name}</Text>
                    {v.notes && <Text style={styles.notes}>{v.notes}</Text>}
                  </View>
                  <Text style={[styles.tableCell, styles.colBrand]}>
                    {v.brand || '—'}{v.batchNumber ? ` · ${v.batchNumber}` : ''}
                  </Text>
                  <Text style={[styles.tableCell, styles.colDate]}>{fmtDate(v.applicationDate)}</Text>
                  <Text style={[styles.tableCell, styles.colDate]}>{fmtDate(v.nextDoseDate)}</Text>
                  <Text style={[styles.tableCell, styles.colVet]}>{v.veterinarianName || '—'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ fontSize: 8, color: c.mutedLight }}>Este carnet resume el historial de vacunación registrado en {clinic.name}.</Text>
          <Text style={{ fontSize: 8, color: c.mutedLight }}>{clinic.name} — {clinic.subtitle}</Text>
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
