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
  const umbrales = [0.7, 0.8, 0.9].map((u) => ({
    u,
    extra: temasParaUmbral(preparados, totalTemas, temasSorteo, u),
  }));

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Probabilidad actual
          </p>
          <p className="mt-1 font-display text-4xl font-semibold tabular-nums text-accent">
            {formatPct(p)}
          </p>
          <p className="mt-1 text-sm text-muted">
            De que salga al menos un tema preparado
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Estudio
          </p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
            {dias}
          </p>
          <p className="text-xs text-muted">días hasta el fin</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span>
          {preparados} / {totalTemas} preparados
        </span>
        <span className="text-muted">
          Sorteo de {temasSorteo}
        </span>
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-2">
        {umbrales.map(({ u, extra }) => (
          <li
            key={u}
            className="rounded-md bg-surface-2 px-2 py-2 text-center"
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
