import MercadoPago, { Preference } from 'mercadopago';

/**
 * Genera un link de pago (Checkout Pro) para que el tutor pague una factura
 * desde su teléfono, sin manejar efectivo ni POS físico en la visita.
 *
 * Requiere la variable de entorno MERCADOPAGO_ACCESS_TOKEN (token de
 * producción o de prueba de tu cuenta de Mercado Pago). Sin ella, esta
 * función lanza un error claro — no hay forma de generar el link sin tus
 * propias credenciales de comercio.
 */
export interface InvoicePaymentLinkInput {
  invoiceId: number;
  invoiceNumber: string;
  total: number;
  ownerName: string;
}

export async function createInvoicePaymentLink(input: InvoicePaymentLinkInput): Promise<string> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado. Agrégalo en las variables de entorno para activar el cobro con link de pago.');
  }

  const baseUrl = (import.meta.env.BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || '').replace(/\/$/, '');
  const client = new MercadoPago({ accessToken, options: { timeout: 5000 } });
  const preference = new Preference(client);

  const result = await preference.create({
    body: {
      items: [
        {
          id: String(input.invoiceId),
          title: `Factura ${input.invoiceNumber} — Alma Veterinaria`,
          description: `Pago de ${input.ownerName}`,
          quantity: 1,
          unit_price: input.total,
          currency_id: 'CLP',
        },
      ],
      external_reference: `invoice-${input.invoiceId}`,
      back_urls: baseUrl
        ? {
            success: `${baseUrl}/facturacion/${input.invoiceId}`,
            failure: `${baseUrl}/facturacion/${input.invoiceId}`,
            pending: `${baseUrl}/facturacion/${input.invoiceId}`,
          }
        : undefined,
    },
  });

  if (!result.init_point) {
    throw new Error('Mercado Pago no devolvió un link de pago válido.');
  }
  return result.init_point;
}
