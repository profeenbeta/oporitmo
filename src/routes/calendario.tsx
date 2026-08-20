import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BloqueMarca } from "@/components/bloque-marca";
import { COLOR_CELDA_BLOQUE, clasePuntoFoco } from "@/lib/oporitmo/bloques";
import {
  DIAS_CORTO,
  MESES,
  formatHoras,
  formatMinutos,
  hoyISO,
  minutosDelDia,
  parseISO,
} from "@/lib/oporitmo/math";
import {
  celdasMes,
  planificarAdelante,
  sesionesPorDia,
  type DiaPlan,
} from "@/lib/oporitmo/suggestions";
import { useOpoStore } from "@/lib/oporitmo/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendario")({
  component: CalendarioPage,
});

const FOCO: Record<string, string> = {
  repaso: "Repaso",
  profundizar: "Cerrar vueltas",
  nuevo: "Ampliar",
  acabar: "Acabar",
  descanso: "Libre",
  examen: "Examen",
  hecho: "Hecho",
  antes: "Aún no",
  fin: "Fin",
};

function CalendarioPage() {
  const [ready, setReady] = useState(false);
  const now = new Date();
  const [cursor, setCursor] = useState({
    y: now.getFullYear(),
    m: now.getMonth(),
  });
  const [sel, setSel] = useState(hoyISO());

  const config = useOpoStore((s) => s.config);
  const temas = useOpoStore((s) => s.temas);
  const sesiones = useOpoStore((s) => s.sesiones);
  const bloques = useOpoStore((s) => s.bloques);
  const simulacros = useOpoStore((s) => s.simulacros);
  const override = useOpoStore((s) => s.horasHoyOverride);

  useEffect(() => setReady(true), []);

  const data = useMemo(
    () => ({ config, temas, sesiones, bloques, simulacros }),
    [config, temas, sesiones, bloques, simulacros],
  );

  const hoy = hoyISO();
  const celdas = useMemo(() => celdasMes(cursor.y, cursor.m), [cursor]);

  const horizonte = useMemo(() => {
    const last = celdas[celdas.length - 1] ?? hoy;
    const span = Math.max(1, Math.round((parseISO(last).getTime() - parseISO(hoy).getTime()) / 86_400_000) + 1);
    return planificarAdelante(data, override, Math.min(80, Math.max(span, 1)));
  }, [data, override, celdas, hoy]);

  const futuro = useMemo(() => {
    const map = new Map<string, DiaPlan>();
    for (const d of horizonte) map.set(d.fecha, d);
    return map;
  }, [horizonte]);

  const hechos = useMemo(() => sesionesPorDia(data), [data]);

  function bloqueDe(temaId?: number) {
    if (!temaId) return undefined;
    const tema = temas.find((t) => t.id === temaId);
    return bloques.find((b) => b.id === tema?.bloqueId);
  }

  const diaSel = useMemo(() => {
    if (sel < hoy) {
      const items = hechos.get(sel) ?? [];
      return {
        fecha: sel,
        horas: 0,
        foco: items.length ? "hecho" : "descanso",
        items,
        esHoy: false,
        esExamen: sel === config.fechaExamen,
        pasado: true,
      } satisfies DiaPlan;
    }
    return (
      futuro.get(sel) ?? {
        fecha: sel,
        horas: 0,
        foco: sel === config.fechaExamen ? "examen" : "descanso",
        items: [],
        esHoy: sel === hoy,
        esExamen: sel === config.fechaExamen,
        pasado: false,
      }
    );
  }, [sel, hoy, hechos, futuro, config.fechaExamen]);

  if (!ready) {
    return (
      <AppShell>
        <div className="h-56 animate-pulse rounded-xl bg-surface-2" />
      </AppShell>
    );
  }

  function shift(delta: number) {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">Calendario</h2>
          <p className="mt-1 text-sm text-muted">
            Proyección a partir de hoy. Si un día se tuerce, el resto se
            recalcula solo.
          </p>
        </div>
      </div>

      <section className="mt-5 rounded-xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="grid size-11 place-items-center rounded-md hover:bg-surface-2"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p className="font-display text-lg font-semibold">
            {MESES[cursor.m]} {cursor.y}
          </p>
          <button
            type="button"
            onClick={() => shift(1)}
            className="grid size-11 place-items-center rounded-md hover:bg-surface-2"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
          {DIAS_CORTO.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {celdas.map((fecha) => {
            const d = parseISO(fecha);
            const inMonth = d.getMonth() === cursor.m;
            const plan = futuro.get(fecha);
            const pastItems = hechos.get(fecha);
            const esHoy = fecha === hoy;
            const esExamen = fecha === config.fechaExamen;
            const selected = fecha === sel;
            const foco =
              fecha < hoy
                ? pastItems?.length
                  ? "hecho"
                  : null
                : esExamen
                  ? "examen"
                  : (plan?.foco ?? null);
            const titulo =
              fecha < hoy
                ? pastItems?.[0]?.titulo
                : plan?.items[0]?.titulo;
            const marca = bloqueDe(
              fecha < hoy ? pastItems?.[0]?.temaId : plan?.items[0]?.temaId,
            );

            return (
              <button
                key={fecha}
                type="button"
                onClick={() => setSel(fecha)}
                className={cn(
                  "flex min-h-[4.25rem] flex-col items-start rounded-md px-1.5 py-1.5 text-left",
                  !inMonth && "opacity-35",
                  inMonth && !marca && "bg-bg text-ink",
                  marca && COLOR_CELDA_BLOQUE[marca.color],
                  selected && "ring-2 ring-ink",
                )}
              >
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    esHoy && "font-semibold",
                  )}
                >
                  {d.getDate()}
                </span>
                {foco && (
                  <span className="mt-auto flex max-w-full items-center gap-1 text-[10px] leading-tight">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        clasePuntoFoco(foco),
                      )}
                    />
                    <span className="truncate">{titulo ?? FOCO[foco]}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <ul className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-white ring-1 ring-ink/50" />{" "}
            Repaso
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-ink ring-1 ring-white/80" />{" "}
            Estudio
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-warn ring-1 ring-ink/40" />{" "}
            Examen
          </li>
        </ul>
      </section>

      <section className="mt-4 rounded-xl border border-line bg-surface p-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          {diaSel.esHoy ? "Hoy" : diaSel.fecha}
        </p>
        <h3 className="mt-1 font-display text-xl font-semibold">
          {diaSel.esExamen ? "Día del examen" : FOCO[diaSel.foco]}
        </h3>
        {diaSel.pasado ? (
          <p className="mt-1 text-sm text-muted">
            {diaSel.items.length
              ? `Registraste ${formatMinutos(minutosDelDia(sesiones, sel))}.`
              : "No hay sesiones registradas."}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">
            {diaSel.horas > 0
              ? `${formatHoras(diaSel.horas)} disponibles en tu horario. La tarea es una propuesta.`
              : diaSel.foco === "antes"
                ? "Todavía no empieza el periodo de estudio."
                : diaSel.foco === "fin"
                  ? "Fuera del periodo de estudio."
                  : "Día libre en tu horario."}
          </p>
        )}

        {diaSel.items.length > 0 && (
          <ul className="mt-4 space-y-2">
            {diaSel.items.map((item, i) => {
              const b = bloqueDe(item.temaId);
              return (
              <li
                key={`${item.temaId}-${i}`}
                className="rounded-md bg-surface-2 px-3 py-3"
              >
                {b && (
                  <p className="mb-1 flex items-center gap-2 text-xs text-muted">
                    <BloqueMarca color={b.color} />
                    {b.nombre}
                  </p>
                )}
                <p className="text-sm font-semibold">{item.titulo}</p>
                <p className="text-xs text-muted">{FOCO[item.tipo]}{item.minutos ? ` · ${formatMinutos(item.minutos)}` : ""}</p>
              </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-4 pb-2">
        <h3 className="font-display text-lg font-semibold">Próximos días</h3>
        <ul className="mt-2 space-y-2">
          {horizonte.slice(0, 10).map((d) => (
            <li key={d.fecha}>
              <button
                type="button"
                onClick={() => {
                  setSel(d.fecha);
                  const dt = parseISO(d.fecha);
                  setCursor({ y: dt.getFullYear(), m: dt.getMonth() });
                }}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-lg border px-3 py-3 text-left",
                  d.fecha === sel
                    ? "border-accent/30 bg-accent-soft"
                    : "border-line bg-surface",
                )}
              >
                <div>
                  <p className="text-sm font-semibold">
                    {d.esHoy
                      ? "Hoy"
                      : `${["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][parseISO(d.fecha).getDay()]} ${parseISO(d.fecha).getDate()}`}
                  </p>
                  <p className="text-xs text-muted">
                    {d.items.map((i) => i.titulo).join(" · ") || FOCO[d.foco]}
                  </p>
                </div>
                <span className="text-xs tabular-nums text-muted">
                  {formatHoras(d.horas)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
