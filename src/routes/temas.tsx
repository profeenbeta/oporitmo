import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { BloqueMarca, PaletaColor } from "@/components/bloque-marca";
import { HojaOpciones } from "@/components/hoja-opciones";
import { COLOR_BLOQUE_CLASE, COLORES_BLOQUE, siguienteColor } from "@/lib/oporitmo/bloques";
import { diasEntre, formatHoras, formatMinutos, hoyISO } from "@/lib/oporitmo/math";
import { parseListado } from "@/lib/oporitmo/temarios";
import { ESTADOS, type Estado, type Tema } from "@/lib/oporitmo/types";
import { esOlvidado, ordinalVuelta } from "@/lib/oporitmo/vueltas";
import { useOpoStore } from "@/lib/oporitmo/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/temas")({
  validateSearch: (s: Record<string, unknown>) => ({
    ver: s.ver === "olvidados" ? ("olvidados" as const) : undefined,
  }),
  component: TemasPage,
});

type Filtro =
  | "todos"
  | "olvidados"
  | "pendientes"
  | "preparados"
  | `vuelta:${number}`
  | `bloque:${string}`;

function TemasPage() {
  const [ready, setReady] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [pegar, setPegar] = useState(false);
  const [borrador, setBorrador] = useState("");
  const [arrastrando, setArrastrando] = useState<number | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [nombreBloque, setNombreBloque] = useState("");
  const [colorNuevo, setColorNuevo] = useState(siguienteColor([]));
  const [agrupar, setAgrupar] = useState(true);
  const [estadoId, setEstadoId] = useState<number | null>(null);
  const [bloqueTemaId, setBloqueTemaId] = useState<number | null>(null);
  const [selTema, setSelTema] = useState<number | null>(null);

  const temas = useOpoStore((s) => s.temas);
  const bloques = useOpoStore((s) => s.bloques);
  const vueltas = useOpoStore((s) => s.config.vueltas);
  const search = Route.useSearch();
  const cambiarEstado = useOpoStore((s) => s.cambiarEstado);
  const renombrarTema = useOpoStore((s) => s.renombrarTema);
  const aplicarListado = useOpoStore((s) => s.aplicarListado);
  const reordenarTemas = useOpoStore((s) => s.reordenarTemas);
  const moverTema = useOpoStore((s) => s.moverTema);
  const crearBloque = useOpoStore((s) => s.crearBloque);
  const renombrarBloque = useOpoStore((s) => s.renombrarBloque);
  const colorBloque = useOpoStore((s) => s.colorBloque);
  const borrarBloque = useOpoStore((s) => s.borrarBloque);
  const asignarBloque = useOpoStore((s) => s.asignarBloque);

  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (search.ver === "olvidados") setFiltro("olvidados");
  }, [search.ver]);

  const parseados = useMemo(() => parseListado(borrador), [borrador]);
  const chips = useMemo(() => {
    const vueltasChips = vueltas.map((_, i) => ({
      id: `vuelta:${i + 1}` as Filtro,
      label: ordinalVuelta(i + 1),
    }));
    return [
      { id: "todos" as Filtro, label: "Todos" },
      { id: "olvidados" as Filtro, label: "Olvidados" },
      { id: "pendientes" as Filtro, label: "Pendientes" },
      ...vueltasChips,
      { id: "preparados" as Filtro, label: "Preparados" },
    ];
  }, [vueltas]);

  useEffect(() => {
    if (!filtro.startsWith("vuelta:")) return;
    const n = Number(filtro.slice(7));
    if (!Number.isFinite(n) || n < 1 || n > vueltas.length) setFiltro("todos");
  }, [filtro, vueltas.length]);
  const filtroBloque = filtro.startsWith("bloque:") ? filtro.slice(7) : null;
  const sePuedeOrdenar =
    filtro === "todos" && busqueda.trim().length === 0 && !agrupar;

  const lista = useMemo(() => {
    const hoy = hoyISO();
    const q = busqueda.trim().toLowerCase();
    return [...temas]
      .sort((a, b) => (a.orden ?? a.id) - (b.orden ?? b.id) || a.id - b.id)
      .filter((t) => {
        if (filtroBloque) return t.bloqueId === filtroBloque;
        if (filtro === "olvidados") return esOlvidado(t, vueltas);
        if (filtro === "todos" || filtro.startsWith("bloque:")) return true;
        if (filtro === "pendientes") return (t.vuelta ?? 0) <= 0;
        if (filtro === "preparados") return (t.vuelta ?? 0) > vueltas.length;
        if (filtro.startsWith("vuelta:")) {
          return (t.vuelta ?? 0) === Number(filtro.slice(7));
        }
        return true;
      })
      .filter((t) =>
        q.length === 0 ? true : `${t.id} ${t.titulo}`.toLowerCase().includes(q),
      )
      .map((t) => ({
        ...t,
        dias: t.ultimoTrabajo ? diasEntre(t.ultimoTrabajo, hoy) : null,
      }));
  }, [temas, filtro, busqueda, filtroBloque, vueltas]);

  const grupos = useMemo(() => {
    if (!agrupar || bloques.length === 0) {
      return [{ id: null as string | null, nombre: null as string | null, items: lista }];
    }
    const porId = new Map<string | null, typeof lista>();
    for (const b of bloques) porId.set(b.id, []);
    porId.set(null, []);
    for (const t of lista) {
      const key = t.bloqueId && porId.has(t.bloqueId) ? t.bloqueId : null;
      porId.get(key)?.push(t);
    }
    const sections = bloques.map((b) => ({
      id: b.id as string | null,
      nombre: b.nombre as string | null,
      items: porId.get(b.id) ?? [],
    }));
    const sueltos = porId.get(null) ?? [];
    if (sueltos.length) sections.push({ id: null, nombre: "Sin bloque", items: sueltos });
    return sections.filter((s) => s.items.length > 0 || s.id !== null);
  }, [agrupar, bloques, lista]);

  function aplicar(titulos: string[]) {
    if (titulos.length === 0) {
      toast("No hay títulos que aplicar");
      return;
    }
    aplicarListado(titulos);
    setPegar(false);
    setBorrador("");
    toast(`${titulos.length} temas actualizados. Se conservan los estados.`);
  }

  if (!ready) {
    return (
      <AppShell>
        <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h2 className="font-display text-2xl font-semibold">Temas</h2>
      <p className="mt-1 text-sm text-muted">
        Agrupa por bloques y ponle un color a cada uno. El orden de estudio se
        cambia con las flechas.
      </p>

      <div className="xl:mt-4 xl:grid xl:grid-cols-[minmax(0,_1fr)_20rem] xl:items-start xl:gap-6">
      <div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar tema"
          className="h-11 flex-1 rounded-full border-0 bg-surface-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="button"
          onClick={() => setPegar((v) => !v)}
          className="h-11 rounded-full border-0 bg-surface-2 px-4 text-sm font-medium"
        >
          {pegar ? "Cerrar listado" : "Pegar listado"}
        </button>
      </div>

      {pegar && (
        <div className="mt-3 card p-4">
          <p className="text-sm text-muted">
            Un título por línea. Si vienen numerados, se quita el número. El
            total de temas pasará a ser el de las líneas; los estados se
            conservan.
          </p>
          <textarea
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            rows={8}
            placeholder={"Calentamiento\nCondición física\nJuego motor"}
            className="mt-3 w-full rounded-2xl border-0 bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <p className="mt-2 text-xs text-muted">
            {parseados.length === 0
              ? "Ninguna línea todavía"
              : `${parseados.length} títulos detectados`}
          </p>
          <button
            type="button"
            onClick={() => aplicar(parseados)}
            className="mt-3 h-11 w-full rounded-full bg-accent px-4 text-sm font-semibold text-accent-fg"
          >
            Aplicar listado
          </button>
        </div>
      )}

      <section className="mt-4 card p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Bloques
          </p>
          <button
            type="button"
            onClick={() => {
              setColorNuevo(siguienteColor(bloques.map((b) => b.color)));
              setNuevo((v) => !v);
            }}
            className="inline-flex h-10 items-center gap-1 rounded-full px-2 text-sm font-medium text-accent"
          >
            <Plus className="size-4" strokeWidth={2} />
            Nuevo
          </button>
        </div>

        {bloques.length === 0 && !nuevo && (
          <p className="mt-2 text-sm text-muted">
            Por ejemplo: Didáctica, Condición física, Juego.
          </p>
        )}

        <ul className="mt-3 space-y-2">
          {bloques.map((b) => (
            <li key={b.id} className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Color de ${b.nombre}`}
                onClick={() => {
                  const i = COLORES_BLOQUE.indexOf(b.color);
                  colorBloque(b.id, COLORES_BLOQUE[(i + 1) % COLORES_BLOQUE.length]!);
                }}
                className={cn("size-8 shrink-0 rounded-full", COLOR_BLOQUE_CLASE[b.color])}
              />
              <input
                key={`${b.id}-${b.nombre}`}
                defaultValue={b.nombre}
                onBlur={(e) => renombrarBloque(b.id, e.target.value)}
                className="h-11 min-w-0 flex-1 rounded-full bg-bg px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="button"
                aria-label={`Borrar ${b.nombre}`}
                onClick={() => borrarBloque(b.id)}
                className="grid size-11 shrink-0 place-items-center rounded-full text-muted"
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>

        {nuevo && (
          <div className="mt-3 space-y-3 rounded-lg bg-bg p-3">
            <input
              value={nombreBloque}
              onChange={(e) => setNombreBloque(e.target.value)}
              placeholder="Nombre del bloque"
              className="h-11 w-full rounded-full border-0 bg-surface-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <PaletaColor value={colorNuevo} onChange={setColorNuevo} />
            <button
              type="button"
              onClick={() => {
                if (!nombreBloque.trim()) {
                  toast("Ponle un nombre al bloque");
                  return;
                }
                crearBloque(nombreBloque, colorNuevo);
                setNombreBloque("");
                setNuevo(false);
              }}
              className="h-11 w-full rounded-full bg-accent text-sm font-semibold text-accent-fg"
            >
              Crear bloque
            </button>
          </div>
        )}
      </section>

      <div className="mt-4 flex flex-wrap gap-1 pb-1">
        {chips.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={cn(
              "pill shrink-0",
              filtro === f.id ? "pill-on" : "pill-off",
            )}
          >
            {f.label}
          </button>
        ))}
        {bloques.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setFiltro(`bloque:${b.id}`)}
            className={cn(
              "pill shrink-0 gap-2",
              filtro === `bloque:${b.id}` ? "pill-on" : "pill-off",
            )}
          >
            <BloqueMarca color={b.color} className="size-2" />
            {b.nombre}
          </button>
        ))}
      </div>

      {bloques.length > 0 && (
        <label className="mt-3 flex h-11 items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={agrupar}
            onChange={(e) => setAgrupar(e.target.checked)}
            className="size-4 accent-[var(--accent)]"
          />
          Agrupar por bloque
        </label>
      )}

      {grupos.map((g) => (
        <div key={g.id ?? "sueltos"} className="mt-4">
          {g.nombre && (
            <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">
              {g.id && (
                <BloqueMarca
                  color={bloques.find((b) => b.id === g.id)?.color}
                />
              )}
              {g.nombre}
            </p>
          )}
          <ul className="space-y-2">
            {g.items.map((t, i) => (
              <TemaFila
                key={t.id}
                t={t}
                i={i}
                total={g.items.length}
                sePuedeOrdenar={sePuedeOrdenar}
                arrastrando={arrastrando}
                setArrastrando={setArrastrando}
                reordenarTemas={reordenarTemas}
                moverTema={moverTema}
                renombrarTema={renombrarTema}
                seleccionado={selTema === t.id}
                onSeleccionar={() => setSelTema(t.id)}
                onElegirEstado={() => setEstadoId(t.id)}
                onElegirBloque={() => setBloqueTemaId(t.id)}
              />
            ))}
          </ul>
        </div>
      ))}

      {lista.length === 0 && (
        <div className="card mt-6 px-5 py-6">
          <p className="font-medium">
            {filtro === "olvidados"
              ? "Ningún tema se está enfriando."
              : "Nada con ese filtro."}
          </p>
          <p className="mt-1 text-sm text-muted">
            {filtro === "olvidados"
              ? "Cuando pase el intervalo de repaso, saldrá aquí."
              : "Prueba otro filtro o pega un listado."}
          </p>
          {filtro !== "todos" ? (
            <button
              type="button"
              onClick={() => setFiltro("todos")}
              className="mt-4 h-11 rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg"
            >
              Ver todos
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPegar(true)}
              className="mt-4 h-11 rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg"
            >
              Pegar listado
            </button>
          )}
        </div>
      )}

      </div>

      <TemaInspector id={selTema} />
      </div>

      <HojaOpciones
        open={estadoId != null}
        onOpenChange={(open) => {
          if (!open) setEstadoId(null);
        }}
        titulo="Estado"
        descripcion={temas.find((t) => t.id === estadoId)?.titulo}
        opciones={(Object.keys(ESTADOS) as Estado[]).map((k) => ({
          id: k,
          label: ESTADOS[k],
        }))}
        valor={temas.find((t) => t.id === estadoId)?.estado ?? ""}
        onElegir={(id) => {
          if (estadoId != null) cambiarEstado(estadoId, id as Estado);
        }}
      />
      <HojaOpciones
        open={bloqueTemaId != null}
        onOpenChange={(open) => {
          if (!open) setBloqueTemaId(null);
        }}
        titulo="Bloque"
        descripcion={temas.find((t) => t.id === bloqueTemaId)?.titulo}
        opciones={[
          { id: "", label: "Sin bloque" },
          ...bloques.map((b) => ({ id: b.id, label: b.nombre })),
        ]}
        valor={temas.find((t) => t.id === bloqueTemaId)?.bloqueId ?? ""}
        onElegir={(id) => {
          if (bloqueTemaId != null) asignarBloque(bloqueTemaId, id || null);
        }}
      />
    </AppShell>
  );
}

function TemaInspector({ id }: { id: number | null }) {
  const temas = useOpoStore((s) => s.temas);
  const bloques = useOpoStore((s) => s.bloques);
  const vueltas = useOpoStore((s) => s.config.vueltas);
  const simulacros = useOpoStore((s) => s.simulacros);
  const cambiarEstado = useOpoStore((s) => s.cambiarEstado);
  const asignarBloque = useOpoStore((s) => s.asignarBloque);
  const renombrarTema = useOpoStore((s) => s.renombrarTema);
  const t = temas.find((x) => x.id === id);
  const nVueltas = vueltas.length;
  const tiempos = simulacros
    .filter((s) => s.temaId === t?.id)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id));
  const olvidado = t ? esOlvidado(t, vueltas) : false;
  const dias = t?.ultimoTrabajo ? diasEntre(t.ultimoTrabajo, hoyISO()) : null;

  return (
    <aside className="sticky top-8 mt-6 hidden xl:block xl:mt-0">
      <div className="card p-5">
        {!t ? (
          <>
            <p className="kicker">Detalle</p>
            <p className="mt-2 text-sm text-muted">
              Elige un tema de la lista para cambiar estado, bloque y ver
              tiempos.
            </p>
          </>
        ) : (
          <>
            <p className="kicker">Tema {t.id}</p>
            <input
              key={`${t.id}-${t.titulo}`}
              defaultValue={t.titulo}
              onBlur={(e) => renombrarTema(t.id, e.target.value)}
              aria-label={`Nombre del tema ${t.id}`}
              className="mt-1 h-11 w-full bg-transparent font-display text-xl font-semibold focus:outline-none"
            />
            <p className="mt-1 text-sm text-muted">
              {dias === null
                ? "Nunca trabajado"
                : `Último: hace ${dias} día${dias === 1 ? "" : "s"}`}
              {" · "}
              {formatHoras(t.tiempoInvertido)} dedicadas
              {t.vuelta > 0 &&
                ` · ${
                  t.vuelta > nVueltas
                    ? "Preparado"
                    : `${ordinalVuelta(t.vuelta)} de ${nVueltas}`
                }`}
            </p>
            {(t.pendiente || olvidado) && (
              <p className="mt-2 text-sm">
                {t.pendiente && <span className="text-accent">A medias</span>}
                {t.pendiente && olvidado && " · "}
                {olvidado && <span className="text-warn">Olvidado</span>}
              </p>
            )}

            <p className="kicker mt-5">Estado</p>
            <ul className="mt-2 overflow-hidden rounded-2xl bg-surface-2">
              {(Object.keys(ESTADOS) as Estado[]).map((k) => (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => cambiarEstado(t.id, k)}
                    className={cn(
                      "flex h-11 w-full items-center justify-between px-3 text-left text-sm",
                      t.estado === k && "font-semibold text-accent",
                    )}
                  >
                    {ESTADOS[k]}
                    {t.estado === k && " ·"}
                  </button>
                </li>
              ))}
            </ul>

            {bloques.length > 0 && (
              <>
                <p className="kicker mt-5">Bloque</p>
                <ul className="mt-2 flex flex-wrap gap-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => asignarBloque(t.id, null)}
                      className={cn(
                        "pill",
                        !t.bloqueId ? "pill-on" : "pill-off",
                      )}
                    >
                      Sin bloque
                    </button>
                  </li>
                  {bloques.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => asignarBloque(t.id, b.id)}
                        className={cn(
                          "pill gap-2",
                          t.bloqueId === b.id ? "pill-on" : "pill-off",
                        )}
                      >
                        <BloqueMarca color={b.color} className="size-2" />
                        {b.nombre}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {tiempos.length > 0 && (
              <>
                <p className="kicker mt-5">Simulacros</p>
                <ul className="mt-2 space-y-1">
                  {tiempos.slice(-6).map((s, idx, arr) => {
                    const prev = idx > 0 ? arr[idx - 1] : null;
                    const delta = prev ? s.minutos - prev.minutos : 0;
                    return (
                      <li
                        key={s.id}
                        className="flex justify-between text-sm text-muted"
                      >
                        <span>
                          {s.fecha.slice(8, 10)}/{s.fecha.slice(5, 7)}
                        </span>
                        <span className="tabular-nums text-ink">
                          {formatMinutos(s.minutos)}
                          {delta < 0 && (
                            <span className="text-accent"> · más rápido</span>
                          )}
                          {delta > 0 && (
                            <span className="text-warn"> · más lento</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

function TemaFila({
  t,
  i,
  total,
  sePuedeOrdenar,
  arrastrando,
  setArrastrando,
  reordenarTemas,
  moverTema,
  renombrarTema,
  seleccionado,
  onSeleccionar,
  onElegirEstado,
  onElegirBloque,
}: {
  t: Tema & { dias: number | null };
  i: number;
  total: number;
  sePuedeOrdenar: boolean;
  arrastrando: number | null;
  setArrastrando: (id: number | null) => void;
  reordenarTemas: (a: number, b: number) => void;
  moverTema: (id: number, d: -1 | 1) => void;
  renombrarTema: (id: number, titulo: string) => void;
  seleccionado: boolean;
  onSeleccionar: () => void;
  onElegirEstado: () => void;
  onElegirBloque: () => void;
}) {
  const bloques = useOpoStore((s) => s.bloques);
  const vueltas = useOpoStore((s) => s.config.vueltas);
  const simulacros = useOpoStore((s) => s.simulacros);
  const nVueltas = vueltas.length;
  const bloque = bloques.find((b) => b.id === t.bloqueId);
  const tiempos = simulacros
    .filter((s) => s.temaId === t.id)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id.localeCompare(b.id));
  const olvidado = esOlvidado(t, vueltas);

  return (
    <li
      onClick={onSeleccionar}
      onDragOver={(e) => {
        if (!sePuedeOrdenar || arrastrando == null) return;
        e.preventDefault();
      }}
      onDrop={() => {
        if (arrastrando != null) reordenarTemas(arrastrando, t.id);
        setArrastrando(null);
      }}
      className={cn(
        "card px-3 py-3",
        arrastrando === t.id && "opacity-50",
        seleccionado && "ring-2 ring-ink",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-1 w-1 self-stretch rounded-full",
            bloque ? COLOR_BLOQUE_CLASE[bloque.color] : "bg-line",
          )}
        />
        {sePuedeOrdenar && (
          <div className="flex shrink-0 flex-col items-center pt-0.5">
            <button
              type="button"
              aria-label="Subir"
              disabled={i === 0}
              onClick={() => moverTema(t.id, -1)}
              className="grid size-8 place-items-center rounded-full text-muted disabled:opacity-30"
            >
              <ChevronUp className="size-4" strokeWidth={2} />
            </button>
            <span
              draggable={sePuedeOrdenar}
              onDragStart={() => setArrastrando(t.id)}
              onDragEnd={() => setArrastrando(null)}
              className="cursor-grab text-faint active:cursor-grabbing"
            >
              <GripVertical className="size-4" strokeWidth={1.75} aria-hidden />
            </span>
            <button
              type="button"
              aria-label="Bajar"
              disabled={i === total - 1}
              onClick={() => moverTema(t.id, 1)}
              className="grid size-8 place-items-center rounded-full text-muted disabled:opacity-30"
            >
              <ChevronDown className="size-4" strokeWidth={2} />
            </button>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-xs tabular-nums text-muted">
              {t.id}
            </span>
            <input
              key={`${t.id}-${t.titulo}`}
              defaultValue={t.titulo}
              onBlur={(e) => renombrarTema(t.id, e.target.value)}
              aria-label={`Nombre del tema ${t.id}`}
              className="h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold focus:outline-none"
            />
            {t.pendiente && (
              <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                A medias
              </span>
            )}
            {olvidado && (
              <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warn">
                Olvidado
              </span>
            )}
          </div>
          <p className="text-xs text-muted">
            {t.dias === null
              ? "Nunca trabajado"
              : `Último: hace ${t.dias} día${t.dias === 1 ? "" : "s"}`}
            {" · "}
            {formatHoras(t.tiempoInvertido)} dedicadas
            {t.vuelta > 0 &&
              ` · ${
                t.vuelta > nVueltas
                  ? "Preparado"
                  : `${ordinalVuelta(t.vuelta)} de ${nVueltas}`
              }`}
          </p>
          {tiempos.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-line pt-2">
              {tiempos.slice(-4).map((s, idx, arr) => {
                const prev = idx > 0 ? arr[idx - 1] : null;
                const delta = prev ? s.minutos - prev.minutos : 0;
                return (
                  <li
                    key={s.id}
                    className="flex items-baseline justify-between gap-2 text-xs text-muted"
                  >
                    <span>
                      {s.fecha.slice(8, 10)}/{s.fecha.slice(5, 7)}
                    </span>
                    <span className="tabular-nums text-ink">
                      {formatMinutos(s.minutos)}
                      {delta < 0 && (
                        <span className="text-accent"> · más rápido</span>
                      )}
                      {delta > 0 && (
                        <span className="text-warn"> · más lento</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {bloques.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onElegirBloque();
              }}
              className="mt-2 h-10 rounded-full bg-surface-2 px-3 text-sm font-medium xl:hidden"
            >
              {bloque?.nombre ?? "Sin bloque"}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onElegirEstado();
          }}
          className="h-11 shrink-0 rounded-full bg-surface-2 px-3 text-sm font-medium xl:hidden"
        >
          {ESTADOS[t.estado]}
        </button>
      </div>
    </li>
  );
}
