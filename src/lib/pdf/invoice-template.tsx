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
  invoiceTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: c.green, textAlign: 'right' },
  invoiceNum: { fontSize: 11, color: c.muted, textAlign: 'right', marginTop: 2 },
  billTo: { marginBottom: 24 },
  sectionTitle: { fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  clientName: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  clientDetail: { fontSize: 9, color: '#4b5563', marginTop: 2 },
  table: { marginBottom: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: '8 12', borderRadius: 4, marginBottom: 1 },
  tableRow: { flexDirection: 'row', padding: '8 12', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 2, textAlign: 'right' },
  colSubtotal: { flex: 2, textAlign: 'right' },
  headerText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6b7280', textTransform: 'uppercase' },
  totalsBox: { alignItems: 'flex-end', marginBottom: 24 },
  totalRow: { flexDirection: 'row', width: 200, justifyContent: 'space-between', padding: '3 0' },
  totalLabel: { color: '#6b7280' },
  grandTotal: { flexDirection: 'row', width: 200, justifyContent: 'space-between', padding: '8 0', borderTopWidth: 1, borderTopColor: '#374151', marginTop: 4 },
  grandTotalText: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  status: { padding: '4 10', borderRadius: 20, fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  footer: { borderTopWidth: 1, borderTopColor: c.border, paddingTop: 16, marginTop: 24, textAlign: 'center', fontSize: 8, color: c.mutedLight },
  pageNumber: { fontSize: 8, color: c.mutedLight, textAlign: 'center', marginTop: 12 },
  bookingBar: { marginTop: 16, backgroundColor: c.greenSoft, borderRadius: 6, padding: '10 14', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  bookingText: { fontSize: 9, color: c.green, fontFamily: 'Helvetica-Bold' },
  bookingNumber: { fontSize: 9, color: c.accent, fontFamily: 'Helvetica-Bold' },
});

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  borrador: { label: 'Borrador', bg: '#f3f4f6', color: '#374151' },
  emitida: { label: 'Emitida', bg: '#dbeafe', color: '#1d4ed8' },
  pagada: { label: 'Pagada', bg: '#dcfce7', color: '#15803d' },
  parcial: { label: 'Pago Parcial', bg: '#fef9c3', color: '#a16207' },
  anulada: { label: 'Anulada', bg: '#fee2e2', color: '#b91c1c' },
};

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}

interface InvoicePDFProps {
  invoice: {
    id: number;
    invoiceNumber: string;
    date: string;
    status: string;
    subtotal: string;
    taxRate: string;
    taxAmount: string;
    discount: string;
    total: string;
    notes?: string | null;
    ownerFirstName?: string | null;
    ownerLastName?: string | null;
    ownerEmail?: string | null;
    ownerPhone?: string | null;
  };
  items: InvoiceItem[];
}

function fmt(val: string) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(val));
}

export function InvoicePDF({ invoice: inv, items }: InvoicePDFProps) {
  const date = new Date(inv.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
  const sc = statusConfig[inv.status] || statusConfig.borrador;
  const hasDiscount = Number(inv.discount) > 0;

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
              <Text style={styles.clinicSub}>WhatsApp: {clinic.whatsapp.display}</Text>
              <Text style={styles.clinicSub}>{clinic.email}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FACTURA</Text>
            <Text style={styles.invoiceNum}>{inv.invoiceNumber}</Text>
            <Text style={{ fontSize: 9, color: '#6b7280', textAlign: 'right', marginTop: 4 }}>{date}</Text>
            <View style={{ alignItems: 'flex-end', marginTop: 6 }}>
              <Text style={[styles.status, { backgroundColor: sc.bg, color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billTo}>
          <Text style={styles.sectionTitle}>Facturar A</Text>
          <Text style={styles.clientName}>{inv.ownerFirstName} {inv.ownerLastName}</Text>
          {inv.ownerEmail && <Text style={styles.clientDetail}>{inv.ownerEmail}</Text>}
          {inv.ownerPhone && <Text style={styles.clientDetail}>{inv.ownerPhone}</Text>}
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, styles.headerText]}>Descripción</Text>
            <Text style={[styles.colQty, styles.headerText]}>Cant.</Text>
            <Text style={[styles.colPrice, styles.headerText]}>Precio Unit.</Text>
            <Text style={[styles.colSubtotal, styles.headerText]}>Subtotal</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{fmt(item.unitPrice)}</Text>
              <Text style={styles.colSubtotal}>{fmt(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text>{fmt(inv.subtotal)}</Text>
          </View>
          {hasDiscount && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Descuento</Text>
              <Text>-{fmt(inv.discount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA ({inv.taxRate}%)</Text>
            <Text>{fmt(inv.taxAmount)}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalText}>TOTAL</Text>
            <Text style={styles.grandTotalText}>{fmt(inv.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {inv.notes && (
          <View style={{ backgroundColor: '#f9fafb', padding: 10, borderRadius: 4, marginBottom: 16 }}>
            <Text style={{ fontSize: 8, color: '#9ca3af', marginBottom: 4 }}>NOTAS</Text>
            <Text>{inv.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Gracias por confiar en {clinic.name}</Text>
          <Text style={{ marginTop: 4 }}>{clinic.name} — {clinic.subtitle}</Text>
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
