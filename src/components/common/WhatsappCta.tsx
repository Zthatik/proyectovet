import { MessageCircle } from 'lucide-react';
import { clinic } from '../../lib/clinic';

interface Props {
  /** "banner" (franja informativa) o "button" (solo el botón). */
  variant?: 'banner' | 'button';
  className?: string;
}

/**
 * Llamado a la acción de WhatsApp. WhatsApp es el ÚNICO canal de agendamiento
 * de las visitas a domicilio, por eso se muestra de forma destacada.
 */
export function WhatsappCta({ variant = 'banner', className = '' }: Props) {
  const button = (
    <a
      href={clinic.whatsapp.link}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-colors"
      style={{ backgroundColor: '#25D366' }}
    >
      <MessageCircle className="h-4 w-4" />
      Agendar por WhatsApp
    </a>
  );

  if (variant === 'button') {
    return <div className={className}>{button}</div>;
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border bg-card p-4 ${className}`}>
      <div>
        <p className="text-sm font-medium">Las visitas a domicilio se agendan por WhatsApp</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Es nuestro único canal de agendamiento · {clinic.whatsapp.display}
        </p>
      </div>
      {button}
    </div>
  );
}
