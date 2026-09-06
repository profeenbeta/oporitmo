import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Credit } from "@/components/credit";
import { EmailAuthForm } from "@/components/email-auth-form";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-ink">
      <div className="w-full max-w-sm">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          OpoRitmo
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Entrar</h1>
        <p className="mt-2 text-sm text-muted">
          Con Google, X o un correo el temario se guarda en tu cuenta y lo
          recuperas en otro móvil. Sin cuenta, solo queda en este dispositivo.
        </p>

        <div className="mt-6 space-y-2">
          {authEnabled ? (
            GROK_PROVIDERS.map((p, i) => (
              <button
                key={p.providerId}
                type="button"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                className={
                  i === 0
                    ? "h-11 w-full rounded-full bg-accent text-sm font-semibold text-accent-fg"
                    : "h-11 w-full rounded-full bg-surface-2 text-sm font-medium"
                }
              >
                Continuar con {p.label}
              </button>
            ))
          ) : (
            <p className="text-sm text-muted">El acceso está desactivado.</p>
          )}
        </div>
        {authEnabled && (
          <div className="mt-4">
            <EmailAuthForm onOk={() => void navigate({ to: "/" })} />
          </div>
        )}

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