import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ThemePicker } from "@/components/theme-sync";
import { AccountPanel } from "@/components/account-panel";
import { PwaInstall } from "@/components/pwa-install";
import { AppShell } from "@/components/app-shell";
import { formatHoras, normalizarHorasDia, sumaHoras } from "@/lib/oporitmo/math";
import { DIAS_SEMANA } from "@/lib/oporitmo/types";
import { ordinalVuelta } from "@/lib/oporitmo/vueltas";
import { useOpoStore } from "@/lib/oporitmo/store";

export const Route = createFileRoute("/config")({ component: ConfigPage });

const fieldClass =
  "h-11 w-full rounded-md border border-line bg-bg px-3 focus:outline-none focus:ring-2 focus:ring-accent";

function ConfigPage() {
  const [ready, setReady] = useState(false);
  const config = useOpoStore((s) => s.config);
  const actualizarConfig = useOpoStore((s) => s.actualizarConfig);
  const setHorasDia = useOpoStore((s) => s.setHorasDia);
  const resetDemo = useOpoStore((s) => s.resetDemo);
  const resetVacio = useOpoStore((s) => s.resetVacio);
  const abrirArranque = useOpoStore((s) => s.abrirArranque);

  useEffect(() => setReady(true), []);

  const horasPorDia = normalizarHorasDia(config.horasPorDia);
  const vueltas = config.vueltas ?? [7, 14, 30];

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

      <div className="mt-5">
        <AccountPanel />
      </div>

      <div className="mt-4">
        <PwaInstall />
      </div>

      <form
        className="mt-5 space-y-4 rounded-xl border border-line bg-surface p-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <ThemePicker />

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
                  className="h-11 w-full rounded-md border border-line bg-bg px-1 text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            En total: {formatHoras(sumaHoras(horasPorDia))} a la semana
          </p>
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
                  onChange={(e) => {
                    const next = [...vueltas];
                    next[i] = Math.max(1, Number(e.target.value) || 1);
                    actualizarConfig({ vueltas: next });
                  }}
                  className="h-11 w-24 rounded-md border border-line bg-bg px-3 tabular-nums focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <span className="text-sm text-muted">días</span>
                {vueltas.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Quitar ${ordinalVuelta(i + 1)} vuelta`}
                    onClick={() =>
                      actualizarConfig({
                        vueltas: vueltas.filter((_, j) => j !== i),
                      })
                    }
                    className="ml-auto grid size-11 place-items-center rounded-md text-muted"
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
              className="mt-3 inline-flex h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-accent"
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
            value={config.totalTemas}
            onChange={(e) =>
              actualizarConfig({ totalTemas: Number(e.target.value) || 1 })
            }
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
            value={config.temasSorteo}
            onChange={(e) =>
              actualizarConfig({ temasSorteo: Number(e.target.value) || 1 })
            }
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
        <label className="block">
          <span className="mb-1 block text-sm text-muted">
            Objetivo de probabilidad
          </span>
          <select
            value={config.umbralObjetivo}
            onChange={(e) =>
              actualizarConfig({ umbralObjetivo: Number(e.target.value) })
            }
            className={fieldClass}
          >
            <option value={0.7}>70 %</option>
            <option value={0.8}>80 %</option>
            <option value={0.9}>90 %</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Especialidad</span>
          <input
            type="text"
            value={config.especialidad}
            onChange={(e) => actualizarConfig({ especialidad: e.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Comunidad</span>
          <input
            type="text"
            value={config.comunidad}
            onChange={(e) => actualizarConfig({ comunidad: e.target.value })}
            className={fieldClass}
          />
        </label>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => abrirArranque()}
          className="h-11 rounded-md border border-line bg-surface text-sm font-medium"
        >
          Repetir arranque
        </button>
        <button
          type="button"
          onClick={() => {
            resetDemo();
            toast("Cargado el ejemplo de 25 temas");
          }}
          className="h-11 rounded-md border border-line bg-surface text-sm font-medium"
        >
          Cargar ejemplo
        </button>
        <button
          type="button"
          onClick={() => {
            resetVacio();
            toast("Temario vacío listo para empezar");
          }}
          className="h-11 rounded-md border border-line bg-surface text-sm font-medium text-danger"
        >
          Empezar de cero
        </button>
      </div>
    </AppShell>
  );
}
