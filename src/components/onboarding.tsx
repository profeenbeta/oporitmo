import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_HORAS_DIA,
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
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 w-full rounded-md border border-line bg-bg px-3 focus:outline-none focus:ring-2 focus:ring-accent";

const PASO_KEY = "oporitmo-arranque-paso";
const LOGIN_KEY = "oporitmo-login-desde-arranque";

type Paso = 1 | 2 | 3 | "animo";

function leerPaso(): Paso {
  if (typeof window === "undefined") return 1;
  const v = window.sessionStorage.getItem(PASO_KEY);
  if (v === "2") return 2;
  if (v === "3") return 3;
  if (v === "animo") return "animo";
  return 1;
}

export function Onboarding() {
  const config = useOpoStore((s) => s.config);
  const completarArranque = useOpoStore((s) => s.completarArranque);
  const actualizarConfig = useOpoStore((s) => s.actualizarConfig);
  const resetDemo = useOpoStore((s) => s.resetDemo);
  const { user, isPending } = useCurrentUserState();

  const [paso, setPaso] = useState<Paso>(1);
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
  const [especialidad, setEspecialidad] = useState(config.especialidad);
  const [comunidad, setComunidad] = useState(config.comunidad);
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
  };

  useEffect(() => {
    setPaso(leerPaso());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(PASO_KEY, String(paso));
  }, [paso]);

  useEffect(() => {
    if (isPending || !user) return;
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(LOGIN_KEY) !== "1") return;
    window.sessionStorage.removeItem(LOGIN_KEY);
    setPaso("animo");
  }, [user, isPending]);

  useEffect(() => {
    if (paso !== "animo") return;
    const id = window.setTimeout(() => terminar(), 1600);
    return () => window.clearTimeout(id);
  }, [paso]);

  function ir(siguiente: Paso) {
    setPaso(siguiente);
  }

  function guardarTemario() {
    actualizarConfig({
      totalTemas,
      temasSorteo,
      especialidad,
      comunidad,
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
    completarArranque(datosRef.current);
  }

  const n = paso === "animo" ? 3 : paso;

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="mx-auto max-w-lg px-4 py-8 sm:max-w-xl">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
            OpoRitmo
          </p>
          <ThemeToggle />
        </div>

        {paso !== "animo" && (
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

        {paso === 1 && (
          <section className="mt-6 rounded-xl border border-line bg-surface p-5">
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
                value={totalTemas}
                onChange={(e) => setTotalTemas(Number(e.target.value) || 1)}
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
                value={temasSorteo}
                onChange={(e) => setTemasSorteo(Number(e.target.value) || 1)}
                className={fieldClass}
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm text-muted">Especialidad</span>
              <input
                type="text"
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm text-muted">Comunidad</span>
              <input
                type="text"
                value={comunidad}
                onChange={(e) => setComunidad(e.target.value)}
                className={fieldClass}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                guardarTemario();
                ir(2);
              }}
              className="mt-5 h-12 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg"
            >
              Siguiente
            </button>
          </section>
        )}

        {paso === 2 && (
          <section className="mt-6 rounded-xl border border-line bg-surface p-5">
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
                    className="h-11 w-full rounded-md border border-line bg-bg px-1 text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              {formatHoras(sumaHoras(horasPorDia))} a la semana
            </p>
            <button
              type="button"
              onClick={() => {
                guardarPeriodo();
                ir(3);
              }}
              className="mt-5 h-12 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg"
            >
              Siguiente
            </button>
            <button
              type="button"
              onClick={() => ir(1)}
              className="mt-2 h-11 w-full text-sm font-medium text-muted"
            >
              Atrás
            </button>
          </section>
        )}

        {paso === 3 && (
          <div className="mt-6 space-y-3">
            <AccountPanel
              callbackURL="/"
              numero="3"
              titulo="Conecta la cuenta"
              descripcion="Si no entras, el temario se queda solo en este navegador. Si cambias de móvil o se limpia, se pierde. Con Google o X lo recuperas."
              botonesAcento
              onIntentarEntrar={() => {
                if (typeof window !== "undefined") {
                  window.sessionStorage.setItem(LOGIN_KEY, "1");
                }
              }}
            />
            {user ? (
              <button
                type="button"
                onClick={() => ir("animo")}
                className="h-12 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => ir("animo")}
                className="h-12 w-full rounded-md border border-line bg-surface text-sm font-medium"
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
        )}

        {paso === "animo" && (
          <button
            type="button"
            onClick={terminar}
            className="mt-16 w-full text-left"
          >
            <p className="font-display text-4xl font-semibold">¡Ánimo!</p>
            <p className="mt-3 text-sm text-muted">Ya está. A estudiar.</p>
          </button>
        )}

        {paso !== "animo" && (
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.sessionStorage.removeItem(PASO_KEY);
              }
              resetDemo();
              toast("Cargado un ejemplo para probar");
            }}
            className="mt-4 h-11 w-full text-sm font-medium text-muted underline-offset-4 hover:underline"
          >
            Prefiero ver un ejemplo
          </button>
        )}
        <Credit />
      </div>
    </div>
  );
}
