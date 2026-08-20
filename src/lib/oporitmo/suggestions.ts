import type { AppData, Sugerencia, Tema, TipoAccion } from "./types";
import {
  addDays,
  diasEntre,
  faseEstudio,
  horasDelDia,
  hoyISO,
  parseISO,
  probabilidadAlMenosUno,
  toISO,
} from "./math";
import {
  completarVuelta,
  esOlvidado,
  intervaloTras,
  ordinalVuelta,
} from "./vueltas";

export function contarPreparados(data: AppData): number {
  return data.temas.filter((t) => t.estado === "preparado").length;
}

export function obtenerSugerencias(
  data: AppData,
  _horasDisponibles = 0,
  fechaRef = hoyISO(),
): {
  principal: Sugerencia | null;
  secundarias: Sugerencia[];
  todas: Sugerencia[];
} {
  const preparados = contarPreparados(data);
  const total = data.config.totalTemas;
  const sorteo = data.config.temasSorteo;
  const probActual = probabilidadAlMenosUno(preparados, total, sorteo);
  const umbral = data.config.umbralObjetivo;
  const vueltas = data.config.vueltas?.length
    ? data.config.vueltas
    : [data.config.intervaloRepaso || 7];

  const candidatos: Sugerencia[] = data.temas.map((tema) => {
    let prioridad = 0;
    let motivo = "";
    let tipo: TipoAccion = "nuevo";

    const saltado =
      tema.saltadoHasta !== null && tema.saltadoHasta >= fechaRef;
    const diasSinTocar = tema.ultimoTrabajo
      ? diasEntre(tema.ultimoTrabajo, fechaRef)
      : 999;
    const vuelta = tema.vuelta ?? 0;

    if (tema.pendiente) {
      tipo = "acabar";
      prioridad = 96;
      motivo = "Lo dejaste a medias. Conviene cerrarlo antes de abrir otro";
    } else if (vuelta <= 0) {
      tipo = "nuevo";
      if (probActual < umbral) {
        prioridad = 56;
        motivo = `Abrir temas nuevos sube la probabilidad (ahora ${(probActual * 100).toFixed(0)} %)`;
      } else {
        prioridad = 24;
        motivo = "La cobertura ya es buena. Puedes profundizar en otros";
      }
    } else {
      const intervalo = intervaloTras(vuelta, vueltas);
      const tocaN = Math.min(vuelta, vueltas.length);
      const yaListo = vuelta > vueltas.length;
      tipo = yaListo ? "repaso" : "repaso";
      const aviso = Math.max(
        1,
        intervalo - Math.max(1, Math.ceil(intervalo * 0.3)),
      );
      if (diasSinTocar >= intervalo) {
        const retraso = diasSinTocar - intervalo;
        const olvidado = esOlvidado(tema, vueltas, fechaRef);
        prioridad = (olvidado ? 90 : yaListo ? 70 : 78) + Math.min(retraso, 20);
        motivo = olvidado
          ? `Lleva ${diasSinTocar} días sin tocarlo. Se está enfriando`
          : yaListo
          ? retraso === 0
            ? `Toca mantenimiento (cada ${intervalo} días)`
            : `Lleva ${diasSinTocar} días. El intervalo es ${intervalo}`
          : retraso === 0
            ? `Toca la ${ordinalVuelta(tocaN)} vuelta (${intervalo} días)`
            : `La ${ordinalVuelta(tocaN)} vuelta lleva ${retraso} día${retraso === 1 ? "" : "s"} de retraso`;
      } else if (diasSinTocar >= aviso) {
        const quedan = intervalo - diasSinTocar;
        prioridad = 32 + diasSinTocar;
        motivo = `La ${yaListo ? "revisión" : ordinalVuelta(tocaN) + " vuelta"} toca en ${quedan} día${quedan === 1 ? "" : "s"}`;
      } else {
        const quedan = intervalo - diasSinTocar;
        prioridad = 16;
        motivo = `Siguiente ${yaListo ? "repaso" : ordinalVuelta(tocaN) + " vuelta"} en ${quedan} día${quedan === 1 ? "" : "s"}`;
      }
    }

    if (saltado) {
      prioridad -= 50;
    }

    return { tema, prioridad, motivo, tipo };
  });

  candidatos.sort((a, b) => {
    if (b.prioridad !== a.prioridad) return b.prioridad - a.prioridad;
    return (a.tema.orden ?? a.tema.id) - (b.tema.orden ?? b.tema.id);
  });
  const utiles = candidatos.filter((c) => c.prioridad > 20);

  return {
    principal: utiles[0] ?? null,
    secundarias: utiles.slice(1, 3),
    todas: candidatos,
  };
}

