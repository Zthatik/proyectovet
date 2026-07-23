import { useState } from 'react';
import { Link2, Copy, Check, MessageCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { buildWhatsappLink } from '../../lib/whatsapp';
import { clinic } from '../../lib/clinic';

interface Props {
  ownerId: number;
  ownerName: string;
  ownerPhone: string | null;
}

export function OwnerInviteButton({ ownerId, ownerName, ownerPhone }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/owners/${ownerId}/invite`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'No se pudo generar la invitación'); return; }
      setUrl(json.url);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!url) {
    return (
      <div>
        <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="gap-1.5">
          <Link2 className="h-3.5 w-3.5" /> {loading ? 'Generando...' : 'Generar link de invitación'}
        </Button>
        {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
      </div>
    );
  }

  const waMessage = `¡Hola ${ownerName}! Te comparto el link para activar tu portal de ${clinic.name} y ver a tus mascotas: ${url}`;
  const waLink = buildWhatsappLink(ownerPhone, waMessage);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Link de un solo uso, válido por 7 días:</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-muted rounded-lg px-3 py-2 truncate">{url}</code>
        <Button variant="outline" size="sm" onClick={copy} className="shrink-0 gap-1.5">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#25D366' }}
        >
          <MessageCircle className="h-3.5 w-3.5" /> Enviar por WhatsApp
        </a>
      )}
    </div>
  );
}
