/** Host donde el broker de Grok tiene registrada la app (OAuth Google / X). */
export const AUTH_HOST = "oporitmo.grok.me";

const ORIGENES_PROPIOS = [
  `https://${AUTH_HOST}`,
  "https://oporitmo.es",
  "https://www.oporitmo.es",
] as const;

export const ORIGENES_CONFIANZA: string[] = [...ORIGENES_PROPIOS];

export function origenPermitido(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && ORIGENES_CONFIANZA.includes(u.origin);
  } catch {
    return false;
  }
}

/** Google/X hay que iniciarlos en grok.me; el dominio propio no está en el broker. */
export function necesitaPuenteOAuth(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  if (h === AUTH_HOST) return false;
  if (h.endsWith(".grok-sandbox.com") || h === "grok-sandbox.com") return false;
  if (h === "localhost" || h === "127.0.0.1" || h === "[::1]") return false;
  return true;
}
