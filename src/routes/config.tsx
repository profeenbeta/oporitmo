import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Coffee, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { ThemePicker } from "@/components/theme-sync";
import { AccountPanel } from "@/components/account-panel";
import { PwaInstall } from "@/components/pwa-install";
import { PreguntasFrecuentes } from "@/components/preguntas-frecuentes";
import { AppShell } from "@/components/app-shell";
import { leerCopia, COPIA_ACCEPT, COPIA_MIME, nombreCopia, textoCopia } from "@/lib/oporitmo/copia";
import { formatHoras, enteroAlSalir, normalizarHorasDia, sumaHoras, diasEntre, hoyISO } from "@/lib/oporitmo/math";
import { DIAS_SEMANA, type AppData } from "@/lib/oporitmo/types";
import { ordinalVuelta } from "@/lib/oporitmo/vueltas";
import { useOpoStore } from "@/lib/oporitmo/store";

export const Route = createFileRoute("/config")({ component: ConfigPage });

const fieldClass =
  "h-11 w-full rounded-full border-0 bg-surface-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent";

const PESTANAS = [
  { id: "cuenta", label: "Cuenta" },
  { id: "plan", label: "Plan" },
  { id: "pantalla", label: "Pantalla" },
  { id: "ayuda", label: "Ayuda" },
  { id: "delicada", label: "Zona delicada" },
] as const;

type Pestana = (typeof PESTANAS)[number]["id"];

const KEY_ULTIMA_COPIA = "oporitmo-ultima-copia";
const KEY_COPIA_SNOOZE = "oporitmo-copia-aviso";

