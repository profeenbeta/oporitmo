import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  DEFAULT_HORAS_DIA,
  enteroAlSalir,
  enteroEnEdicion,
  formatHoras,
  normalizarHorasDia,
  sumaHoras,
} from "@/lib/oporitmo/math";
import { useOpoStore } from "@/lib/oporitmo/store";
import { AccountPanel } from "@/components/account-panel";
import { Credit } from "@/components/credit";
import { ThemeToggle } from "@/components/theme-sync";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { DIAS_SEMANA } from "@/lib/oporitmo/types";
import { useSyncStatus } from "@/lib/oporitmo/sync-status";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 w-full rounded-full border-0 bg-surface-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent";

const PASO_KEY = "oporitmo-arranque-paso";
const LOGIN_KEY = "oporitmo-login-desde-arranque";

const BIENVENIDA = [
  {
    titulo: "Qué hacer hoy",
    texto:
      "Te propone el tema del día: estudiar uno nuevo, repasar o acabar el que dejaste a medias.",
  },
  {
    titulo: "Un calendario que aguanta",
    texto: "Si un día no llegas, se reajusta solo. No hay que rehacer el plan.",
  },
  {
    titulo: "Sorteo",
    texto:
      "Extrae temas como el tribunal y ensaya el desarrollo con temporizador.",
  },
];

type Paso = 0 | 1 | 2 | 3 | "animo";

function AccionesPaso({
  continuar,
  etiqueta = "Siguiente",
  atras,
}: {
  continuar: () => void;
  etiqueta?: string;
  atras?: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-10 mt-5 border-t border-line bg-surface pt-3">
      <button
        type="button"
        onClick={continuar}
        className="h-12 w-full rounded-full bg-accent text-sm font-semibold text-accent-fg"
      >
        {etiqueta}
      </button>
      {atras ? (
        <button
          type="button"
          onClick={atras}
          className="mt-2 h-11 w-full text-sm font-medium text-muted"
        >
          Atrás
        </button>
      ) : null}
    </div>
  );
}

function leerPaso(): Paso {
  if (typeof window === "undefined") return 0;
  const v = window.sessionStorage.getItem(PASO_KEY);
  if (v === "1") return 1;
  if (v === "2") return 2;
  if (v === "3") return 3;
  if (v === "animo") return "animo";
  return 0;
}

