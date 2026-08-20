import type { Bloque } from "./bloques";

export type { Bloque, ColorBloque } from "./bloques";

export type Estado = "no_empezado" | "primera" | "segunda" | "preparado";

export const ESTADOS: Record<Estado, string> = {
  no_empezado: "No empezado",
  primera: "1.ª vuelta",
  segunda: "2.ª vuelta",
  preparado: "Preparado",
};

export const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export type Tema = {
  id: number;
  titulo: string;
  estado: Estado;
  ultimoTrabajo: string | null;
  tiempoInvertido: number;
  saltadoHasta: string | null;
  pendiente: boolean;
  orden: number;
  bloqueId: string | null;
  vuelta: number;
};

export type Sesion = {
  id: string;
  temaId: number;
  fecha: string;
  minutos: number;
  cerrada: boolean;
};

export type Simulacro = {
  id: string;
  fecha: string;
  temaId: number;
  extraidos: number[];
  duracionMinutos: number;
  minutos: number;
};

export type Config = {
  totalTemas: number;
  temasSorteo: number;
  fechaExamen: string;
  fechaInicio: string;
  fechaFin: string;
  horasSemana: number;
  horasPorDia: number[];
  especialidad: string;
  comunidad: string;
  umbralObjetivo: number;
  intervaloRepaso: number;
  vueltas: number[];
  duracionSimulacro: number;
};

export type AppData = {
  config: Config;
  temas: Tema[];
  sesiones: Sesion[];
  bloques: Bloque[];
  simulacros: Simulacro[];
};

export type TipoAccion = "repaso" | "profundizar" | "nuevo" | "acabar";

export type Sugerencia = {
  tema: Tema;
  prioridad: number;
  motivo: string;
  tipo: TipoAccion;
};
