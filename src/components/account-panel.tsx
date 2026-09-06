import { EmailAuthForm } from "@/components/email-auth-form";
import { GROK_PROVIDERS, authEnabled, signIn, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useSyncStatus } from "@/lib/oporitmo/sync-status";
import { cn } from "@/lib/utils";

export function AccountPanel({
  callbackURL = "/config",
  titulo = "Entra para guardar",
  descripcion = "Con Google, X o un correo el temario se guarda y lo recuperas en el móvil o en otro ordenador. Sin cuenta, solo queda en este navegador.",
  botonesAcento = true,
  numero,
  onIntentarEntrar,
}: {
  callbackURL?: string;
  titulo?: string;
  descripcion?: string;
  botonesAcento?: boolean;
  numero?: string;
  onIntentarEntrar?: () => void;
}) {
  const { user, isPending } = useCurrentUserState();
  const status = useSyncStatus((s) => s.status);

  if (isPending) {
    return <div className="h-28 animate-pulse rounded-xl bg-surface-2" />;
  }

  if (!authEnabled) {
    return null;
  }

  if (user) {
    const label = user.displayName ?? user.primaryEmail ?? "Cuenta";
    return (
      <section className="card p-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          {numero ? `${numero} · Cuenta` : "Cuenta"}
        </p>
        <div className="mt-3 flex items-center gap-3">
          {user.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt=""
              className="size-11 rounded-full object-cover"
            />
          ) : (
            <span className="grid size-11 place-items-center rounded-full bg-surface-2 text-sm font-semibold">
              {label.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{label}</p>
            <p className="text-xs text-muted">
              {status === "ok"
                ? "Temario guardado en tu cuenta"
                : status === "cargando"
                  ? "Sincronizando…"
                  : status === "error"
                    ? "No se pudo guardar ahora"
                    : "Conectado"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-4 h-11 w-full rounded-full bg-surface-2 text-sm font-medium"
        >
          Salir
        </button>
      </section>
    );
  }

  return (
    <section className="card p-5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
        {numero ? `${numero} · Cuenta` : "Cuenta"}
      </p>
      <h3 className="mt-1 font-display text-xl font-semibold">{titulo}</h3>
      <p className="mt-1 text-sm text-muted">{descripcion}</p>
      <div className="mt-4 space-y-2">
        {GROK_PROVIDERS.map((p) => (
          <button
            key={p.providerId}
            type="button"
            onClick={() => {
              onIntentarEntrar?.();
              signIn(p.providerId, { callbackURL });
            }}
            className={cn(
              "h-11 w-full rounded-full text-sm font-semibold",
              botonesAcento
                ? "bg-accent text-accent-fg hover:opacity-90"
                : "bg-surface-2 font-medium",
            )}
          >
            Continuar con {p.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <EmailAuthForm onIntentar={onIntentarEntrar} />
      </div>
    </section>
  );
}
