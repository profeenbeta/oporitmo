import { createFileRoute, Link } from "@tanstack/react-router";
import { Credit } from "@/components/credit";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-ink">
      <div className="w-full max-w-sm">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          OpoRitmo
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Entrar</h1>
        <p className="mt-2 text-sm text-muted">
          Con Google o X el temario se guarda en tu cuenta y lo recuperas en
          otro móvil. Sin cuenta, solo queda en este dispositivo.
        </p>

        <div className="mt-6 space-y-2">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                className="h-11 w-full rounded-md border border-line bg-surface text-sm font-medium hover:bg-surface-2"
              >
                Continuar con {p.label}
              </button>
            ))
          ) : (
            <p className="text-sm text-muted">El acceso está desactivado.</p>
          )}
        </div>

        <Link
          to="/"
          className="mt-6 inline-block text-sm font-medium text-accent underline-offset-4 hover:underline"
        >
          Seguir sin cuenta
        </Link>
        <Credit />
      </div>
    </main>
  );
}
