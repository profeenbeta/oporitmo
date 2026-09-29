import { useEffect, useRef, useState } from "react";

const KEY = "oporitmo-sesion-hoy";

export type SesionRun = {
  temaId: number;
  startedAt: number;
  pausedMs: number;
  pauseAt: number | null;
};

export function elapsedMs(run: SesionRun, now: number): number {
  const pausaAbierta = run.pauseAt ? now - run.pauseAt : 0;
  return Math.max(0, now - run.startedAt - run.pausedMs - pausaAbierta);
}

/** 0–29 s → 0 min; 30 s o más → al minuto más cercano. */
export function minutosDe(ms: number): number {
  return Math.max(0, Math.round(ms / 60_000));
}

function leer(temaId: number): SesionRun | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as SesionRun;
    if (!v || v.temaId !== temaId || typeof v.startedAt !== "number") return null;
    return {
      temaId: v.temaId,
      startedAt: v.startedAt,
      pausedMs: typeof v.pausedMs === "number" ? v.pausedMs : 0,
      pauseAt: typeof v.pauseAt === "number" ? v.pauseAt : null,
    };
  } catch {
    return null;
  }
}

function guardar(run: SesionRun | null) {
  if (typeof window === "undefined") return;
  try {
    if (!run) window.sessionStorage.removeItem(KEY);
    else window.sessionStorage.setItem(KEY, JSON.stringify(run));
  } catch {
    /* modo privado */
  }
}

export function useRelojSesion(temaId: number | undefined) {
  const [run, setRun] = useState<SesionRun | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const runRef = useRef<SesionRun | null>(null);
  runRef.current = run;

  useEffect(() => {
    if (temaId == null) {
      setRun(null);
      return;
    }
    const saved = leer(temaId);
    if (!saved) {
      setRun(null);
      return;
    }
    const pausada =
      saved.pauseAt == null
        ? { ...saved, pauseAt: Date.now() }
        : saved;
    if (pausada !== saved) guardar(pausada);
    setRun(pausada);
  }, [temaId]);

  useEffect(() => {
    if (!run || run.pauseAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [run]);

  useEffect(() => {
    return () => {
      const r = runRef.current;
      if (!r) return;
      guardar(r.pauseAt ? r : { ...r, pauseAt: Date.now() });
    };
  }, []);

  const usado = run ? elapsedMs(run, now) : 0;
  const enPausa = run?.pauseAt != null;

  function empezar() {
    if (temaId == null || runRef.current) return;
    const next: SesionRun = {
      temaId,
      startedAt: Date.now(),
      pausedMs: 0,
      pauseAt: null,
    };
    setRun(next);
    guardar(next);
    setNow(Date.now());
  }

  function pausar() {
    const r = runRef.current;
    if (!r || r.pauseAt) return;
    const next = { ...r, pauseAt: Date.now() };
    setRun(next);
    guardar(next);
    setNow(Date.now());
  }

  function reanudar() {
    const r = runRef.current;
    if (!r?.pauseAt) return;
    const next = {
      ...r,
      pausedMs: r.pausedMs + (Date.now() - r.pauseAt),
      pauseAt: null,
    };
    setRun(next);
    guardar(next);
    setNow(Date.now());
  }

  function parar(): number {
    const r = runRef.current;
    const mins = r ? minutosDe(elapsedMs(r, Date.now())) : 0;
    setRun(null);
    guardar(null);
    return mins;
  }

  function minutosDelReloj(): number | null {
    const r = runRef.current;
    if (!r) return null;
    return minutosDe(elapsedMs(r, Date.now()));
  }

  return {
    run,
    usado,
    enPausa,
    empezar,
    pausar,
    reanudar,
    parar,
    minutosDelReloj,
  };
}