function leerDiaLocal(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function guardarDiaLocal(clave: string, dia: string) {
  try {
    window.localStorage.setItem(clave, dia);
  } catch {
    /* almacenamiento bloqueado */
  }
}

function debeAvisarCopia(hayPlan: boolean, hoy: string): boolean {
  if (!hayPlan) return false;
  const ultima = leerDiaLocal(KEY_ULTIMA_COPIA);
  const snooze = leerDiaLocal(KEY_COPIA_SNOOZE);
  if (snooze && diasEntre(snooze, hoy) < 14 && (!ultima || snooze >= ultima)) {
    return false;
  }
  if (!ultima) return true;
  return diasEntre(ultima, hoy) >= 14;
}

function ConfigPage() {
  const [ready, setReady] = useState(false);
  const [pestana, setPestana] = useState<Pestana>("cuenta");
  const [avisoCopia, setAvisoCopia] = useState(false);
  const [totalDraft, setTotalDraft] = useState<string | null>(null);
  const [sorteoDraft, setSorteoDraft] = useState<string | null>(null);
  const [confirmCero, setConfirmCero] = useState(false);
  const [copiaPendiente, setCopiaPendiente] = useState<AppData | null>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const config = useOpoStore((s) => s.config);
  const temas = useOpoStore((s) => s.temas);
  const sesiones = useOpoStore((s) => s.sesiones);
  const actualizarConfig = useOpoStore((s) => s.actualizarConfig);
  const setHorasDia = useOpoStore((s) => s.setHorasDia);
  const resetDemo = useOpoStore((s) => s.resetDemo);
  const resetVacio = useOpoStore((s) => s.resetVacio);
  const abrirArranque = useOpoStore((s) => s.abrirArranque);
  const snapshotNube = useOpoStore((s) => s.snapshotNube);
  const importar = useOpoStore((s) => s.importar);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!ready) return;
    const hayPlan = temas.length > 0 || sesiones.length > 0;
    setAvisoCopia(debeAvisarCopia(hayPlan, hoyISO()));
  }, [ready, temas.length, sesiones.length]);

  const horasPorDia = normalizarHorasDia(config.horasPorDia);
  const vueltas = config.vueltas ?? [7, 14, 30];

  async function guardarCopia() {
    const cuerpo = textoCopia(snapshotNube());
    const nombre = nombreCopia();
    const blob = new Blob([cuerpo], { type: COPIA_MIME });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    guardarDiaLocal(KEY_ULTIMA_COPIA, hoyISO());
    setAvisoCopia(false);
    toast(
      "Listo. Guarda ese archivo donde no lo borres (Descargas, Drive, correo a ti…).",
    );
  }

  async function elegirCopia(lista: FileList | null) {
    const file = lista?.[0];
    if (archivoRef.current) archivoRef.current.value = "";
    if (!file) return;
    try {
      const raw = await file.text();
      const plan = leerCopia(raw);
      if (!plan) {
        toast("Ese archivo no se puede usar. El plan de este dispositivo no se ha tocado.");
        return;
      }
      setCopiaPendiente(plan);
    } catch {
      toast("Ese archivo no se puede usar. El plan de este dispositivo no se ha tocado.");
    }
  }

  function sustituirPlan() {
    if (!copiaPendiente) return;
    importar(copiaPendiente);
    setCopiaPendiente(null);
    toast("Plan restaurado.");
    void navigate({ to: "/" });
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
      <h2 className="font-display text-2xl font-semibold">Ajustes</h2>
      <p className="mt-1 text-sm text-muted">Cuenta y horario.</p>

      <nav
        role="tablist"
        aria-label="Secciones de ajustes"
        data-gesto
        className="mt-4 flex flex-wrap gap-2"
        onKeyDown={(e) => {
          const i = PESTANAS.findIndex((p) => p.id === pestana);
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            setPestana(PESTANAS[(i + 1) % PESTANAS.length]!.id);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            setPestana(PESTANAS[(i - 1 + PESTANAS.length) % PESTANAS.length]!.id);
          }
        }}
      >
        {PESTANAS.map((p) => {
          const activa = pestana === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              id={`tab-${p.id}`}
              aria-selected={activa}
              aria-controls={`panel-${p.id}`}
              tabIndex={activa ? 0 : -1}
              onClick={() => setPestana(p.id)}
              className={
                activa
                  ? "h-11 shrink-0 whitespace-nowrap rounded-full bg-accent px-4 text-sm font-semibold text-accent-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  : "h-11 shrink-0 whitespace-nowrap rounded-full bg-surface-2 px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              }
            >
              {p.label}
            </button>
          );
        })}
      </nav>

      <section
        id="panel-cuenta"
        role="tabpanel"
        aria-labelledby="tab-cuenta"
        hidden={pestana !== "cuenta"}
        className="mt-5"
      >
        <h3 className="font-display text-lg font-semibold">Cuenta y copias</h3>
        <div className="mt-3">
          <AccountPanel />
        </div>
        <section className="mt-4 card p-5">
          <h3 className="font-display text-xl font-semibold">
            Copia de seguridad
          </h3>
          <p className="mt-2 text-sm text-muted">
            Sin cuenta, el plan solo vive en este navegador. Una copia en archivo
            te permite recuperarlo después.
          </p>
          {avisoCopia && (
            <div className="mt-3 rounded-2xl bg-surface-2 px-4 py-3" role="status">
              <p className="text-sm">
                Hace un tiempo que no guardas una copia del plan. Si quieres,
                puedes hacerlo aquí.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void guardarCopia()}
                  className="h-11 flex-1 rounded-full bg-accent text-sm font-semibold text-accent-fg"
                >
                  Guardar una copia
                </button>
                <button
                  type="button"
                  onClick={() => {
                    guardarDiaLocal(KEY_COPIA_SNOOZE, hoyISO());
                    setAvisoCopia(false);
                  }}
                  className="h-11 rounded-full bg-surface px-4 text-sm font-medium"
                >
                  Ahora no
                </button>
              </div>
            </div>
          )}
          {!avisoCopia && (
            <button
              type="button"
              onClick={() => void guardarCopia()}
              className="mt-4 h-11 w-full rounded-full bg-surface-2 text-sm font-medium"
            >
              Guardar una copia
            </button>
          )}
          <button
            type="button"
            onClick={() => archivoRef.current?.click()}
            className="mt-2 h-11 w-full rounded-full bg-surface-2 text-sm font-medium"
          >
            Usar una copia guardada
          </button>
          <input
            ref={archivoRef}
            type="file"
            accept={COPIA_ACCEPT}
            className="sr-only"
            aria-label="Usar una copia guardada"
            onChange={(e) => void elegirCopia(e.target.files)}
          />
        </section>
      </section>

      <section
        id="panel-plan"
        role="tabpanel"
        aria-labelledby="tab-plan"
        hidden={pestana !== "plan"}
        className="mt-5"
      >
        <form
          className="space-y-4 card p-5"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <p className="mb-1 text-sm text-muted">Horas según el día</p>
            <p className="mb-3 text-xs text-muted">
              Pon 0 en los días que no estudias. En «Hoy» se puede cambiar sin
              tocar este horario.
            </p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {DIAS_SEMANA.map((dia, i) => (
                <label key={dia} className="block">
                  <span className="mb-1 block text-center text-xs text-muted">
                    {dia}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={14}
                    step={0.5}
                    value={horasPorDia[i]}
                    onChange={(e) => setHorasDia(i, Number(e.target.value) || 0)}
                    className="h-11 w-full rounded-full border-0 bg-surface-2 px-1 text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              En total: {formatHoras(sumaHoras(horasPorDia))} a la semana
            </p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Usar supuestos prácticos</p>
              <p className="mt-0.5 text-xs text-muted">
                Si tu oposición no los tiene, apágalo. El historial no se borra.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config.usarSupuestos !== false}
              aria-label="Usar supuestos prácticos"
              onClick={() =>
                actualizarConfig({
                  usarSupuestos: config.usarSupuestos === false,
                })
              }
              className={
                config.usarSupuestos !== false
                  ? "relative h-8 w-14 shrink-0 rounded-full bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  : "relative h-8 w-14 shrink-0 rounded-full bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              }
            >
              <span
                className={
                  config.usarSupuestos !== false
                    ? "absolute top-1 left-7 size-6 rounded-full bg-accent-fg"
                    : "absolute top-1 left-1 size-6 rounded-full bg-surface"
                }
              />
            </button>
          </div>

          <div>
            <p className="mb-1 text-sm text-muted">Vueltas de repaso</p>
            <p className="mb-3 text-xs text-muted">
              Tras estudiar un tema, «Hoy» lo vuelve a pedir según estos plazos.
              La última vuelta se usa también para mantener los ya preparados.
            </p>
            <ul className="space-y-2">
              {vueltas.map((dias, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-sm font-medium">
                    {ordinalVuelta(i + 1)}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={dias}
                    aria-label={`Días hasta ${ordinalVuelta(i + 1)} vuelta`}
                    onChange={(e) => {
                      const next = [...vueltas];
                      next[i] = Math.max(1, Number(e.target.value) || 1);
                      actualizarConfig({ vueltas: next });
                    }}
                    className="h-11 w-24 rounded-full border-0 bg-surface-2 px-3 tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <span className="text-sm text-muted">
                    {dias === 1 ? "día" : "días"}
                  </span>
                  {vueltas.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Quitar ${ordinalVuelta(i + 1)} vuelta`}
                      onClick={() =>
                        actualizarConfig({
                          vueltas: vueltas.filter((_, j) => j !== i),
                        })
                      }
                      className="ml-auto grid size-11 place-items-center rounded-full text-muted"
                    >
                      <Trash2 className="size-4" strokeWidth={1.75} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {vueltas.length < 8 && (
              <button
                type="button"
                onClick={() => {
                  const last = vueltas[vueltas.length - 1] ?? 7;
                  actualizarConfig({
                    vueltas: [...vueltas, Math.min(180, last * 2)],
                  });
                }}
                className="mt-3 inline-flex h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-accent"
              >
                <Plus className="size-4" strokeWidth={2} />
                Añadir vuelta
              </button>
            )}
          </div>

          <label className="block">
            <span className="mb-1 block text-sm text-muted">Número de temas</span>
            <input
              type="number"
              min={1}
              max={80}
              inputMode="numeric"
              value={totalDraft ?? config.totalTemas}
              onChange={(e) => setTotalDraft(e.target.value)}
              onBlur={() => {
                actualizarConfig({
                  totalTemas: enteroAlSalir(Number(totalDraft ?? config.totalTemas), 1, 80),
                });
                setTotalDraft(null);
              }}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">
              Temas que extrae el tribunal
            </span>
            <input
              type="number"
              min={1}
              max={10}
              inputMode="numeric"
              value={sorteoDraft ?? config.temasSorteo}
              onChange={(e) => setSorteoDraft(e.target.value)}
              onBlur={() => {
                actualizarConfig({
                  temasSorteo: enteroAlSalir(
                    Number(sorteoDraft ?? config.temasSorteo),
                    1,
                    10,
                  ),
                });
                setSorteoDraft(null);
              }}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">
              Empiezo a estudiar el
            </span>
            <input
              type="date"
              value={config.fechaInicio}
              onChange={(e) => actualizarConfig({ fechaInicio: e.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">
              Último día de estudio
            </span>
            <input
              type="date"
              value={config.fechaFin}
              onChange={(e) => actualizarConfig({ fechaFin: e.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Fecha del examen</span>
            <input
              type="date"
              value={config.fechaExamen}
              onChange={(e) => actualizarConfig({ fechaExamen: e.target.value })}
              className={fieldClass}
            />
          </label>
          <div>
            <p className="mb-1 text-sm text-muted">Objetivo de probabilidad</p>
            <div className="flex gap-1 rounded-full bg-surface-2 p-1">
              {[0.7, 0.8, 0.9].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => actualizarConfig({ umbralObjetivo: u })}
                  className={
                    config.umbralObjetivo === u ? "pill pill-on flex-1" : "pill pill-off flex-1"
                  }
                >
                  {Math.round(u * 100)} %
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Especialidad</span>
            <input
              type="text"
              value={config.especialidad}
              onChange={(e) => actualizarConfig({ especialidad: e.target.value })}
              placeholder="La tuya"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Comunidad</span>
            <input
              type="text"
              value={config.comunidad}
              onChange={(e) => actualizarConfig({ comunidad: e.target.value })}
              placeholder="La tuya"
              className={fieldClass}
            />
          </label>
        </form>
      </section>

      <section
        id="panel-pantalla"
        role="tabpanel"
        aria-labelledby="tab-pantalla"
        hidden={pestana !== "pantalla"}
        className="mt-5 space-y-4"
      >
          <div className="card p-5">
            <ThemePicker />
          </div>
          <PwaInstall />
      </section>

      <section
        id="panel-ayuda"
        role="tabpanel"
        aria-labelledby="tab-ayuda"
        hidden={pestana !== "ayuda"}
        className="mt-5"
      >
        <PreguntasFrecuentes />
        <section className="mt-4 card p-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Apoyar
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold">
            Si te sirve, invita a un café
          </h3>
          <p className="mt-2 text-sm text-muted">
            OpoRitmo es gratis y se queda así. Si te está ayudando, puedes
            invitar a un café. No desbloquea nada: es solo para sostener el
            desarrollo.
          </p>
          <a
            href="https://ko-fi.com/profeenbeta"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border-0 bg-surface-2 text-sm font-medium hover:bg-surface-2"
          >
            <Coffee className="size-4" strokeWidth={1.75} />
            Invitar a un café
          </a>
        </section>
      </section>

      <section
        id="panel-delicada"
        role="tabpanel"
        aria-labelledby="tab-delicada"
        hidden={pestana !== "delicada"}
        className="mt-5"
      >
        <h3 className="font-display text-lg font-semibold">Zona delicada</h3>
        <p className="mt-1 text-sm text-muted">
          Estas acciones cambian o borran el plan.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              window.sessionStorage.removeItem("oporitmo-arranque-paso");
              window.sessionStorage.removeItem("oporitmo-login-desde-arranque");
              abrirArranque();
            }}
            className="h-11 rounded-full border-0 bg-surface-2 text-sm font-medium"
          >
            Repetir arranque
          </button>
          <button
            type="button"
            onClick={() => {
              resetDemo();
              toast("Cargado el ejemplo de 25 temas");
            }}
            className="h-11 rounded-full border-0 bg-surface-2 text-sm font-medium"
          >
            Cargar ejemplo
          </button>
          <button
            type="button"
            onClick={() => setConfirmCero(true)}
            className="h-11 rounded-full border-0 bg-surface-2 text-sm font-medium text-danger"
          >
            Empezar de cero
          </button>
        </div>
      </section>

      <Drawer.Root
        open={confirmCero}
        onOpenChange={setConfirmCero}
        shouldScaleBackground
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-ink/40" />
          <Drawer.Content className="glass fixed inset-x-3 bottom-3 z-50 mx-auto max-w-lg rounded-3xl px-5 pb-3 pt-2 outline-none">
            <div className="mx-auto mb-2 mt-1 h-1.5 w-10 rounded-full bg-faint" />
            <Drawer.Title className="px-1 pt-1 text-center font-display text-xl font-semibold">
              ¿Empezar de cero?
            </Drawer.Title>
            <Drawer.Description className="mt-2 px-1 text-center text-sm text-muted">
              Se borra el temario, los bloques, las sesiones, los simulacros y
              los tiempos. Fechas, horas y vueltas vuelven al inicio. Si tienes
              cuenta, no se cierra.
            </Drawer.Description>
            <button
              type="button"
              onClick={() => {
                resetVacio();
                setConfirmCero(false);
                toast("Temario vacío listo para empezar");
              }}
              className="mt-5 h-12 w-full rounded-full bg-danger text-sm font-semibold text-accent-fg"
            >
              Empezar de cero
            </button>
            <Drawer.Close asChild>
              <button
                type="button"
                className="mt-2 h-12 w-full rounded-full bg-surface text-sm font-semibold"
              >
                Cancelar
              </button>
            </Drawer.Close>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <Drawer.Root
        open={copiaPendiente !== null}
        onOpenChange={(open) => {
          if (!open) setCopiaPendiente(null);
        }}
        shouldScaleBackground
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-ink/40" />
          <Drawer.Content className="glass fixed inset-x-3 bottom-3 z-50 mx-auto max-w-lg rounded-3xl px-5 pb-3 pt-2 outline-none">
            <div className="mx-auto mb-2 mt-1 h-1.5 w-10 rounded-full bg-faint" />
            <Drawer.Title className="px-1 pt-1 text-center font-display text-xl font-semibold">
              ¿Sustituir el plan?
            </Drawer.Title>
            <Drawer.Description className="mt-2 px-1 text-center text-sm text-muted">
              Esto sustituye el plan que hay ahora en este dispositivo. ¿Seguro?
            </Drawer.Description>
            <button
              type="button"
              onClick={sustituirPlan}
              className="mt-5 h-12 w-full rounded-full bg-accent text-sm font-semibold text-accent-fg"
            >
              Sustituir plan
            </button>
            <Drawer.Close asChild>
              <button
                type="button"
                className="mt-2 h-12 w-full rounded-full bg-surface text-sm font-semibold"
              >
                Cancelar
              </button>
            </Drawer.Close>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </AppShell>
  );
}
