import type { CloudPayload } from "./cloud-types";
import type { Apariencia } from "@/lib/theme";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppData, Config, Estado, Sesion, Simulacro, Tema } from "./types";
import {
  bloqueDeDemo,
  bloquesDemo,
  esColorBloque,
  siguienteColor,
  type Bloque,
  type ColorBloque,
} from "./bloques";
import {
  DEFAULT_HORAS_DIA,
  hoyISO,
  normalizarHorasDia,
  sumaHoras,
} from "./math";
import {
  DEFAULT_VUELTAS,
  completarVuelta,
  estadoDesdeVuelta,
  normalizarVueltas,
  vueltaDesdeEstado,
} from "./vueltas";

export const DEFAULT_CONFIG: Config = {
  totalTemas: 25,
  temasSorteo: 3,
  fechaExamen: "2027-06-15",
  fechaInicio: hoyISO(),
  fechaFin: "2027-06-14",
  horasSemana: sumaHoras(DEFAULT_HORAS_DIA),
  horasPorDia: [...DEFAULT_HORAS_DIA],
  especialidad: "Educación Física",
  comunidad: "Andalucía",
  umbralObjetivo: 0.8,
  intervaloRepaso: 30,
  vueltas: [...DEFAULT_VUELTAS],
  duracionSimulacro: 90,
};

const PREP_DEMO = [1, 3, 5, 7, 8, 10, 12, 14, 16, 18, 20, 22, 24];

function crearTemas(total: number, demo = true): Tema[] {
  const temas: Tema[] = [];
  for (let i = 1; i <= total; i++) {
    const preparado = demo && PREP_DEMO.includes(i);
    const viejo = demo && (i === 1 || i === 8 || i === 16);
    temas.push({
      id: i,
      titulo: `Tema ${i}`,
      estado: preparado ? "preparado" : "no_empezado",
      ultimoTrabajo: preparado ? (viejo ? "2026-06-01" : "2026-08-05") : null,
      tiempoInvertido: preparado ? 6 + ((i * 13) % 5) : i === 2 && demo ? 0.75 : 0,
      saltadoHasta: null,
      pendiente: demo && i === 2,
      orden: i,
      bloqueId: demo ? bloqueDeDemo(i) : null,
      vuelta: preparado ? DEFAULT_VUELTAS.length + 1 : 0,
    });
  }
  return temas;
}

function simulacrosDemo(): Simulacro[] {
  return [
    {
      id: "demo-1a",
      fecha: "2026-07-02",
      temaId: 1,
      extraidos: [1, 3, 5],
      duracionMinutos: 90,
      minutos: 108,
    },
    {
      id: "demo-1b",
      fecha: "2026-08-10",
      temaId: 1,
      extraidos: [1, 8, 12],
      duracionMinutos: 90,
      minutos: 86,
    },
    {
      id: "demo-8",
      fecha: "2026-06-18",
      temaId: 8,
      extraidos: [8, 10, 14],
      duracionMinutos: 90,
      minutos: 95,
    },
  ];
}

function normalizarTema(
  t: Tema & {
    horasEstimadas?: number;
    orden?: number;
    bloqueId?: string | null;
    vuelta?: number;
  },
  indice = 0,
  nVueltas = DEFAULT_VUELTAS.length,
): Tema {
  const vuelta =
    typeof t.vuelta === "number"
      ? Math.max(0, Math.round(t.vuelta))
      : vueltaDesdeEstado(t.estado, nVueltas);
  return {
    id: t.id,
    titulo: t.titulo,
    estado: estadoDesdeVuelta(vuelta, nVueltas),
    ultimoTrabajo: t.ultimoTrabajo,
    tiempoInvertido: t.tiempoInvertido ?? 0,
    saltadoHasta: t.saltadoHasta ?? null,
    pendiente: Boolean(t.pendiente),
    orden: typeof t.orden === "number" ? t.orden : indice + 1,
    bloqueId: typeof t.bloqueId === "string" ? t.bloqueId : null,
    vuelta,
  };
}

function porOrden(temas: Tema[]): Tema[] {
  return [...temas].sort(
    (a, b) => (a.orden ?? a.id) - (b.orden ?? b.id) || a.id - b.id,
  );
}

function reindexar(temas: Tema[]): Tema[] {
  return temas.map((t, i) => ({ ...t, orden: i + 1 }));
}

function fechasOrdenadas(inicio: string, fin: string, examen: string) {
  const fechaInicio = inicio || hoyISO();
  let fechaFin = fin || examen || fechaInicio;
  if (fechaFin < fechaInicio) fechaFin = fechaInicio;
  return { fechaInicio, fechaFin };
}

