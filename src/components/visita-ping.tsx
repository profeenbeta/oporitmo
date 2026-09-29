import { useEffect } from "react";
import { registrarVisita } from "@/lib/oporitmo/admin";

const SESION = "oporitmo-v-sesion";
const VISITANTE = "oporitmo-v";

function visitanteLocal(): string | null {
  try {
    let id = window.localStorage.getItem(VISITANTE);
    if (!id || !/^[a-zA-Z0-9_-]{8,80}$/.test(id)) {
      id = crypto.randomUUID();
      window.localStorage.setItem(VISITANTE, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Ping anónimo de visita. No pinta nada. Una vez por pestaña. */
export function VisitaPing() {
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SESION)) return;
      window.sessionStorage.setItem(SESION, "1");
    } catch {
      return;
    }
    const id = visitanteLocal();
    if (!id) return;
    void registrarVisita({ data: id }).catch(() => {
      /* silencio: no altera la app */
    });
  }, []);
  return null;
}
