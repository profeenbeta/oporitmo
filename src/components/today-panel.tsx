import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { BloqueMarca } from "@/components/bloque-marca";
import { ConfetiAnimo } from "@/components/confeti-animo";
import { fraseAnimo } from "@/lib/oporitmo/animo";
import {
  faseEstudio,
  formatFechaCorta,
  formatHoras,
  formatMinutos,
  horasDelDia,
  hoyISO,
  minutosDelDia,
} from "@/lib/oporitmo/math";
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

const FOCO: Record<string, string> = {
  repaso: "Repaso",
  profundizar: "Cerrar vueltas",
  nuevo: "Ampliar cobertura",
  acabar: "Retomar",
  descanso: "Descanso",
  examen: "Examen",
  hecho: "Hecho",
  antes: "Aún no",
  fin: "Fuera de periodo",
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

  const horasHoy = horasDelDia(hoyISO(), config, override);
  const dedicadas = minutosDelDia(sesiones, hoyISO());
  const fase = faseEstudio(hoyISO(), config);

  const semana = useMemo(
    () => planSemana({ config, temas, sesiones, bloques, simulacros }, override),
    [config, temas, sesiones, bloques, simulacros, override],
  );
  const olvidados = listarOlvidados(temas, config.vueltas);

  function registrar(id: number, terminar: boolean) {
    const mins = minutos ? Number(minutos) : 0;
    const tema = temas.find((t) => t.id === id);
    registrarSesion(id, Number.isFinite(mins) ? mins : 0, terminar);
    setMinutos("");
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

  return (
    <section className="mt-5 rounded-xl border border-line bg-surface p-5">
      {animo && (
        <ConfetiAnimo
          titulo={animo.titulo}
          texto={animo.texto}
          detalle={animo.detalle}
          onCerrar={() => setAnimo(null)}
        />
      )}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Qué hacer hoy</h2>
          <p className="mt-1 text-xs text-muted">
            Llevas {formatMinutos(dedicadas)} registradas
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          Horas de hoy
          <input
            type="number"
            min={0}
            max={14}
            step={0.5}
            value={horasHoy}
            onChange={(e) => setHorasHoy(Number(e.target.value))}
            className="h-11 w-20 rounded-md border border-line bg-bg px-2 text-center text-ink tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      {olvidados.length > 0 && fase === "estudio" && (
        <Link
          to="/temas"
          search={{ ver: "olvidados" }}
          className="mb-4 block rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm"
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
      )}

      {fase === "antes" ? (
        <div className="rounded-lg bg-surface-2 px-4 py-5">
          <p className="font-medium">El estudio aún no empieza.</p>
          <p className="mt-1 text-sm text-muted">
            El primer día es el {formatFechaCorta(config.fechaInicio)}. Hasta
            entonces el calendario queda en blanco.
          </p>
        </div>
      ) : fase === "despues" ? (
        <div className="rounded-lg bg-surface-2 px-4 py-5">
          <p className="font-medium">Se acabó el periodo de estudio.</p>
          <p className="mt-1 text-sm text-muted">
            El último día era el {formatFechaCorta(config.fechaFin)}. Puedes
            alargarlo en Ajustes si lo necesitas.
          </p>
        </div>
      ) : fase === "examen" ? (
        <div className="rounded-lg bg-accent-soft px-4 py-5">
          <p className="font-medium">Hoy es el examen.</p>
          <p className="mt-1 text-sm text-muted">
            Suerte. El plan de vueltas ya no toca.
          </p>
        </div>
      ) : horasHoy === 0 ? (
        <div className="rounded-lg bg-surface-2 px-4 py-5">
          <p className="font-medium">Hoy no hay horas en tu horario.</p>
          <p className="mt-1 text-sm text-muted">
            Si hay un tema a medias, espera al próximo día con tiempo. Un día
            malo no rompe el ritmo.
          </p>
        </div>
      ) : !principal ? (
        <p className="text-muted">
          No hay una sugerencia clara. Revisa los temas o los ajustes.
        </p>
      ) : (
        <>
          <article className="rounded-lg bg-accent-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              {TIPO[principal.tipo]}
            </p>
            {bloqueHoy && (
              <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                <BloqueMarca color={bloqueHoy.color} />
                {bloqueHoy.nombre}
              </p>
            )}
            <h3 className="mt-1 font-display text-2xl font-semibold">
              {tituloPrincipal}
            </h3>
            <p className="mt-1 text-sm text-ink/80">{principal.motivo}</p>
            {principal.tema.tiempoInvertido > 0 && (
              <p className="mt-2 text-sm text-muted">
                Ya le has dedicado {formatHoras(principal.tema.tiempoInvertido)}
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-muted">
                Minutos de esta sesión
                <input
                  type="number"
                  min={0}
                  max={480}
                  placeholder="0"
                  value={minutos}
                  onChange={(e) => setMinutos(e.target.value)}
                  className="h-11 w-20 rounded-md border border-line bg-surface px-2 text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => registrar(principal.tema.id, true)}
                  className="h-11 flex-1 rounded-md bg-accent px-4 text-sm font-semibold text-accent-fg hover:opacity-90"
                >
                  Terminado
                </button>
                <button
                  type="button"
                  onClick={() => registrar(principal.tema.id, false)}
                  className="h-11 flex-1 rounded-md border border-line bg-surface px-4 text-sm font-medium"
                >
                  A medias
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saltarHoy(principal.tema.id);
                    toast("Lo dejamos para otro día.");
                  }}
                  className="h-11 rounded-md border border-line px-4 text-sm font-medium hover:bg-bg"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </article>

          {secundarias.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted">
                También puedes
              </p>
              <ul className="space-y-2">
                {secundarias.map((s) => (
                  <li
                    key={s.tema.id}
                    className="flex items-center justify-between gap-3 rounded-md bg-surface-2 px-3 py-3"
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
                        className="h-11 rounded-md border border-line bg-surface px-3 text-xs font-medium"
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

      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="font-display text-lg font-semibold">Esta semana</h3>
          <Link
            to="/calendario"
            className="text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Ver mes
          </Link>
        </div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {semana.map((d) => (
            <li
              key={d.fecha}
              className={cn(
                "rounded-md border px-3 py-2.5",
                d.esHoy
                  ? "border-accent/30 bg-accent-soft"
                  : "border-transparent bg-surface-2",
              )}
            >
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold">{etiquetaDia(d.fecha)}</p>
                <p className="text-xs tabular-nums text-muted">
                  {formatHoras(d.horas)}
                </p>
              </div>
              <p className="text-sm">{FOCO[d.foco]}</p>
              <p className="text-xs text-muted">
                {d.items.map((i) => i.titulo).join(" · ") || "Sin tarea fija"}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