function normalizarConfig(raw: Partial<Config> | undefined): Config {
  const horasPorDia = normalizarHorasDia(raw?.horasPorDia);
  const intervalo = Number(raw?.intervaloRepaso);
  const vueltas = normalizarVueltas(
    raw?.vueltas,
    Number.isFinite(intervalo) && intervalo >= 1 ? intervalo : 7,
  );
  const examen = raw?.fechaExamen || DEFAULT_CONFIG.fechaExamen;
  const { fechaInicio, fechaFin } = fechasOrdenadas(
    raw?.fechaInicio || "",
    raw?.fechaFin || "",
    examen,
  );
  return {
    ...DEFAULT_CONFIG,
    ...raw,
    fechaExamen: examen,
    fechaInicio,
    fechaFin,
    horasPorDia,
    horasSemana: sumaHoras(horasPorDia),
    vueltas,
    intervaloRepaso: vueltas[vueltas.length - 1] ?? 7,
    duracionSimulacro: Math.min(
      240,
      Math.max(10, Math.round(Number(raw?.duracionSimulacro) || 90)),
    ),
  };
}

function syncTemas(temas: Tema[], total: number): Tema[] {
  const base = porOrden(temas.map((t, i) => normalizarTema(t, i)));
  if (base.length < total) {
    const extra: Tema[] = [];
    const maxId = base.reduce((m, t) => Math.max(m, t.id), 0);
    for (let i = base.length + 1; i <= total; i++) {
      extra.push({
        id: maxId + (i - base.length),
        titulo: `Tema ${i}`,
        estado: "no_empezado",
        ultimoTrabajo: null,
        tiempoInvertido: 0,
        saltadoHasta: null,
        pendiente: false,
        orden: i,
        bloqueId: null,
        vuelta: 0,
      });
    }
    return reindexar([...base, ...extra]);
  }
  if (base.length > total) return reindexar(base.slice(0, total));
  return reindexar(base);
}

function normalizarBloques(raw: unknown): Bloque[] {
  if (!Array.isArray(raw)) return [];
  const out: Bloque[] = [];
  const vistos = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const b = item as Partial<Bloque>;
    if (typeof b.id !== "string" || typeof b.nombre !== "string") continue;
    if (vistos.has(b.id)) continue;
    vistos.add(b.id);
    out.push({
      id: b.id,
      nombre: b.nombre.trim() || "Bloque",
      color: esColorBloque(b.color)
        ? b.color
        : siguienteColor(out.map((x) => x.color)),
    });
  }
  return out;
}

function limpiarBloqueId(temas: Tema[], bloques: Bloque[]): Tema[] {
  const ids = new Set(bloques.map((b) => b.id));
  return temas.map((t) =>
    t.bloqueId && !ids.has(t.bloqueId) ? { ...t, bloqueId: null } : t,
  );
}

function normalizarSimulacros(raw: unknown): Simulacro[] {
  if (!Array.isArray(raw)) return [];
  const out: Simulacro[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const s = item as Partial<Simulacro>;
    if (typeof s.temaId !== "number" || typeof s.minutos !== "number") continue;
    out.push({
      id: typeof s.id === "string" ? s.id : `${s.fecha}-${s.temaId}`,
      fecha: typeof s.fecha === "string" ? s.fecha : hoyISO(),
      temaId: s.temaId,
      extraidos: Array.isArray(s.extraidos)
        ? s.extraidos.filter((n): n is number => typeof n === "number")
        : [s.temaId],
      duracionMinutos:
        typeof s.duracionMinutos === "number" && s.duracionMinutos > 0
          ? s.duracionMinutos
          : 90,
      minutos: Math.max(0, s.minutos),
    });
  }
  return out.slice(-40);
}

export type ArranqueInput = {
  totalTemas: number;
  temasSorteo: number;
  fechaExamen: string;
  fechaInicio: string;
  fechaFin: string;
  horasPorDia: number[];
  especialidad: string;
  comunidad: string;
};

