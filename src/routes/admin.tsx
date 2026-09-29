import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PaginaNoExiste } from "@/components/pagina-no-existe";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadAdminUso, type CifrasUso } from "@/lib/oporitmo/admin";

export const Route = createFileRoute("/admin")({
  component: AdminUso,
  notFoundComponent: PaginaNoExiste,
  head: () => ({
    meta: [
      { title: "OpoRitmo" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminUso() {
  const { user, isPending } = useCurrentUserState();
  const [cifras, setCifras] = useState<CifrasUso | null>(null);
  const [fase, setFase] = useState<"carga" | "ok" | "vacio" | "error">("carga");

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setFase("vacio");
      return;
    }
    let cancel = false;
    void loadAdminUso()
      .then((data) => {
        if (cancel) return;
        if (!data) setFase("vacio");
        else if ("error" in data) setFase("error");
        else {
          setCifras(data);
          setFase("ok");
        }
      })
      .catch(() => {
        if (!cancel) setFase("vacio");
      });
    return () => {
      cancel = true;
    };
  }, [user, isPending]);

  if (isPending || fase === "carga") {
    return (
      <main className="min-h-dvh bg-bg px-4 py-10">
        <div className="mx-auto h-40 max-w-3xl animate-pulse rounded-xl bg-surface-2" />
      </main>
    );
  }

  if (fase === "vacio") {
    return <PaginaNoExiste />;
  }

  return (
    <main className="min-h-dvh bg-bg px-4 py-10 text-ink">
      <div className="mx-auto max-w-3xl">
        <p className="kicker">OpoRitmo</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Uso de OpoRitmo
        </h1>
        <p className="mt-2 text-sm text-muted">
          Solo tú ves esto. La app del opositor no cambia.
        </p>

        {fase === "error" || !cifras ? (
          <p className="mt-8 card px-5 py-6 text-sm">
            No se pudieron cargar las cifras.
          </p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="card px-5 py-6">
              <p className="kicker">Cuentas</p>
              <p className="mt-2 font-display text-5xl font-semibold tabular-nums">
                {cifras.cuentas}
              </p>
              <p className="mt-3 text-sm text-muted">
                {cifras.cuentas7} nuevas en 7 días · {cifras.cuentas30} en 30
                días
              </p>
            </article>
            <article className="card px-5 py-6">
              <p className="kicker">Visitas</p>
              <p className="mt-2 font-display text-5xl font-semibold tabular-nums">
                {cifras.visitas7}
              </p>
              <p className="mt-1 text-sm text-muted">en 7 días</p>
              <p className="mt-3 text-sm text-muted">
                {cifras.visitas30} en 30 días
              </p>
              <p className="mt-3 text-sm text-muted">
                {cifras.personas7} personas en 7 días · {cifras.personas30} en 30
                días
              </p>
            </article>
          </div>
        )}
      </div>
    </main>
  );
}
