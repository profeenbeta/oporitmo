import { formatPct, probabilidadAlMenosUno, temasParaUmbral } from "@/lib/oporitmo/math";
import { contarPreparados } from "@/lib/oporitmo/suggestions";
import type { AppData } from "@/lib/oporitmo/types";

export function CoverageCard({
  data,
  dias,
}: {
  data: AppData;
  dias: number;
}) {
  const preparados = contarPreparados(data);
  const { totalTemas, temasSorteo } = data.config;
  const p = probabilidadAlMenosUno(preparados, totalTemas, temasSorteo);
  const pct = Math.max(0, Math.min(100, Math.round(p * 100)));
  const umbrales = [0.7, 0.8, 0.9].map((u) => ({
    u,
    extra: temasParaUmbral(preparados, totalTemas, temasSorteo, u),
  }));

  return (
    <section className="card min-w-0 px-5 py-4">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="kicker break-words">Probabilidad en el sorteo</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-accent">
            {formatPct(p)}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            De que salga al menos un tema preparado
          </p>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2"
            role="meter"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Probabilidad de sacar un tema preparado"
          >
            <div
              className="h-full rounded-full bg-accent motion-safe:transition-[width] motion-safe:duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-2xl font-semibold tabular-nums">
            {dias}
          </p>
          <p className="text-xs text-muted">días de estudio</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span>
          {preparados} / {totalTemas} preparados
        </span>
        <span className="text-muted">Sorteo de {temasSorteo}</span>
      </div>

      <ul className="mt-3 grid grid-cols-3 gap-2">
        {umbrales.map(({ u, extra }) => (
          <li
            key={u}
            className="rounded-2xl bg-surface-2 px-2 py-2 text-center"
          >
            <p className="text-xs text-muted">{Math.round(u * 100)} %</p>
            <p className="text-sm font-semibold tabular-nums">
              {extra === 0 ? "ok" : `+${extra}`}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