type Store = AppData & {
  onboardingHecho: boolean;
  apariencia: Apariencia;
  savedAt: number;
  setApariencia: (a: Apariencia) => void;
  aplicarNube: (data: CloudPayload) => void;
  snapshotNube: () => CloudPayload;
  horasHoyOverride: number | null;
  setHorasHoy: (h: number) => void;
  registrarSesion: (
    temaId: number,
    minutos: number,
    terminar: boolean,
  ) => void;
  saltarHoy: (temaId: number) => void;
  cambiarEstado: (temaId: number, estado: Estado) => void;
  renombrarTema: (temaId: number, titulo: string) => void;
  aplicarListado: (titulos: string[]) => void;
  reordenarTemas: (origenId: number, destinoId: number) => void;
  moverTema: (temaId: number, direccion: -1 | 1) => void;
  crearBloque: (nombre: string, color?: ColorBloque) => void;
  renombrarBloque: (id: string, nombre: string) => void;
  colorBloque: (id: string, color: ColorBloque) => void;
  borrarBloque: (id: string) => void;
  asignarBloque: (temaId: number, bloqueId: string | null) => void;
  actualizarConfig: (patch: Partial<Config>) => void;
  setHorasDia: (indice: number, horas: number) => void;
  completarArranque: (input: ArranqueInput) => void;
  abrirArranque: () => void;
  resetDemo: () => void;
  resetVacio: () => void;
  importar: (data: AppData) => void;
  registrarSimulacro: (input: {
    temaId: number;
    extraidos: number[];
    duracionMinutos: number;
    minutos: number;
  }) => void;
};

const seed: AppData = {
  config: DEFAULT_CONFIG,
  temas: crearTemas(DEFAULT_CONFIG.totalTemas, false),
  sesiones: [],
  bloques: [],
  simulacros: [],
};

