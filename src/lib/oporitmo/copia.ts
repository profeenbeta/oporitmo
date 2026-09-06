import type { CloudPayload } from "./cloud-types";
import type { AppData } from "./types";

const MARCA = "oporitmo";

/** Nombre y tipo al guardar. El selector de restaurar también acepta .txt (copias de #4.1). */
export const COPIA_EXT = ".oporitmo";
export const COPIA_MIME = "application/octet-stream";
export const COPIA_ACCEPT =
  ".oporitmo,.txt,text/plain,application/json,application/octet-stream";

export type CopiaPlan = {
  marca: typeof MARCA;
  version: 1;
  savedAt: number;
  config: AppData["config"];
  temas: AppData["temas"];
  sesiones: AppData["sesiones"];
  bloques: AppData["bloques"];
  simulacros: AppData["simulacros"];
  onboardingHecho: boolean;
};

export function nombreCopia(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `oporitmo-copia-${y}-${m}-${day}${COPIA_EXT}`;
}

export function armarCopia(snap: CloudPayload): CopiaPlan {
  return {
    marca: MARCA,
    version: 1,
    savedAt: snap.savedAt || Date.now(),
    config: snap.config,
    temas: snap.temas,
    sesiones: snap.sesiones ?? [],
    bloques: snap.bloques ?? [],
    simulacros: snap.simulacros ?? [],
    onboardingHecho: snap.onboardingHecho === true,
  };
}

export function textoCopia(snap: CloudPayload): string {
  return JSON.stringify(armarCopia(snap));
}

export function leerCopia(raw: string): AppData | null {
  try {
    const v = JSON.parse(raw.replace(/^\uFEFF/, "")) as Partial<CopiaPlan> & {
      app?: string;
    };
    if (!v || typeof v !== "object") return null;
    const marca = v.marca ?? v.app;
    if (marca != null && marca !== MARCA) return null;
    if (!v.config || typeof v.config !== "object") return null;
    if (!Array.isArray(v.temas)) return null;
    return {
      config: v.config,
      temas: v.temas,
      sesiones: Array.isArray(v.sesiones) ? v.sesiones : [],
      bloques: Array.isArray(v.bloques) ? v.bloques : [],
      simulacros: Array.isArray(v.simulacros) ? v.simulacros : [],
    };
  } catch {
    return null;
  }
}
