import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import {
  SimulacroReloj,
  type SimulacroRun,
} from "@/components/simulacro-reloj";
import {
  extraerSorteo,
  formatMinutos,
  formatPct,
  probabilidadAlMenosUno,
} from "@/lib/oporitmo/math";
import { contarPreparados } from "@/lib/oporitmo/suggestions";
import { useOpoStore } from "@/lib/oporitmo/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sorteo")({ component: SorteoPage });

const DURACIONES = [45, 60, 90, 120];
const RUN_KEY = "oporitmo-sim-run";

function leerRun(): SimulacroRun | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as SimulacroRun;
    if (!v || typeof v.temaId !== "number") return null;
    return v;
  } catch {
    return null;
  }
}

function SorteoPage() {
  const [ready, setReady] = useState(false);
  const [extraidos, setExtraidos] = useState<number[]>([]);
  const [sims, setSims] = useState<{ n: number; hits: number } | null>(null);
  const [elegido, setElegido] = useState<number | null>(null);
  const [run, setRun] = useState<SimulacroRun | null>(null);
  const config = useOpoStore((s) => s.config);
  const temas = useOpoStore((s) => s.temas);
  const simulacros = useOpoStore((s) => s.simulacros);
  const actualizarConfig = useOpoStore((s) => s.actualizarConfig);
  const registrarSimulacro = useOpoStore((s) => s.registrarSimulacro);
  const duracion = config.duracionSimulacro ?? 90;

  useEffect(() => {
    setReady(true);
    setRun(leerRun());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (run) window.sessionStorage.setItem(RUN_KEY, JSON.stringify(run));
    else window.sessionStorage.removeItem(RUN_KEY);
  }, [run]);

  const preparadosIds = useMemo(
    () =>
      new Set(temas.filter((t) => t.estado === "preparado").map((t) => t.id)),
    [temas],
  );
  const preparados = contarPreparados({
    config,
    temas,
    sesiones: [],
    bloques: [],
    simulacros: [],
  });
  const p = probabilidadAlMenosUno(
    preparados,
    config.totalTemas,
    config.temasSorteo,
  );

  const historial = [...(simulacros ?? [])].reverse().slice(0, 8);

  function unSorteo() {
    const draw = extraerSorteo(config.totalTemas, config.temasSorteo);
    setExtraidos(draw);
    setSims(null);
    const prep = draw.find((id) => preparadosIds.has(id));
    setElegido(prep ?? draw[0] ?? null);
  }

  function muchos() {
    const n = 2000;
    let hits = 0;
    for (let i = 0; i < n; i++) {
      const draw = extraerSorteo(config.totalTemas, config.temasSorteo);
      if (draw.some((id) => preparadosIds.has(id))) hits += 1;
    }
    setSims({ n, hits });
    setExtraidos([]);
    setElegido(null);
  }

  function empezar() {
    if (elegido == null) return;
    const tema = temas.find((t) => t.id === elegido);
    setRun({
      temaId: elegido,
      titulo: tema?.titulo ?? `Tema ${elegido}`,
      extraidos,
      duracionMinutos: duracion,
      startedAt: Date.now(),
      pausedMs: 0,
      pauseAt: null,
    });
  }

  if (!ready) {
    return (
      <AppShell>
        <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
      </AppShell>
    );
  }

  const aciertos = extraidos.filter((id) => preparadosIds.has(id));

  return (
    <AppShell>
      {run && (
        <SimulacroReloj
          run={run}
          onRun={setRun}
          onTerminar={(minutos) => {
            registrarSimulacro({
              temaId: run.temaId,
              extraidos: run.extraidos,
              duracionMinutos: run.duracionMinutos,
              minutos,
            });
            setRun(null);
            toast(
              `Simulacro guardado: ${formatMinutos(minutos)} de ${run.duracionMinutos} min.`,
            );
          }}
          onCancelar={() => setRun(null)}
        />
      )}

      <h2 className="font-display text-2xl font-semibold">Sorteo</h2>
      <p className="mt-1 text-sm text-muted">
        Simula lo que hace el tribunal. La probabilidad teórica es{" "}
        <span className="font-semibold text-ink">{formatPct(p)}</span>.
      </p>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={unSorteo}
          className="h-11 flex-1 rounded-md bg-accent px-4 text-sm font-semibold text-accent-fg"
        >
          Extraer ahora
        </button>
        <button
          type="button"
          onClick={muchos}
          className="h-11 flex-1 rounded-md border border-line bg-surface px-4 text-sm font-medium"
        >
          2.000 sorteos
        </button>
      </div>

      {extraidos.length > 0 && (
        <section className="mt-5 rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Extraídos
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {extraidos.map((id) => {
              const ok = preparadosIds.has(id);
              const titulo =
                temas.find((t) => t.id === id)?.titulo ?? `Tema ${id}`;
              const activo = elegido === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setElegido(id)}
                    className={cn(
                      "flex h-11 w-full items-center justify-between rounded-md px-3 text-left text-sm",
                      activo
                        ? "bg-accent text-accent-fg"
                        : ok
                          ? "bg-accent-soft text-accent"
                          : "bg-surface-2 text-muted",
                    )}
                  >
                    <span className="font-medium">{titulo}</span>
                    {ok && (
                      <span className="text-xs opacity-80">preparado</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm">
            {aciertos.length === 0
              ? "En este sorteo no ha salido ninguno preparado."
              : `Ha salido ${aciertos.length} tema${aciertos.length === 1 ? "" : "s"} preparado${aciertos.length === 1 ? "" : "s"}.`}
          </p>

          <p className="mt-5 mb-2 text-sm text-muted">
            Tiempo para escribir
          </p>
          <div className="flex flex-wrap gap-1">
            {DURACIONES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => actualizarConfig({ duracionSimulacro: n })}
                className={cn(
                  "h-11 rounded-md px-3 text-sm font-medium",
                  duracion === n
                    ? "bg-accent text-accent-fg"
                    : "bg-surface-2 text-muted",
                )}
              >
                {n} min
              </button>
            ))}
          </div>
          <label className="mt-2 block">
            <span className="mb-1 block text-xs text-muted">
              O un número concreto
            </span>
            <input
              type="number"
              min={10}
              max={240}
              value={duracion}
              onChange={(e) =>
                actualizarConfig({
                  duracionSimulacro: Number(e.target.value) || 90,
                })
              }
              className="h-11 w-full rounded-md border border-line bg-bg px-3 tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <button
            type="button"
            onClick={empezar}
            disabled={elegido == null}
            className="mt-4 h-11 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg disabled:opacity-40"
          >
            Empezar simulacro
          </button>
          <p className="mt-2 text-xs text-muted">
            Elige el tema que desarrollarías. El reloj no guarda el escrito, solo
            el tiempo.
          </p>
        </section>
      )}

      {sims && (
        <section className="mt-5 rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Simulación
          </p>
          <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-accent">
            {formatPct(sims.hits / sims.n)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {sims.hits} de {sims.n} sorteos con al menos un tema preparado. La
            teoría da {formatPct(p)}.
          </p>
        </section>
      )}

      {historial.length > 0 && (
        <section className="mt-5 rounded-xl border border-line bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Últimos simulacros
          </p>
          <ul className="mt-3 space-y-2">
            {historial.map((s) => {
              const titulo =
                temas.find((t) => t.id === s.temaId)?.titulo ??
                `Tema ${s.temaId}`;
              const deMas = s.minutos > s.duracionMinutos;
              return (
                <li
                  key={s.id}
                  className="flex items-baseline justify-between gap-3 rounded-md bg-surface-2 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{titulo}</p>
                    <p className="text-xs text-muted">{s.fecha}</p>
                  </div>
                  <p
                    className={cn(
                      "shrink-0 text-sm tabular-nums",
                      deMas ? "text-warn" : "text-ink",
                    )}
                  >
                    {formatMinutos(s.minutos)}
                    <span className="text-muted">
                      {" / "}
                      {s.duracionMinutos} min
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