export const useOpoStore = create<Store>()(
  persist(
    (set, get) => ({
      ...seed,
      onboardingHecho: false,
      apariencia: "sistema",
      savedAt: 0,
      setApariencia: (a) => set({ apariencia: a, savedAt: Date.now() }),
      snapshotNube: () => {
        const s = get();
        return {
          savedAt: s.savedAt || Date.now(),
          config: s.config,
          temas: s.temas,
          sesiones: s.sesiones,
          bloques: s.bloques,
          simulacros: s.simulacros ?? [],
          onboardingHecho: s.onboardingHecho,
          apariencia: s.apariencia,
        };
      },
      aplicarNube: (data) => {
        const bloques = normalizarBloques(data.bloques);
        const config = normalizarConfig(data.config);
        const n = config.vueltas.length;
        set({
          config,
          bloques,
          temas: limpiarBloqueId(
            reindexar(
              porOrden(
                (data.temas ?? []).map((t, i) => normalizarTema(t, i, n)),
              ),
            ),
            bloques,
          ),
          sesiones: (data.sesiones ?? []).map((s) => ({
            ...s,
            cerrada: s.cerrada ?? true,
          })),
          simulacros: normalizarSimulacros(data.simulacros),
          onboardingHecho: data.onboardingHecho === true,
          apariencia: data.apariencia ?? get().apariencia,
          savedAt: data.savedAt || Date.now(),
        });
      },
      horasHoyOverride: null,
      setHorasHoy: (h) => set({ horasHoyOverride: Math.max(0, h) }),
      registrarSesion: (temaId, minutos, terminar) => {
        const { temas, sesiones, config } = get();
        const tema = temas.find((t) => t.id === temaId);
        if (!tema) return;
        const mins = Number.isFinite(minutos) && minutos > 0 ? minutos : 0;
        const sesion: Sesion | null =
          mins > 0
            ? {
                id: `${Date.now()}-${temaId}`,
                temaId,
                fecha: hoyISO(),
                minutos: mins,
                cerrada: terminar,
              }
            : null;
        set({
          temas: temas.map((t) => {
            if (t.id !== temaId) return t;
            const base = {
              ...t,
              tiempoInvertido: t.tiempoInvertido + mins / 60,
              ultimoTrabajo: hoyISO(),
              pendiente: !terminar,
            };
            return terminar
              ? completarVuelta(base, hoyISO(), config.vueltas)
              : base;
          }),
          sesiones: sesion ? [...sesiones, sesion] : sesiones,
          savedAt: Date.now(),
        });
      },
      saltarHoy: (temaId) => {
        set({
          temas: get().temas.map((t) =>
            t.id === temaId ? { ...t, saltadoHasta: hoyISO() } : t,
          ),
          savedAt: Date.now(),
        });
      },
      cambiarEstado: (temaId, estado) => {
        const n = get().config.vueltas.length;
        const vuelta = vueltaDesdeEstado(estado, n);
        set({
          temas: get().temas.map((t) =>
            t.id === temaId
              ? {
                  ...t,
                  estado: estadoDesdeVuelta(vuelta, n),
                  vuelta,
                  pendiente: false,
                  ultimoTrabajo:
                    estado === "preparado" && !t.ultimoTrabajo
                      ? hoyISO()
                      : t.ultimoTrabajo,
                }
              : t,
          ),
          savedAt: Date.now(),
        });
      },
      renombrarTema: (temaId, titulo) => {
        const clean = titulo.trim();
        if (!clean) return;
        set({
          temas: get().temas.map((t) =>
            t.id === temaId ? { ...t, titulo: clean } : t,
          ),
          savedAt: Date.now(),
        });
      },
      aplicarListado: (titulos) => {
        const clean = titulos.map((t) => t.trim()).filter(Boolean);
        if (clean.length === 0) return;
        const { temas, config } = get();
        const maxId = temas.reduce((m, t) => Math.max(m, t.id), 0);
        let nextId = maxId;
        const porId = [...temas].sort((a, b) => a.id - b.id);
        const next = clean.map((titulo, i) => {
          const prev = porId[i];
          if (prev) return { ...prev, titulo };
          nextId += 1;
          return {
            id: nextId,
            titulo,
            estado: "no_empezado" as const,
            ultimoTrabajo: null,
            tiempoInvertido: 0,
            saltadoHasta: null,
            pendiente: false,
            orden: 1000 + i,
            bloqueId: null,
            vuelta: 0,
          };
        });
        set({
          temas: reindexar(porOrden(next)),
          config: normalizarConfig({
            ...config,
            totalTemas: next.length,
          }),
          savedAt: Date.now(),
        });
      },
      reordenarTemas: (origenId, destinoId) => {
        if (origenId === destinoId) return;
        const ordered = porOrden(get().temas);
        const from = ordered.findIndex((t) => t.id === origenId);
        const to = ordered.findIndex((t) => t.id === destinoId);
        if (from < 0 || to < 0) return;
        const next = [...ordered];
        const [item] = next.splice(from, 1);
        if (!item) return;
        next.splice(to, 0, item);
        set({ temas: reindexar(next), savedAt: Date.now() });
      },
      moverTema: (temaId, direccion) => {
        const ordered = porOrden(get().temas);
        const i = ordered.findIndex((t) => t.id === temaId);
        const j = i + direccion;
        if (i < 0 || j < 0 || j >= ordered.length) return;
        const next = [...ordered];
        const a = next[i];
        const b = next[j];
        if (!a || !b) return;
        next[i] = b;
        next[j] = a;
        set({ temas: reindexar(next), savedAt: Date.now() });
      },
      crearBloque: (nombre, color) => {
        const clean = nombre.trim();
        if (!clean) return;
        const bloques = get().bloques;
        set({
          bloques: [
            ...bloques,
            {
              id: `b-${Date.now()}`,
              nombre: clean,
              color:
                color && esColorBloque(color)
                  ? color
                  : siguienteColor(bloques.map((b) => b.color)),
            },
          ],
          savedAt: Date.now(),
        });
      },
      renombrarBloque: (id, nombre) => {
        const clean = nombre.trim();
        if (!clean) return;
        set({
          bloques: get().bloques.map((b) =>
            b.id === id ? { ...b, nombre: clean } : b,
          ),
          savedAt: Date.now(),
        });
      },
      colorBloque: (id, color) => {
        if (!esColorBloque(color)) return;
        set({
          bloques: get().bloques.map((b) =>
            b.id === id ? { ...b, color } : b,
          ),
          savedAt: Date.now(),
        });
      },
      borrarBloque: (id) => {
        const bloques = get().bloques.filter((b) => b.id !== id);
        set({
          bloques,
          temas: get().temas.map((t) =>
            t.bloqueId === id ? { ...t, bloqueId: null } : t,
          ),
          savedAt: Date.now(),
        });
      },
      asignarBloque: (temaId, bloqueId) => {
        const ok =
          bloqueId === null || get().bloques.some((b) => b.id === bloqueId);
        if (!ok) return;
        set({
          temas: get().temas.map((t) =>
            t.id === temaId ? { ...t, bloqueId } : t,
          ),
          savedAt: Date.now(),
        });
      },
      actualizarConfig: (patch) => {
        const config = normalizarConfig({ ...get().config, ...patch });
        const n = config.vueltas.length;
        set({
          config,
          temas: syncTemas(get().temas, config.totalTemas).map((t) => ({
            ...t,
            estado: estadoDesdeVuelta(t.vuelta ?? 0, n),
          })),
          savedAt: Date.now(),
        });
      },
      setHorasDia: (indice, horas) => {
        const horasPorDia = [...normalizarHorasDia(get().config.horasPorDia)];
        if (indice < 0 || indice > 6) return;
        horasPorDia[indice] = Math.max(0, horas);
        get().actualizarConfig({ horasPorDia });
      },
      completarArranque: (input) => {
        const config = normalizarConfig({
          ...get().config,
          totalTemas: Math.max(1, Math.round(input.totalTemas) || 25),
          temasSorteo: Math.max(1, Math.round(input.temasSorteo) || 1),
          fechaExamen: input.fechaExamen || DEFAULT_CONFIG.fechaExamen,
          fechaInicio: input.fechaInicio,
          fechaFin: input.fechaFin,
          horasPorDia: input.horasPorDia,
          especialidad: input.especialidad.trim() || DEFAULT_CONFIG.especialidad,
          comunidad: input.comunidad.trim() || DEFAULT_CONFIG.comunidad,
        });
        set({
          config,
          temas: crearTemas(config.totalTemas, false),
          sesiones: [],
          bloques: [],
          simulacros: [],
          horasHoyOverride: null,
          onboardingHecho: true,
          savedAt: Date.now(),
        });
      },
      abrirArranque: () => set({ onboardingHecho: false, savedAt: Date.now() }),
      resetDemo: () =>
        set({
          config: DEFAULT_CONFIG,
          temas: crearTemas(DEFAULT_CONFIG.totalTemas, true),
          sesiones: [],
          bloques: bloquesDemo(),
          simulacros: simulacrosDemo(),
          horasHoyOverride: null,
          onboardingHecho: true,
          savedAt: Date.now(),
        }),
      resetVacio: () =>
        set({
          config: DEFAULT_CONFIG,
          temas: crearTemas(DEFAULT_CONFIG.totalTemas, false),
          sesiones: [],
          bloques: [],
          simulacros: [],
          horasHoyOverride: null,
          onboardingHecho: true,
          savedAt: Date.now(),
        }),
      importar: (data) => {
        const bloques = normalizarBloques(data.bloques);
        const config = normalizarConfig(data.config);
        const n = config.vueltas.length;
        set({
          config,
          bloques,
          temas: limpiarBloqueId(
            reindexar(
              porOrden(
                (data.temas ?? []).map((t, i) => normalizarTema(t, i, n)),
              ),
            ),
            bloques,
          ),
          sesiones: (data.sesiones ?? []).map((s) => ({
            ...s,
            cerrada: s.cerrada ?? true,
          })),
          simulacros: normalizarSimulacros(data.simulacros),
          onboardingHecho: true,
          savedAt: Date.now(),
        });
      },
      registrarSimulacro: ({ temaId, extraidos, duracionMinutos, minutos }) => {
        const mins = Math.max(0, Math.round(minutos));
        const sim: Simulacro = {
          id: `${Date.now()}-${temaId}`,
          fecha: hoyISO(),
          temaId,
          extraidos,
          duracionMinutos,
          minutos: mins,
        };
        set({
          simulacros: [...(get().simulacros ?? []), sim].slice(-40),
          temas: get().temas.map((t) =>
            t.id === temaId
              ? {
                  ...t,
                  tiempoInvertido: t.tiempoInvertido + mins / 60,
                  ultimoTrabajo: hoyISO(),
                }
              : t,
          ),
          savedAt: Date.now(),
        });
      },
    }),
    {
      name: "oporitmo-v1",
      version: 11,
      migrate: (persisted) => {
        const s = (persisted ?? {}) as Partial<Store> & {
          horasHoy?: number;
        };
        const config = normalizarConfig(s.config);
        const n = config.vueltas.length;
        const bloques = normalizarBloques(s.bloques);
        const temas = limpiarBloqueId(
          reindexar(
            porOrden(
              (s.temas ?? seed.temas).map((t, i) => {
                const tema = normalizarTema(t, i, n);
                return tema.titulo.length > 50
                  ? { ...tema, titulo: `Tema ${i + 1}` }
                  : tema;
              }),
            ),
          ),
          bloques,
        );
        return {
          config,
          temas,
          sesiones: (s.sesiones ?? []).map((x) => ({
            ...x,
            cerrada: x.cerrada ?? true,
          })),
          bloques,
          simulacros: normalizarSimulacros(s.simulacros),
          horasHoyOverride:
            s.horasHoyOverride ??
            (typeof s.horasHoy === "number" ? s.horasHoy : null),
          onboardingHecho: s.onboardingHecho === true,
          apariencia: s.apariencia ?? "sistema",
          savedAt: s.savedAt ?? 0,
        };
      },
    },
  ),
);

export function useOpoHydrated() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const persistApi = useOpoStore.persist;
    if (!persistApi?.hasHydrated) {
      setOk(true);
      return;
    }
    setOk(persistApi.hasHydrated());
    return persistApi.onFinishHydration(() => setOk(true));
  }, []);
  return ok;
}