export function Onboarding() {
  const navigate = useNavigate();
  const config = useOpoStore((s) => s.config);
  const completarArranque = useOpoStore((s) => s.completarArranque);
  const actualizarConfig = useOpoStore((s) => s.actualizarConfig);
  const { user, isPending } = useCurrentUserState();
  const syncStatus = useSyncStatus((s) => s.status);

  const [paso, setPaso] = useState<Paso>(0);
  const [totalTemas, setTotalTemas] = useState(config.totalTemas || 25);
  const [temasSorteo, setTemasSorteo] = useState(config.temasSorteo || 3);
  const [fechaExamen, setFechaExamen] = useState(
    config.fechaExamen || "2027-06-15",
  );
  const [fechaInicio, setFechaInicio] = useState(
    config.fechaInicio || new Date().toISOString().slice(0, 10),
  );
  const [fechaFin, setFechaFin] = useState(
    config.fechaFin || config.fechaExamen || "2027-06-14",
  );
  const [horasPorDia, setHorasPorDia] = useState(
    normalizarHorasDia(config.horasPorDia ?? DEFAULT_HORAS_DIA),
  );
  const [especialidad, setEspecialidad] = useState(
    config.especialidad === "Educación Física" ? "" : config.especialidad,
  );
  const [comunidad, setComunidad] = useState(
    config.comunidad === "Andalucía" ? "" : config.comunidad,
  );
  const [usarSupuestos, setUsarSupuestos] = useState(
    config.usarSupuestos !== false,
  );
  const hecho = useRef(false);
  const datosRef = useRef({
    totalTemas,
    temasSorteo,
    fechaExamen,
    fechaInicio,
    fechaFin,
    horasPorDia,
    especialidad,
    comunidad,
    usarSupuestos,
  });
  datosRef.current = {
    totalTemas,
    temasSorteo,
    fechaExamen,
    fechaInicio,
    fechaFin,
    horasPorDia,
    especialidad,
    comunidad,
    usarSupuestos,
  };

  useEffect(() => {
    setPaso(leerPaso());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(PASO_KEY, String(paso));
    const irArriba = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    irArriba();
    const id = window.requestAnimationFrame(irArriba);
    return () => window.cancelAnimationFrame(id);
  }, [paso]);

  useEffect(() => {
    if (isPending || !user) return;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(LOGIN_KEY) !== "1") return;
    if (syncStatus !== "ok" && syncStatus !== "error") return;
    window.sessionStorage.removeItem(LOGIN_KEY);
    if (useOpoStore.getState().onboardingHecho) {
      window.sessionStorage.removeItem(PASO_KEY);
      return;
    }
    setPaso("animo");
  }, [user, isPending, syncStatus]);

  function ir(siguiente: Paso) {
    setPaso(siguiente);
  }

  function guardarTemario() {
    actualizarConfig({
      totalTemas: enteroAlSalir(totalTemas, 1, 80),
      temasSorteo: enteroAlSalir(temasSorteo, 1, 10),
      especialidad,
      comunidad,
      usarSupuestos,
    });
  }

  function guardarPeriodo() {
    actualizarConfig({
      fechaInicio,
      fechaFin,
      fechaExamen,
      horasPorDia,
    });
  }

  function terminar() {
    if (hecho.current) return;
    hecho.current = true;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(PASO_KEY);
      window.sessionStorage.removeItem(LOGIN_KEY);
    }
    if (!useOpoStore.getState().onboardingHecho) {
      completarArranque(datosRef.current);
    }
    void navigate({ to: "/" });
  }

  const n = paso === "animo" || paso === 0 ? 0 : paso;
  const enConfig = paso === 1 || paso === 2 || paso === 3;

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div
        className={cn(
          "mx-auto px-4 py-8",
          paso === 0
            ? "max-w-lg xl:max-w-6xl xl:px-8 xl:py-10"
            : "max-w-lg sm:max-w-xl",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            OpoRitmo
          </p>
          <ThemeToggle />
        </div>

        {enConfig && (
          <>
            <h1 className="mt-2 font-display text-3xl font-semibold">
              Empieza en medio minuto
            </h1>
            <p className="mt-2 text-sm text-muted">
              Un paso cada vez. Luego, a estudiar.
            </p>
            <div className="mt-5 flex gap-2">
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i <= n ? "bg-accent" : "bg-line",
                  )}
                />
              ))}
            </div>
          </>
        )}

        {paso === 0 && (
          <section className="opo-in mt-8 overflow-visible rounded-[2rem] bg-surface shadow-hero xl:grid xl:min-h-[32rem] xl:grid-cols-2">
            <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-12 xl:px-12">
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-display text-[2.15rem] font-semibold leading-[1.12] tracking-tight text-accent sm:text-5xl">
                  ¡Hola! Esto es
                  <br />
                  OpoRitmo
                </h1>
                <img
                  src="/icon-192.png"
                  alt=""
                  width={56}
                  height={56}
                  className="size-14 shrink-0 rounded-2xl bg-surface-2 xl:size-16"
                />
              </div>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted">
                Una herramienta para organizar el estudio de oposiciones.
              </p>
              <button
                type="button"
                onClick={() => ir(1)}
                className="mt-8 h-12 w-full rounded-full bg-accent px-12 text-sm font-semibold text-accent-fg xl:w-auto"
              >
                Empezar
              </button>
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-3 bg-accent-soft px-5 py-6 sm:px-8 sm:py-10 xl:px-10">
              {BIENVENIDA.map((item, i) => (
                <article
                  key={item.titulo}
                  className={cn(
                    "flex min-w-0 gap-3 rounded-2xl bg-surface px-4 py-4 shadow-card",
                    i === 0 && "opo-in-delay-1",
                    i === 1 && "opo-in-delay-2",
                    i === 2 && "opo-in-delay-3",
                  )}
                >
                  <span
                    aria-hidden
                    className="mt-0.5 w-1 shrink-0 self-stretch rounded-full bg-accent"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold tracking-tight">{item.titulo}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted break-words">
                      {item.texto}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {paso === 1 && (
          <section className="card opo-in mt-6 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
              1 · Temario
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold">
              Configuremos esto un poco
            </h2>
            <p className="mt-1 text-sm text-muted">
              Sé que estás deseando estudiar, pero hay que organizarse.
            </p>
            <label className="mt-5 block">
              <span className="mb-1 block text-sm text-muted">
                Número de temas
              </span>
              <input
                type="number"
                min={1}
                max={80}
                inputMode="numeric"
                value={totalTemas || ""}
                onChange={(e) => setTotalTemas(enteroEnEdicion(e.target.value))}
                onBlur={() => setTotalTemas((n) => enteroAlSalir(n, 1, 80))}
                className={fieldClass}
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm text-muted">
                Temas que extrae el tribunal
              </span>
              <input
                type="number"
                min={1}
                max={10}
                inputMode="numeric"
                value={temasSorteo || ""}
                onChange={(e) => setTemasSorteo(enteroEnEdicion(e.target.value))}
                onBlur={() => setTemasSorteo((n) => enteroAlSalir(n, 1, 10))}
                className={fieldClass}
              />
            </label>
            <div className="mt-4">
              <p className="mb-1 text-sm text-muted">
                ¿Tu oposición tiene supuestos prácticos?
              </p>
              <div className="flex gap-1 rounded-full bg-surface-2 p-1">
                <button
                  type="button"
                  onClick={() => setUsarSupuestos(true)}
                  className={usarSupuestos ? "pill pill-on flex-1" : "pill pill-off flex-1"}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setUsarSupuestos(false)}
                  className={!usarSupuestos ? "pill pill-on flex-1" : "pill pill-off flex-1"}
                >
                  No
                </button>
              </div>
            </div>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm text-muted">Especialidad</span>
              <input
                type="text"
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                placeholder="La tuya"
                className={fieldClass}
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm text-muted">Comunidad</span>
              <input
                type="text"
                value={comunidad}
                onChange={(e) => setComunidad(e.target.value)}
                placeholder="La tuya"
                className={fieldClass}
              />
            </label>
            <AccionesPaso
              continuar={() => {
                guardarTemario();
                ir(2);
              }}
              atras={() => ir(0)}
            />
          </section>
        )}

        {paso === 2 && (
          <section className="card opo-in mt-6 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
              2 · Periodo
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold">
              Periodo de estudio
            </h2>
            <p className="mt-1 text-sm text-muted">
              El calendario solo llena estos días. El examen puede ser el mismo
              que el último día o uno después.
            </p>
            <label className="mt-5 block">
              <span className="mb-1 block text-sm text-muted">
                Empiezo a estudiar el
              </span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm text-muted">
                Último día de estudio
              </span>
              <input
                type="date"
                value={fechaFin}
                min={fechaInicio}
                onChange={(e) => setFechaFin(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm text-muted">
                Fecha del examen
              </span>
              <input
                type="date"
                value={fechaExamen}
                min={fechaInicio}
                onChange={(e) => {
                  const v = e.target.value;
                  setFechaExamen(v);
                  if (!fechaFin || fechaFin > v) setFechaFin(v);
                }}
                className={fieldClass}
              />
            </label>
            <p className="mt-5 mb-1 text-sm text-muted">Horas según el día</p>
            <p className="mb-3 text-xs text-muted">
              Pon 0 si ese día no estudias.
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
                    onChange={(e) => {
                      const next = [...horasPorDia];
                      next[i] = Number(e.target.value) || 0;
                      setHorasPorDia(next);
                    }}
                    className="h-11 w-full rounded-full border-0 bg-surface-2 px-1 text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              {formatHoras(sumaHoras(horasPorDia))} a la semana
            </p>
            <AccionesPaso
              continuar={() => {
                guardarPeriodo();
                ir(3);
              }}
              atras={() => ir(1)}
            />
          </section>
        )}

        {paso === 3 && (
          <div className="opo-in mt-6">
            <AccountPanel
              callbackURL="/"
              numero="3"
              titulo="Conecta la cuenta"
              descripcion="Si no entras, el temario se queda solo en este navegador. Si cambias de móvil o se limpia, se pierde. Con Google, X o un correo lo recuperas."
              botonesAcento
              onIntentarEntrar={() => {
                if (typeof window !== "undefined") {
                  window.sessionStorage.setItem(LOGIN_KEY, "1");
                }
              }}
            />
            <div className="sticky bottom-0 z-10 mt-3 space-y-2 border-t border-line bg-bg pt-3">
              {user ? (
                <button
                  type="button"
                  onClick={() => ir("animo")}
                  className="h-12 w-full rounded-full bg-accent text-sm font-semibold text-accent-fg"
                >
                  Continuar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => ir("animo")}
                  className="h-12 w-full rounded-full bg-surface-2 text-sm font-medium"
                >
                  Seguir sin cuenta
                </button>
              )}
              <button
                type="button"
                onClick={() => ir(2)}
                className="h-11 w-full text-sm font-medium text-muted"
              >
                Atrás
              </button>
            </div>
          </div>
        )}

        {paso === "animo" && (
          <section className="card-hero opo-in mt-10 px-5 py-8">
            <p className="font-display text-4xl font-semibold">¡Ánimo!</p>
            <p className="mt-3 text-sm text-muted">
              Ya está. El plan está listo. A partir de ahora, «Hoy» te dice qué
              tocar.
            </p>
            <button
              type="button"
              onClick={terminar}
              className="mt-6 h-12 w-full rounded-full bg-accent text-sm font-semibold text-accent-fg"
            >
              Ir a Hoy
            </button>
          </section>
        )}
        <Credit />
      </div>
    </div>
  );
}
