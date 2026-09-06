import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BloqueMarca } from "@/components/bloque-marca";
import { ConfetiAnimo } from "@/components/confeti-animo";
import { CoverageCard } from "@/components/coverage-card";
import { fraseAnimo } from "@/lib/oporitmo/animo";
import {
  faseEstudio,
  formatFechaCorta,
  formatHoras,
  formatMinutos,
  horasDelDia,
  hoyISO,
  minutosDelDia,
  diasRestantes,
  esDiaLibre,
} from "@/lib/oporitmo/math";
import { useReentrada } from "@/lib/oporitmo/reentrada";
import { fraseRitmoFecha } from "@/lib/oporitmo/ritmo";
import { etiquetaDia, planSemana } from "@/lib/oporitmo/suggestions";
import type { Sugerencia, TipoAccion } from "@/lib/oporitmo/types";
import { listarOlvidados } from "@/lib/oporitmo/vueltas";
import { useOpoStore } from "@/lib/oporitmo/store";
import { cn } from "@/lib/utils";

const TIPO: Record<TipoAccion, string> = {
  repaso: "Repaso",
  profundizar: "Profundizar",
  nuevo: "Nuevo",
  acabar: "Acabar",
};

const FOCO_CORTO: Record<string, string> = {
  repaso: "Repaso",
  profundizar: "Vueltas",
  nuevo: "Nuevo",
  acabar: "Acabar",
  descanso: "Libre",
  examen: "Examen",
  hecho: "Hecho",
  antes: "—",
  fin: "—",
};

