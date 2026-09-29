import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { AppShell } from "@/components/app-shell";
import { BloqueMarca } from "@/components/bloque-marca";
import { COLOR_CELDA_BLOQUE, clasePuntoFoco } from "@/lib/oporitmo/bloques";
import {
  DIAS_CORTO,
  MESES,
  esDiaLibre,
  formatFechaCorta,
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
import { esEscritorio, gestoHorizontal } from "@/lib/gestos";
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

function etiquetaAccesibleDia(
  fecha: string,
  extras: { hoy?: boolean; seleccionado?: boolean; libre?: boolean },
): string {
  const base = parseISO(fecha).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const extra = [
    extras.hoy ? "hoy" : null,
    extras.seleccionado ? "seleccionado" : null,
    extras.libre ? "libre" : null,
  ].filter(Boolean);
  return extra.length ? `${base}, ${extra.join(", ")}` : base;
}

function AccionesDiaLibre({
  libre,
  onToggle,
}: {
  libre: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-4">
      <p className="text-xs text-muted">
        Úsalo para vacaciones, trabajo o imprevistos.
      </p>
      <button
        type="button"
        onClick={onToggle}
        className="mt-2 h-11 w-full rounded-full bg-surface-2 text-sm font-medium"
      >
        {libre ? "Quitar día libre" : "Marcar como día libre"}
      </button>
    </div>
  );
}

function CalendarioPage() {
  const [ready, setReady] = useState(false);
  const now = new Date();
  const [cursor, setCursor] = useState({
    y: now.getFullYear(),
    m: now.getMonth(),
  });
  const [sel, setSel] = useState(hoyISO());
  const [ficha, setFicha] = useState(false);
  const [verMasDias, setVerMasDias] = useState(false);
  const mesGesto = useRef<{ x: number; y: number } | null>(null);

  const config = useOpoStore((s) => s.config);
  const temas = useOpoStore((s) => s.temas);
  const sesiones = useOpoStore((s) => s.sesiones);
  const bloques = useOpoStore((s) => s.bloques);
  const simulacros = useOpoStore((s) => s.simulacros);
  const override = useOpoStore((s) => s.horasHoyOverride);
  const toggleDiaLibre = useOpoStore((s) => s.toggleDiaLibre);

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

  const selLibre = esDiaLibre(sel, config.diasLibres);

  if (!ready) {
    return (
      <AppShell>
        <div className="h-56 animate-pulse rounded-xl bg-surface-2" />
      </AppShell>
    );
  }

  function abrirDia(fecha: string) {
    setSel(fecha);
    const dt = parseISO(fecha);
    setCursor({ y: dt.getFullYear(), m: dt.getMonth() });
    if (!esEscritorio()) setFicha(true);
  }

  function alToggleLibre(fecha: string) {
    const ya = esDiaLibre(fecha, config.diasLibres);
    toggleDiaLibre(fecha);
    if (!ya) {
      toast("Este día no cuenta como estudio. El plan se ajusta solo.");
    }
  }

  function shift(delta: number) {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  function onMesDown(e: React.PointerEvent) {
    mesGesto.current = { x: e.clientX, y: e.clientY };
  }

  function onMesUp(e: React.PointerEvent) {
    if (!mesGesto.current) return;
    const dir = gestoHorizontal(mesGesto.current, {
      x: e.clientX,
      y: e.clientY,
    });
    mesGesto.current = null;
    if (dir) shift(dir);
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

      <div className="xl:mt-5 xl:grid xl:grid-cols-[minmax(0,_1.35fr)_minmax(18rem,_0.85fr)] xl:items-start xl:gap-6">
      <section
        className="mt-5 card p-4 xl:mt-0"
        data-gesto="mes"
        onPointerDown={onMesDown}
        onPointerUp={onMesUp}
        onPointerCancel={() => {
          mesGesto.current = null;
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="grid size-11 place-items-center rounded-full hover:bg-surface-2"
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
            className="grid size-11 place-items-center rounded-full hover:bg-surface-2"
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
            const esLibre = esDiaLibre(fecha, config.diasLibres);
            const foco =
              fecha < hoy
                ? pastItems?.length
                  ? "hecho"
                  : esLibre
                    ? "descanso"
                    : null
                : esExamen
                  ? "examen"
                  : (plan?.foco ?? null);
            const titulo =
              fecha < hoy
                ? pastItems?.[0]?.titulo
                : plan?.items[0]?.titulo;
            const marca = esLibre
              ? undefined
              : bloqueDe(
                  fecha < hoy ? pastItems?.[0]?.temaId : plan?.items[0]?.temaId,
                );

            return (
              <button
                key={fecha}
                type="button"
                onClick={() => abrirDia(fecha)}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-between rounded-xl px-1 py-1.5 xl:min-h-20 xl:items-start xl:px-2",
                  !inMonth && "opacity-30",
                  inMonth && esLibre && "bg-surface-2 text-muted bg-[repeating-linear-gradient(-45deg,transparent_0_5px,color-mix(in_srgb,var(--ink)_8%,transparent)_5px_6px)]",
                  inMonth && !esLibre && !marca && foco === "descanso" && "bg-surface-2 text-muted",
                  inMonth && !esLibre && !marca && foco === "antes" && "bg-bg text-faint",
                  inMonth && !esLibre && !marca && foco === "fin" && "bg-bg text-faint",
                  inMonth && !esLibre && !marca && !foco && "bg-bg text-faint",
                  inMonth && !esLibre && !marca && (foco === "repaso" || foco === "nuevo" || foco === "profundizar" || foco === "acabar" || foco === "hecho" || foco === "examen") && "bg-surface text-ink",
                  !esLibre && marca && COLOR_CELDA_BLOQUE[marca.color],
                  selected && "ring-2 ring-ink",
                )}
                aria-current={esHoy ? "date" : undefined}
                aria-pressed={selected}
                aria-label={etiquetaAccesibleDia(fecha, {
                  hoy: esHoy,
                  seleccionado: selected,
                  libre: esLibre,
                })}
              >
                <span className="flex items-center gap-0.5">
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      esHoy && "font-semibold",
                      esHoy && !selected && "text-accent",
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {esHoy && !selected && (
                    <span
                      className="size-1.5 rounded-full bg-accent"
                      aria-hidden
                    />
                  )}
                </span>
                {esLibre ? (
                  <span className="mt-auto text-[10px] font-medium leading-tight text-muted">
                    Libre
                  </span>
                ) : foco ? (
                  <span className="mt-auto flex max-w-full items-center gap-1">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        clasePuntoFoco(foco),
                      )}
                    />
                    <span className="hidden truncate text-xs leading-tight xl:inline">
                      {titulo ?? FOCO[foco]}
                    </span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-xs font-medium text-muted">Leyenda</p>
        <ul className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted">
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

      <div className="xl:sticky xl:top-8">
      <section className="mt-4 hidden card p-5 sm:block xl:block">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          {diaSel.esHoy ? "Hoy" : diaSel.fecha}
        </p>
        <h3 className="mt-1 font-display text-xl font-semibold">
          {diaSel.esExamen ? "Día del examen" : selLibre ? "Día libre" : FOCO[diaSel.foco]}
        </h3>
        {diaSel.pasado ? (
          <p className="mt-1 text-sm text-muted">
            {diaSel.items.length
              ? `Registraste ${formatMinutos(minutosDelDia(sesiones, sel))}.`
              : "No hay sesiones registradas."}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">
            {selLibre
              ? "Día libre."
              : diaSel.horas > 0
              ? `${formatHoras(diaSel.horas)} disponibles en tu horario. La tarea es una propuesta.`
              : diaSel.foco === "antes"
                ? "Todavía no empieza el periodo de estudio."
                : diaSel.foco === "fin"
                  ? "Fuera del periodo de estudio."
                  : "Día libre en tu horario."}
          </p>
        )}

        {!selLibre && diaSel.items.length > 0 && (
          <ul className="mt-4 space-y-2">
            {diaSel.items.map((item, i) => {
              const b = bloqueDe(item.temaId);
              return (
              <li
                key={`${item.temaId}-${i}`}
                className="rounded-2xl bg-surface-2 px-3 py-3"
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
        <AccionesDiaLibre
          libre={selLibre}
          onToggle={() => alToggleLibre(sel)}
        />
      </section>

      <section className="mt-4 pb-2">
        <h3 className="font-display text-lg font-semibold">Próximos días</h3>
        <ul className="mt-2 space-y-2">
          {(verMasDias ? horizonte : horizonte.slice(0, 10)).map((d) => (
            <li key={d.fecha}>
              <button
                type="button"
                onClick={() => abrirDia(d.fecha)}
                className={cn(
                  "flex w-full items-start justify-between gap-3 px-3 py-3 text-left",
                  d.fecha === sel
                    ? "card-hero"
                    : "card",
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
        {horizonte.length > 10 && (
          <button
            type="button"
            onClick={() => setVerMasDias((v) => !v)}
            className="mt-2 h-11 w-full rounded-full bg-surface-2 text-sm font-medium"
          >
            {verMasDias ? "Ver menos" : "Ver más"}
          </button>
        )}
      </section>
      </div>
      </div>

      <Drawer.Root
        open={ficha}
        onOpenChange={setFicha}
        shouldScaleBackground
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-ink/40" />
          <Drawer.Content className="glass fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl px-5 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-2 outline-none sm:pb-8">
            <div className="mx-auto mb-4 mt-1 h-1.5 w-10 rounded-full bg-faint" />
            <Drawer.Title className="font-display text-xl font-semibold">
              {diaSel.esExamen ? "Día del examen" : selLibre ? "Día libre" : FOCO[diaSel.foco]}
            </Drawer.Title>
            <Drawer.Description className="mt-1 text-sm text-muted">
              {diaSel.esHoy ? "Hoy" : formatFechaCorta(diaSel.fecha)}
              {diaSel.pasado
                ? diaSel.items.length
                  ? ` · registraste ${formatMinutos(minutosDelDia(sesiones, sel))}`
                  : " · no hay sesiones registradas"
                : selLibre
                  ? " · día libre"
                : diaSel.horas > 0
                  ? ` · ${formatHoras(diaSel.horas)} en tu horario`
                  : diaSel.foco === "antes"
                    ? " · todavía no empieza el periodo"
                    : diaSel.foco === "fin"
                      ? " · fuera del periodo de estudio"
                      : " · día libre"}
            </Drawer.Description>
            {!selLibre && diaSel.items.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {diaSel.items.map((item, i) => {
                  const b = bloqueDe(item.temaId);
                  return (
                    <li
                      key={`${item.temaId}-${i}`}
                      className="rounded-xl bg-surface-2 px-3 py-3"
                    >
                      {b && (
                        <p className="mb-1 flex items-center gap-2 text-xs text-muted">
                          <BloqueMarca color={b.color} />
                          {b.nombre}
                        </p>
                      )}
                      <p className="font-semibold">{item.titulo}</p>
                      <p className="text-xs text-muted">
                        {FOCO[item.tipo]}
                        {item.minutos ? ` · ${formatMinutos(item.minutos)}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">
                {selLibre ? "Día libre." : "No hay un tema concreto."}
              </p>
            )}
            <AccionesDiaLibre
              libre={selLibre}
              onToggle={() => alToggleLibre(sel)}
            />
            <Drawer.Close asChild>
              <button
                type="button"
                className="mt-5 h-11 w-full rounded-full bg-accent text-sm font-semibold text-accent-fg"
              >
                Cerrar
              </button>
            </Drawer.Close>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </AppShell>
  );
}
