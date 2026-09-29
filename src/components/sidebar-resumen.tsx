import { Link } from "@tanstack/react-router";
import {
  diasRestantes,
  formatPct,
  horasDelDia,
  hoyISO,
  probabilidadAlMenosUno,
} from "@/lib/oporitmo/math";
import {
  contarPreparados,
  obtenerSugerencias,
} from "@/lib/oporitmo/suggestions";
import { useOpoStore } from "@/lib/oporitmo/store";

export function SidebarResumen() {
  const config = useOpoStore((s) => s.config);
  const temas = useOpoStore((s) => s.temas);
  const sesiones = useOpoStore((s) => s.sesiones);
  const bloques = useOpoStore((s) => s.bloques);
  const simulacros = useOpoStore((s) => s.simulacros);
  const override = useOpoStore((s) => s.horasHoyOverride);

  const data = { config, temas, sesiones, bloques, simulacros };
  const horasHoy = horasDelDia(hoyISO(), config, override);
  const { principal } = obtenerSugerencias(data, horasHoy);
  const p = probabilidadAlMenosUno(
    contarPreparados(data),
    config.totalTemas,
    config.temasSorteo,
  );
  const dias = diasRestantes(config.fechaExamen || config.fechaFin);
  const titulo =
    principal?.tipo === "acabar"
      ? `Acabar ${principal.tema.titulo}`
      : principal?.tema.titulo;

  return (
    <div className="mt-8 space-y-4 rounded-3xl bg-surface-2 px-4 py-4">
      <Link to="/calendario" className="block">
        <p className="kicker">Para el examen</p>
        <p className="mt-0.5 font-display text-2xl font-semibold tabular-nums">
          {dias === 0 ? "Hoy" : dias}
          {dias !== 0 && (
            <span className="ml-1 text-base font-medium text-muted">
              {dias === 1 ? "día" : "días"}
            </span>
          )}
        </p>
      </Link>
      <Link to="/sorteo" className="block">
        <p className="kicker">Sorteo</p>
        <p className="mt-0.5 font-display text-xl font-semibold tabular-nums text-accent">
          {formatPct(p)}
        </p>
      </Link>
      <Link to="/" className="block">
        <p className="kicker">Hoy toca</p>
        <p className="mt-0.5 truncate text-sm font-medium">
          {titulo ?? "Nada concreto"}
        </p>
      </Link>
    </div>
  );
}
