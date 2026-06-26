// Helpers para respuestas JSON uniformes en los endpoints.

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

/** Respuesta de error JSON con forma consistente: { error: string }. */
export function jsonError(status: number, message: string, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

/** Respuesta de éxito JSON. */
export function jsonOk(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}
