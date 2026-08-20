import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CoverageCard } from "@/components/coverage-card";
import { TodayPanel } from "@/components/today-panel";
import { diasRestantes, horasDelDia, hoyISO } from "@/lib/oporitmo/math";
import { obtenerSugerencias } from "@/lib/oporitmo/suggestions";
import { useOpoStore } from "@/lib/oporitmo/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [ready, setReady] = useState(false);
  const config = useOpoStore((s) => s.config);
  const temas = useOpoStore((s) => s.temas);
  const sesiones = useOpoStore((s) => s.sesiones);
  const bloques = useOpoStore((s) => s.bloques);
  const simulacros = useOpoStore((s) => s.simulacros);
  const override = useOpoStore((s) => s.horasHoyOverride);

  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <AppShell>
        <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
      </AppShell>
    );
  }

  const data = { config, temas, sesiones, bloques, simulacros };
  const horasHoy = horasDelDia(hoyISO(), config, override);
  const { principal, secundarias } = obtenerSugerencias(data, horasHoy);

  return (
    <AppShell>
      <CoverageCard data={data} dias={diasRestantes(config.fechaFin || config.fechaExamen)} />
      <TodayPanel principal={principal} secundarias={secundarias} />
    </AppShell>
  );
}
