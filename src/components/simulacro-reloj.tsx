import { useEffect, useState } from "react";
import { formatReloj } from "@/lib/oporitmo/math";
import { cn } from "@/lib/utils";

export type SimulacroRun = {
  temaId: number;
  titulo: string;
  extraidos: number[];
  duracionMinutos: number;
  startedAt: number;
  pausedMs: number;
  pauseAt: number | null;
};

function elapsedMs(run: SimulacroRun, now: number): number {
  const pausaAbierta = run.pauseAt ? now - run.pauseAt : 0;
  return Math.max(0, now - run.startedAt - run.pausedMs - pausaAbierta);
}

export function SimulacroReloj({
  run,
  onRun,
  onTerminar,
  onCancelar,
}: {
  run: SimulacroRun;
  onRun: (r: SimulacroRun) => void;
  onTerminar: (minutos: number) => void;
  onCancelar: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [confirmSalir, setConfirmSalir] = useState(false);
  const duracionMs = run.duracionMinutos * 60_000;
  const usado = elapsedMs(run, now);
  const restante = duracionMs - usado;
  const agotado = restante <= 0;
  const enPausa = run.pauseAt !== null;
  const hayTiempoPendiente = usado > 0;

  useEffect(() => {
    if (enPausa) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [enPausa]);

  useEffect(() => {
    const titulo = agotado
      ? `+${formatReloj(-restante)}`
      : formatReloj(restante);
    const prev = document.title;
    document.title = `${titulo} · ${run.titulo}`;
    return () => {
      document.title = prev;
    };
  }, [agotado, restante, run.titulo]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (confirmSalir) {
        setConfirmSalir(false);
        return;
      }
      const usadoMs = elapsedMs(run, Date.now());
      if (usadoMs <= 0) onCancelar();
      else setConfirmSalir(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmSalir, run, onCancelar]);

  function pausar() {
    if (run.pauseAt) {
      onRun({
        ...run,
        pausedMs: run.pausedMs + (Date.now() - run.pauseAt),
        pauseAt: null,
      });
      setNow(Date.now());
      return;
    }
    onRun({ ...run, pauseAt: Date.now() });
  }

  function cerrar(guardar: boolean) {
    const mins = Math.max(1, Math.round(elapsedMs(run, Date.now()) / 60_000));
    if (guardar) onTerminar(mins);
    else onCancelar();
  }

  function pedirSalir() {
    const usadoMs = elapsedMs(run, Date.now());
    if (usadoMs <= 0) {
      onCancelar();
      return;
    }
    setConfirmSalir(true);
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-bg px-4 py-6 text-ink"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sim-titulo"
    >
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Simulacro
        </p>
        <h2 id="sim-titulo" className="mt-1 font-display text-2xl font-semibold">
          {run.titulo}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {enPausa
            ? "En pausa. El reloj no corre."
            : agotado
              ? "Se acabó el tiempo. Puedes cerrar o seguir un poco."
              : `Tienes ${run.duracionMinutos} min. Escribe el tema en papel o en un documento.`}
        </p>

        <p
          className={cn(
            "mt-10 text-center font-display font-semibold tabular-nums",
            agotado ? "text-5xl text-warn sm:text-6xl" : "text-6xl sm:text-7xl",
          )}
        >
          {agotado ? `+${formatReloj(-restante)}` : formatReloj(restante)}
        </p>
        <p className="mt-2 text-center text-sm text-muted">
          {agotado ? "De más" : "Restante"}
          {" · "}
          Llevas {formatReloj(usado)}
        </p>

        <div className="mt-auto flex flex-col gap-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={pausar}
            className="h-11 rounded-full bg-surface-2 text-sm font-medium"
          >
            {enPausa ? "Seguir" : "Pausa"}
          </button>
          <button
            type="button"
            onClick={() => cerrar(true)}
            className="h-11 rounded-full bg-accent text-sm font-semibold text-accent-fg"
          >
            Terminar y guardar
          </button>
          <button
            type="button"
            onClick={pedirSalir}
            className="h-11 rounded-full text-sm font-medium text-muted"
          >
            Salir sin guardar
          </button>
        </div>
      </div>

      {confirmSalir && hayTiempoPendiente && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-ink/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="salir-sim-titulo"
          onClick={() => setConfirmSalir(false)}
        >
          <div
            className="relative w-full max-w-sm card px-6 py-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              id="salir-sim-titulo"
              className="font-display text-xl font-semibold"
            >
              ¿Salir sin guardar?
            </p>
            <p className="mt-2 text-sm text-muted">
              Llevas {formatReloj(usado)} en este simulacro. Si sales ahora, ese
              tiempo no se guarda.
            </p>
            <button
              type="button"
              onClick={() => {
                setConfirmSalir(false);
                onCancelar();
              }}
              className="mt-6 h-12 w-full rounded-full bg-danger text-sm font-semibold text-accent-fg"
            >
              Salir sin guardar
            </button>
            <button
              type="button"
              onClick={() => setConfirmSalir(false)}
              className="mt-2 h-12 w-full rounded-full bg-surface-2 text-sm font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