function avanzarTema(tema: Tema, fecha: string, vueltas: number[]): Tema {
  return completarVuelta(tema, fecha, vueltas);
}

export type ItemDia = {
  temaId: number;
  titulo: string;
  tipo: TipoAccion | "hecho";
  minutos?: number;
};

export type DiaPlan = {
  fecha: string;
  horas: number;
  foco: TipoAccion | "descanso" | "examen" | "hecho" | "antes" | "fin";
  items: ItemDia[];
  esHoy: boolean;
  esExamen: boolean;
  pasado: boolean;
};

export function planificarAdelante(
  data: AppData,
  overrideHoy: number | null,
  dias: number,
): DiaPlan[] {
  const hoy = hoyISO();
  const temas = data.temas.map((t) => ({ ...t }));
  const working: AppData = { ...data, temas };

  return Array.from({ length: dias }, (_, i) => {
    const fecha = addDays(hoy, i);
    const fase = faseEstudio(fecha, data.config);
    const esExamen = fase === "examen";
    const horas =
      fase === "estudio"
        ? horasDelDia(fecha, data.config, i === 0 ? overrideHoy : null)
        : 0;

    if (esExamen) {
      return {
        fecha,
        horas: 0,
        foco: "examen" as const,
        items: [],
        esHoy: i === 0,
        esExamen: true,
        pasado: false,
      };
    }
    if (fase === "antes") {
      return {
        fecha,
        horas: 0,
        foco: "antes" as const,
        items: [],
        esHoy: i === 0,
        esExamen: false,
        pasado: false,
      };
    }
    if (fase === "despues" || horas <= 0) {
      return {
        fecha,
        horas: 0,
        foco: fase === "despues" ? ("fin" as const) : ("descanso" as const),
        items: [],
        esHoy: i === 0,
        esExamen: false,
        pasado: false,
      };
    }

    const { principal } = obtenerSugerencias(working, horas, fecha);
    const items: ItemDia[] = [];
    if (principal && principal.prioridad > 20) {
      items.push({
        temaId: principal.tema.id,
        titulo:
          principal.tipo === "acabar"
            ? `Acabar ${principal.tema.titulo}`
            : principal.tema.titulo,
        tipo: principal.tipo,
      });
      const idx = working.temas.findIndex((t) => t.id === principal.tema.id);
      if (idx >= 0) {
        working.temas[idx] = avanzarTema(
          working.temas[idx]!,
          fecha,
          data.config.vueltas ?? [7],
        );
      }
    }

    const foco = items[0]?.tipo ?? "descanso";
    return {
      fecha,
      horas,
      foco,
      items,
      esHoy: i === 0,
      esExamen: false,
      pasado: false,
    };
  });
}

export function planSemana(
  data: AppData,
  overrideHoy: number | null,
): DiaPlan[] {
  return planificarAdelante(data, overrideHoy, 7);
}

export function celdasMes(year: number, month: number): string[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toISO(d);
  });
}

export function sesionesPorDia(data: AppData): Map<string, ItemDia[]> {
  const map = new Map<string, ItemDia[]>();
  for (const s of data.sesiones) {
    const tema = data.temas.find((t) => t.id === s.temaId);
    const list = map.get(s.fecha) ?? [];
    list.push({
      temaId: s.temaId,
      titulo: tema?.titulo ?? `Tema ${s.temaId}`,
      tipo: "hecho",
      minutos: s.minutos,
    });
    map.set(s.fecha, list);
  }
  return map;
}

export function etiquetaDia(fecha: string): string {
  const d = parseISO(fecha);
  const names = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  if (fecha === hoyISO()) return "Hoy";
  return names[d.getDay()] ?? "";
}
