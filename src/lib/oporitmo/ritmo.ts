import {
  addDays,
  faseEstudio,
  horasDelDia,
  hoyISO,
  sumaHoras,
  normalizarHorasDia,
} from "./math";
import type { AppData } from "./types";

const MIN_DIAS_USO = 3;

export function fraseRitmoFecha(
  data: AppData,
  hoy = hoyISO(),
): string | null {
  const { config, temas, sesiones } = data;
  const examen = config.fechaExamen;
  const inicio = config.fechaInicio;
  const fin = config.fechaFin || examen;
  if (!examen || !inicio || !fin) return null;
  if (hoy > examen) return null;

  const diasUsados = new Set(
    sesiones.filter((s) => s.minutos > 0).map((s) => s.fecha),
  );
  const horasHechas =
    sesiones.reduce((a, s) => a + Math.max(0, s.minutos), 0) / 60;
  if (horasHechas <= 0 || diasUsados.size < MIN_DIAS_USO) return null;

  const nVueltas = Math.max(1, config.vueltas?.length ?? 1);
  const pasesPendientes = temas.reduce((a, t) => {
    const hechas = Math.max(0, t.vuelta ?? 0);
    return a + Math.max(0, nVueltas - hechas);
  }, 0);

  const diasEstudio = contarDiasDeEstudio(data, hoy, fin);
  if (pasesPendientes === 0) {
    return "Con tu ritmo actual, vas encajando con la fecha del examen.";
  }
  if (diasEstudio <= 0) return null;

  const carga = pasesPendientes / diasEstudio;
  if (carga <= 0.9) {
    return "Con tu ritmo actual, vas encajando con la fecha del examen.";
  }

  const horasSemana = Math.round(sumaHoras(normalizarHorasDia(config.horasPorDia)));
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
