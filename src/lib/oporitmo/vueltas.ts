import { diasEntre, hoyISO } from "./math";
import type { Estado, Tema } from "./types";

export const DEFAULT_VUELTAS = [7, 14, 30];

export function normalizarVueltas(raw: unknown, fallback = 7): number[] {
  if (Array.isArray(raw)) {
    const days = raw
      .map((x) => Math.round(Number(x)))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 180)
      .slice(0, 8);
    if (days.length > 0) return days;
  }
  const n = Math.min(180, Math.max(1, Math.round(Number(fallback)) || 7));
  return [n, Math.min(180, n * 2), Math.min(180, n * 4)];
}

export function ordinalVuelta(n: number): string {
  return `${n}.ª`;
}

export function estadoDesdeVuelta(vuelta: number, nVueltas: number): Estado {
  if (vuelta <= 0) return "no_empezado";
  if (vuelta > nVueltas) return "preparado";
  if (vuelta === 1) return "primera";
  return "segunda";
}

export function vueltaDesdeEstado(estado: Estado, nVueltas: number): number {
  if (estado === "no_empezado") return 0;
  if (estado === "primera") return 1;
  if (estado === "segunda") return Math.min(2, Math.max(1, nVueltas));
  return nVueltas + 1;
}

export function intervaloTras(vuelta: number, vueltas: number[]): number {
  if (vuelta <= 0 || vueltas.length === 0) return 0;
  const i = Math.min(vuelta, vueltas.length) - 1;
  return vueltas[i] ?? 7;
}

export function umbralOlvido(intervalo: number): number {
  return intervalo + Math.max(2, Math.ceil(intervalo * 0.5));
}

export function esOlvidado(
  tema: Tema,
  vueltas: number[],
  fecha = hoyISO(),
): boolean {
  if (tema.pendiente) return false;
  if ((tema.vuelta ?? 0) <= 0 || !tema.ultimoTrabajo) return false;
  const intervalo = intervaloTras(tema.vuelta ?? 0, vueltas);
  if (intervalo <= 0) return false;
  return diasEntre(tema.ultimoTrabajo, fecha) >= umbralOlvido(intervalo);
}

export function listarOlvidados(temas: Tema[], vueltas: number[], fecha = hoyISO()) {
  return temas
    .filter((t) => esOlvidado(t, vueltas, fecha))
    .sort((a, b) => {
      const da = a.ultimoTrabajo ? diasEntre(a.ultimoTrabajo, fecha) : 0;
      const db = b.ultimoTrabajo ? diasEntre(b.ultimoTrabajo, fecha) : 0;
      return db - da;
    });
}

export function completarVuelta(
  tema: Tema,
  fecha: string,
  vueltas: number[],
): Tema {
  const vuelta = Math.max(0, tema.vuelta ?? 0) + 1;
  return {
    ...tema,
    vuelta,
    estado: estadoDesdeVuelta(vuelta, vueltas.length),
    ultimoTrabajo: fecha,
    saltadoHasta: null,
    pendiente: false,
  };
}