export function TodayPanel({
  principal,
  secundarias,
}: {
  principal: Sugerencia | null;
  secundarias: Sugerencia[];
}) {
  const override = useOpoStore((s) => s.horasHoyOverride);
  const setHorasHoy = useOpoStore((s) => s.setHorasHoy);
  const registrarSesion = useOpoStore((s) => s.registrarSesion);
  const saltarHoy = useOpoStore((s) => s.saltarHoy);
  const config = useOpoStore((s) => s.config);
  const temas = useOpoStore((s) => s.temas);
  const sesiones = useOpoStore((s) => s.sesiones);
  const bloques = useOpoStore((s) => s.bloques);
  const simulacros = useOpoStore((s) => s.simulacros);
  const [minutos, setMinutos] = useState("");
  const [animo, setAnimo] = useState<{
    titulo: string;
    texto: string;
    detalle: string;
  } | null>(null);
  const { visible: reentrada, descartar: descartarReentrada } = useReentrada();

  const horasHoy = horasDelDia(hoyISO(), config, override);
  const dedicadas = minutosDelDia(sesiones, hoyISO());
  const fase = faseEstudio(hoyISO(), config);

  const semana = useMemo(
    () => planSemana({ config, temas, sesiones, bloques, simulacros }, override),
    [config, temas, sesiones, bloques, simulacros, override],
  );
  const olvidados = listarOlvidados(temas, config.vueltas);
  const fraseRitmo = useMemo(
    () =>
      fraseRitmoFecha({ config, temas, sesiones, bloques, simulacros }),
    [config, temas, sesiones, bloques, simulacros],
  );

  function registrar(id: number, terminar: boolean) {
    const mins = minutos ? Number(minutos) : 0;
    const tema = temas.find((t) => t.id === id);
    registrarSesion(id, Number.isFinite(mins) ? mins : 0, terminar);
    setMinutos("");
    descartarReentrada();
    if (terminar && tema) {
      const frase = fraseAnimo(tema.vuelta ?? 0, config.vueltas.length);
      setAnimo({ ...frase, detalle: tema.titulo });
      return;
    }
    toast("Queda a medias. Mañana saldrá para acabarlo.");
  }

  const tituloPrincipal =
    principal?.tipo === "acabar"
      ? `Acabar de estudiar ${principal.tema.titulo}`
      : principal?.tema.titulo;
  const bloqueHoy = principal
    ? bloques.find((b) => b.id === principal.tema.bloqueId)
    : undefined;
  const data = { config, temas, sesiones, bloques, simulacros };

  const avisoOlvidados =
    olvidados.length > 0 && fase === "estudio" ? (
      <Link
        to="/temas"
        search={{ ver: "olvidados" }}
        className="block card px-4 py-3 text-sm"
      >
        <span className="font-medium">
          {olvidados.length} tema
          {olvidados.length === 1 ? "" : "s"} olvidado
          {olvidados.length === 1 ? "" : "s"}
        </span>
        <span className="text-muted">
          {" · "}llevan más que su intervalo. Ábrelos en Temas.
        </span>
      </Link>
    ) : null;

  return (
    <section>
      {animo && (
        <ConfetiAnimo
          titulo={animo.titulo}
          texto={animo.texto}
          detalle={animo.detalle}
          onCerrar={() => setAnimo(null)}
        />
      )}
      <div className="2xl:grid 2xl:grid-cols-[minmax(0,_1.15fr)_minmax(18rem,_0.85fr)] 2xl:items-start 2xl:gap-6">
        <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Hoy</p>
          <h2 className="font-display text-2xl font-semibold">Qué hacer</h2>
          <p className="mt-1 text-sm text-muted">
            Llevas {formatMinutos(dedicadas)} registradas
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          Horas hoy
          <input
            type="number"
            min={0}
            max={14}
            step={0.5}
            value={horasHoy}
            onChange={(e) => setHorasHoy(Number(e.target.value))}
            className="h-11 w-20 rounded-full border-0 bg-surface-2 px-2 text-center text-ink tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      {avisoOlvidados && <div className="mb-3 2xl:hidden">{avisoOlvidados}</div>}

      {reentrada && (
        <div className="mb-3 card px-4 py-4" role="status">
          <p className="text-sm text-ink">
            Han pasado unos días. Hoy puedes retomar por aquí.
          </p>
          <button
            type="button"
            onClick={descartarReentrada}
            className="mt-3 h-11 w-full rounded-full bg-surface-2 text-sm font-medium sm:w-auto sm:px-5"
          >
            Entendido
          </button>
        </div>
      )}

      {fase === "antes" ? (
        <div className="card px-5 py-6">
          <p className="font-medium">El estudio aún no empieza.</p>
          <p className="mt-1 text-sm text-muted">
            El primer día es el {formatFechaCorta(config.fechaInicio)}.
          </p>
          <Link
            to="/config"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg"
          >
            Cambiar fechas
          </Link>
        </div>
      ) : fase === "despues" ? (
        <div className="card px-5 py-6">
          <p className="font-medium">Se acabó el periodo de estudio.</p>
          <p className="mt-1 text-sm text-muted">
            El último día era el {formatFechaCorta(config.fechaFin)}.
          </p>
          <Link
            to="/config"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg"
          >
            Alargar el periodo
          </Link>
        </div>
      ) : fase === "examen" ? (
        <div className="card-hero px-5 py-6">
          <p className="font-medium">Hoy es el examen.</p>
          <p className="mt-1 text-sm text-muted">
            Suerte. El plan de vueltas ya no toca.
          </p>
        </div>
      ) : horasHoy === 0 ? (
        <div className="card px-5 py-6">
          <p className="font-medium">
            {esDiaLibre(hoyISO(), config.diasLibres)
              ? "Día libre"
              : "Hoy no hay horas en tu horario."}
          </p>
          <p className="mt-1 text-sm text-muted">
            {esDiaLibre(hoyISO(), config.diasLibres)
              ? "Hoy no cuenta como estudio. El plan se ajusta solo."
              : "Un día malo no rompe el ritmo. Si quieres, pon horas arriba."}
          </p>
        </div>
      ) : !principal ? (
        <div className="card px-5 py-6">
          <p className="font-medium">No hay un tema claro para hoy.</p>
          <p className="mt-1 text-sm text-muted">
            Revisa el listado o el orden de estudio.
          </p>
          <Link
            to="/temas"
            search={{ ver: undefined }}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg"
          >
            Ir a Temas
          </Link>
        </div>
      ) : (
        <>
          <article className="card-hero px-5 py-5">
            <p className="kicker text-accent">{TIPO[principal.tipo]}</p>
            {bloqueHoy && (
              <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                <BloqueMarca color={bloqueHoy.color} />
                {bloqueHoy.nombre}
              </p>
            )}
            <h3 className="mt-2 font-display text-3xl font-semibold leading-tight">
              {tituloPrincipal}
            </h3>
            <p className="mt-2 text-sm text-ink/80">{principal.motivo}</p>
            {principal.tema.tiempoInvertido > 0 && (
              <p className="mt-2 text-sm text-muted">
                Ya le has dedicado {formatHoras(principal.tema.tiempoInvertido)}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-muted">
                Minutos de esta sesión
                <input
                  type="number"
                  min={0}
                  max={480}
                  placeholder="p. ej. 45"
                  value={minutos}
                  onChange={(e) => setMinutos(e.target.value)}
                  className="h-11 w-20 rounded-full border-0 bg-surface-2 px-2 text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <button
                type="button"
                onClick={() => registrar(principal.tema.id, true)}
                className="h-12 w-full rounded-full bg-accent text-base font-semibold text-accent-fg"
              >
                Terminado
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => registrar(principal.tema.id, false)}
                  className="h-11 flex-1 rounded-full bg-surface-2 text-sm font-medium"
                >
                  A medias
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saltarHoy(principal.tema.id);
                    descartarReentrada();
                    toast("Lo dejamos para otro día.");
                  }}
                  className="h-11 flex-1 rounded-full bg-surface-2 text-sm font-medium"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </article>

          {secundarias.length > 0 && (
            <div className="mt-4">
              <p className="kicker mb-2">También puedes</p>
              <ul className="space-y-2">
                {secundarias.map((s) => (
                  <li
                    key={s.tema.id}
                    className="flex items-center justify-between gap-3 card px-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {s.tipo === "acabar"
                          ? `Acabar ${s.tema.titulo}`
                          : s.tema.titulo}
                      </p>
                      <p className="text-xs text-muted">{s.motivo}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => registrar(s.tema.id, true)}
                        className="h-11 rounded-full border-0 bg-surface-2 px-3 text-xs font-medium"
                      >
                        Terminado
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      {fraseRitmo && (
        <section
          className="mt-4 card px-4 py-4"
          aria-label="Ritmo respecto a la fecha"
        >
          <p className="text-sm text-ink">{fraseRitmo}</p>
        </section>
      )}
        </div>

        <div className="mt-4 flex min-w-0 flex-col gap-4 2xl:mt-0">
          <CoverageCard
            data={data}
            dias={diasRestantes(config.fechaFin || config.fechaExamen)}
          />
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="font-display text-lg font-semibold">Esta semana</h3>
          <Link
            to="/calendario"
            className="text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Ver mes
          </Link>
        </div>
        <ul className="grid grid-cols-7 gap-1.5">
          {semana.map((d) => (
            <li
              key={d.fecha}
              className={cn(
                "rounded-lg px-1 py-2 text-center",
                d.esHoy ? "card-hero card-static" : "card card-static",
              )}
            >
              <p className="text-xs font-medium text-muted">
                {etiquetaDia(d.fecha)}
              </p>
              <p
                className={cn(
                  "mt-1 text-xs font-semibold leading-tight",
                  d.foco === "descanso" && "text-faint",
                )}
              >
                {FOCO_CORTO[d.foco] ?? d.foco}
              </p>
            </li>
          ))}
        </ul>
      </div>
          {avisoOlvidados && (
            <div className="hidden 2xl:block">{avisoOlvidados}</div>
          )}
        </div>
      </div>
    </section>
  );
}
