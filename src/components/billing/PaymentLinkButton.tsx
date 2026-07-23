import { useState } from 'react';
import { Link2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { buildWhatsappLink } from '../../lib/whatsapp';

interface Props {
  invoiceId: number;
  ownerName: string;
  ownerPhone: string | null;
}

export function PaymentLinkButton({ invoiceId, ownerName, ownerPhone }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/payment-link`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || 'No se pudo generar el link de pago'); return; }
      setUrl(json.url);
    } finally {
      setLoading(false);
    }
  }

  if (url) {
    const waMessage = `¡Hola ${ownerName}! Aquí puedes pagar tu factura de Alma Veterinaria: ${url}`;
    const waLink = buildWhatsappLink(ownerPhone, waMessage);
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Ver link de pago ↗</a>
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#25D366' }}>
            <MessageCircle className="h-3.5 w-3.5" /> Enviar por WhatsApp
          </a>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border hover:bg-muted transition-colors disabled:opacity-60"
    >
      <Link2 className="h-3.5 w-3.5" /> {loading ? 'Generando...' : 'Generar link de pago'}
    </button>
  );
}
