import type { Config, Sesion } from "./types";

export const DEFAULT_HORAS_DIA = [2, 2, 2, 1.5, 1.5, 2.5, 0.5];

export function combinatoria(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let kk = Math.min(k, n - k);
  let res = 1;
  for (let i = 1; i <= kk; i++) {
    res = (res * (n - kk + i)) / i;
  }
  return res;
}

export function probabilidadAlMenosUno(
  preparados: number,
  total: number,
  sorteo: number,
): number {
  if (total <= 0 || sorteo <= 0 || preparados <= 0) return 0;
  if (preparados >= total) return 1;
  const k = Math.min(sorteo, total);
  if (total - preparados < k) return 1;
  const totalC = combinatoria(total, k);
  if (totalC === 0) return 0;
  return 1 - combinatoria(total - preparados, k) / totalC;
}

export function temasParaUmbral(
  preparados: number,
  total: number,
  sorteo: number,
  umbral: number,
): number {
  if (probabilidadAlMenosUno(preparados, total, sorteo) >= umbral) return 0;
  const max = Math.max(0, total - preparados);
  for (let extra = 1; extra <= max; extra++) {
    if (probabilidadAlMenosUno(preparados + extra, total, sorteo) >= umbral) {
      return extra;
    }
  }
  return max;
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISO(fecha: string): Date {
  return new Date(fecha + "T00:00:00");
}

export function hoyISO(): string {
  return toISO(new Date());
}

export function addDays(fecha: string, days: number): string {
  const d = parseISO(fecha);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function diasEntre(fecha1: string, fecha2: string): number {
  const a = parseISO(fecha1);
  const b = parseISO(fecha2);
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / 86_400_000);
}

export function diasRestantes(fecha: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dest = parseISO(fecha);
  return Math.max(0, Math.ceil((dest.getTime() - hoy.getTime()) / 86_400_000));
}

export function formatFechaCorta(fecha: string): string {
  return parseISO(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
  });
}

export type FaseEstudio = "antes" | "estudio" | "despues" | "examen";

export function faseEstudio(
  fecha: string,
  config: { fechaInicio?: string; fechaFin?: string; fechaExamen?: string },
): FaseEstudio {
  if (config.fechaExamen && fecha === config.fechaExamen) return "examen";
  const inicio = config.fechaInicio || fecha;
  const fin = config.fechaFin || config.fechaExamen || fecha;
  if (fecha < inicio) return "antes";
  if (fecha > fin) return "despues";
  return "estudio";
}

export function extraerSorteo(total: number, k: number): number[] {
  const pool = Array.from({ length: total }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = tmp;
  }
  return pool.slice(0, Math.min(k, total)).sort((a, b) => a - b);
}

export function formatPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

export function formatHoras(h: number): string {
  if (h <= 0) return "0 h";
  if (h < 1) return `${Math.round(h * 60)} min`;
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  if (mins === 0) return `${whole} h`;
  return `${whole} h ${mins} min`;
}

export function formatMinutos(min: number): string {
  return formatHoras(min / 60);
}

export function formatReloj(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function indiceSemana(fecha: string): number {
  return (parseISO(fecha).getDay() + 6) % 7;
}

export function normalizarHorasDia(raw?: number[]): number[] {
  const base = [...DEFAULT_HORAS_DIA];
  if (!raw) return base;
  for (let i = 0; i < 7; i++) {
    const v = raw[i];
    if (typeof v === "number" && Number.isFinite(v)) {
      base[i] = Math.max(0, v);
    }
  }
  return base;
}

export function sumaHoras(dias: number[]): number {
  return dias.reduce((a, b) => a + b, 0);
}

export function horasDelDia(
  fecha: string,
  config: Pick<Config, "horasPorDia">,
  overrideHoy: number | null,
): number {
  if (fecha === hoyISO() && overrideHoy !== null) return Math.max(0, overrideHoy);
  return normalizarHorasDia(config.horasPorDia)[indiceSemana(fecha)] ?? 0;
}

export function minutosDelDia(sesiones: Sesion[], fecha: string): number {
  return sesiones
    .filter((s) => s.fecha === fecha)
    .reduce((a, s) => a + s.minutos, 0);
}

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const DIAS_CORTO = ["L", "M", "X", "J", "V", "S", "D"];
