import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const modulo =
    /module script failed|failed to fetch dynamically imported/i.test(
      error.message || "",
    );

  async function recargar() {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* ignore */
    }
    window.location.reload();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-ink">
      <span className="text-danger" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-xl font-semibold">
        {modulo ? "Hay que recargar" : "Algo ha fallado"}
      </h1>
      <p className="max-w-md text-sm text-muted">
        {modulo
          ? "El móvil tiene una versión antigua en caché. Pulsa recargar y se pone al día."
          : error.message || "Prueba a recargar."}
      </p>
      <button
        type="button"
        onClick={() => void recargar()}
        className="mt-2 h-11 rounded-md bg-accent px-5 text-sm font-semibold text-accent-fg"
      >
        Recargar
      </button>
    </main>
  );
}
