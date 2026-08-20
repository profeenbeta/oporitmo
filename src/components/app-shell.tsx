import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  CalendarRange,
  Dices,
  ListChecks,
  Settings2,
} from "lucide-react";
import { Credit } from "@/components/credit";
import { Onboarding } from "@/components/onboarding";
import { SyncHint } from "@/components/cloud-sync";
import { ThemeToggle } from "@/components/theme-sync";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useOpoHydrated, useOpoStore } from "@/lib/oporitmo/store";
import { useSyncStatus } from "@/lib/oporitmo/sync-status";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Hoy", icon: CalendarDays },
  { to: "/calendario", label: "Calendario", icon: CalendarRange },
  { to: "/temas", label: "Temas", icon: ListChecks },
  { to: "/sorteo", label: "Sorteo", icon: Dices },
  { to: "/config", label: "Ajustes", icon: Settings2 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hydrated = useOpoHydrated();
  const onboardingHecho = useOpoStore((s) => s.onboardingHecho);
  const { user, isPending } = useCurrentUserState();
  const syncStatus = useSyncStatus((s) => s.status);
  const esperandoNube =
    Boolean(user) && !onboardingHecho && (isPending || syncStatus === "cargando");

  if (!hydrated || esperandoNube) {
    return (
      <div className="min-h-dvh bg-bg px-4 pt-8">
        <div className="mx-auto h-40 max-w-lg animate-pulse rounded-xl bg-surface-2" />
      </div>
    );
  }

  if (!onboardingHecho) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-24 pt-5 sm:max-w-3xl sm:pb-8">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
              Oposiciones
            </p>
            <h1 className="font-display text-3xl font-semibold text-ink">
              OpoRitmo
            </h1>
            <SyncHint />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <ThemeToggle />
          </div>
        </header>

        <nav className="mb-6 hidden rounded-xl border border-line bg-surface p-1 sm:flex">
          {NAV.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium",
                  active
                    ? "bg-accent text-accent-fg"
                    : "text-muted hover:bg-surface-2 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1">{children}</main>
        <Credit />
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur-sm sm:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium",
                    active ? "text-accent" : "text-muted",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
