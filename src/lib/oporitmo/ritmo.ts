import {
  addDays,
  faseEstudio,
  horasDelDia,
  hoyISO,
  sumaHoras,
  normalizarHorasDia,
} from "./math";
import type { AppData } from "./types";

export function fraseRitmoFecha(
  data: AppData,
  hoy = hoyISO(),
): string | null {
  const { config, temas, sesiones } = data;
  const examen = config.fechaExamen;
  if (!examen) return null;
  if (hoy > examen) return null;

  const minutosHechos = sesiones.reduce(
    (a, s) => a + Math.max(0, s.minutos),
    0,
  );
  if (minutosHechos <= 0) return null;

  const fin = config.fechaFin || examen;
  const nVueltas = Math.max(1, config.vueltas?.length ?? 1);
  const pasesPendientes = temas.reduce((a, t) => {
    const hechas = Math.max(0, t.vuelta ?? 0);
    return a + Math.max(0, nVueltas - hechas);
  }, 0);

  if (pasesPendientes === 0) {
    return "Con tu ritmo actual, vas encajando con la fecha del examen.";
  }

  const diasEstudio = contarDiasDeEstudio(data, hoy, fin);
  if (diasEstudio <= 0) {
    return "Con tu ritmo actual, la fecha va justa. Mantener tus horas ayuda.";
  }

  const carga = pasesPendientes / diasEstudio;
  if (carga <= 0.9) {
    return "Con tu ritmo actual, vas encajando con la fecha del examen.";
  }

  const horasSemana = Math.round(
    sumaHoras(normalizarHorasDia(config.horasPorDia)),
  );
  if (carga <= 1.15) {
    if (horasSemana >= 1 && horasSemana <= 40) {
      return `Con tu ritmo actual, la fecha va justa si mantienes unas ${horasSemana} h a la semana.`;
    }
    return "Con tu ritmo actual, la fecha va justa. Mantener tus horas ayuda.";
  }

  return "Con tu ritmo actual, llegar a la fecha queda justo. Sin agobios: puedes ajustar horas o días libres.";
}

function contarDiasDeEstudio(
  data: AppData,
  desde: string,
  hasta: string,
): number {
  if (hasta < desde) return 0;
  let n = 0;
  let f = desde;
  for (let i = 0; i < 400 && f <= hasta; i += 1) {
    if (
      faseEstudio(f, data.config) === "estudio" &&
      horasDelDia(f, data.config, null) > 0
    ) {
      n += 1;
    }
    f = addDays(f, 1);
  }
  return n;
}
