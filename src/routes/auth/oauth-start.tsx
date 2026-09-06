import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/auth/oauth-start")({
  component: OAuthStart,
  validateSearch: (s: Record<string, unknown>) => ({
    p: typeof s.p === "string" ? s.p : "",
    back: typeof s.back === "string" ? s.back : "/",
  }),
});

function OAuthStart() {
  const { p, back } = Route.useSearch();

  useEffect(() => {
    const ok = GROK_PROVIDERS.some((x) => x.providerId === p);
    if (!ok) return;
    const puente = `/auth/oauth-bridge?back=${encodeURIComponent(back)}`;
    void signIn(p, { callbackURL: puente, errorCallbackURL: puente });
  }, [p, back]);

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-ink">
      <p className="text-sm text-muted">Entrando…</p>
    </main>
  );
}
