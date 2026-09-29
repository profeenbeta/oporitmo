import { Link } from "@tanstack/react-router";

export function PaginaNoExiste() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center text-ink">
      <p className="kicker">OpoRitmo</p>
      <h1 className="mt-2 font-display text-2xl font-semibold">
        Esta página no existe
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        El enlace no lleva a ningún sitio de la app.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg"
      >
        Ir a Hoy
      </Link>
    </main>
  );
}
