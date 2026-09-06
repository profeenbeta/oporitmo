import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  CalendarRange,
  Dices,
  ListChecks,
  Settings2,
} from "lucide-react";
import { Credit } from "@/components/credit";
import { Onboarding } from "@/components/onboarding";
import { SidebarResumen } from "@/components/sidebar-resumen";
import { SyncHint } from "@/components/cloud-sync";
import { ThemeToggle } from "@/components/theme-sync";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useOpoHydrated, useOpoStore } from "@/lib/oporitmo/store";
import { useSyncStatus } from "@/lib/oporitmo/sync-status";
import { esZonaSinGesto, gestoHorizontal } from "@/lib/gestos";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Hoy", icon: CalendarDays },
  { to: "/calendario", label: "Calendario", icon: CalendarRange },
  { to: "/temas", label: "Temas", icon: ListChecks },
  { to: "/sorteo", label: "Sorteo", icon: Dices },
  { to: "/config", label: "Ajustes", icon: Settings2 },
] as const;

function toque() {
  try {
    navigator.vibrate?.(12);
  } catch {
    /* iOS no lo tiene */
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const yaMontado = useRef(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const barra = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    yaMontado.current = true;
  }, []);
  const [corteCarga, setCorteCarga] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setCorteCarga(true), 8000);
    return () => window.clearTimeout(t);
  }, []);
  const hydrated = useOpoHydrated();
  const onboardingHecho = useOpoStore((s) => s.onboardingHecho);
  const { user, isPending } = useCurrentUserState();
  const syncStatus = useSyncStatus((s) => s.status);
  const esperandoNube =
    Boolean(user) && !onboardingHecho && (isPending || syncStatus === "cargando");

  if ((!hydrated || esperandoNube) && !corteCarga) {
    return (
      <div className="min-h-dvh bg-bg px-4 pt-8">
        <div className="mx-auto h-40 max-w-lg animate-pulse rounded-xl bg-surface-2" />
      </div>
    );
  }

  if (!onboardingHecho) {
    return <Onboarding />;
  }

  const activeIndex = Math.max(
    0,
    NAV.findIndex((item) =>
      item.to === "/" ? pathname === "/" : pathname.startsWith(item.to),
    ),
  );

  function onPointerDown(e: React.PointerEvent) {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches) {
      swipe.current = null;
      return;
    }
    if (esZonaSinGesto(e.target)) {
      swipe.current = null;
      return;
    }
    swipe.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!swipe.current) return;
    const dir = gestoHorizontal(swipe.current, {
      x: e.clientX,
      y: e.clientY,
    });
    swipe.current = null;
    if (!dir) return;
    const j = activeIndex + dir;
    const dest = NAV[j];
    if (!dest) return;
    toque();
    void navigate({ to: dest.to });
  }

  function onBarraDown(e: React.PointerEvent) {
    barra.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onBarraUp(e: React.PointerEvent) {
    if (!barra.current) return;
    const start = barra.current;
    barra.current = null;
    const dir = gestoHorizontal(
      start,
      { x: e.clientX, y: e.clientY },
      40,
    );
    if (dir) {
      const dest = NAV[activeIndex + dir];
      if (!dest) return;
      toque();
      void navigate({ to: dest.to });
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const i = Math.min(
      NAV.length - 1,
      Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * NAV.length)),
    );
    const dest = NAV[i];
    if (!dest || dest.to === pathname) return;
    toque();
    void navigate({ to: dest.to });
  }

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <div
        className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-8 pt-5 touch-pan-y sm:max-w-3xl xl:grid xl:max-w-7xl xl:grid-cols-[15rem_minmax(0,_1fr)] xl:gap-10 xl:px-8 xl:pb-8 xl:pt-8"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipe.current = null;
        }}
      >
        <aside className="hidden xl:flex xl:sticky xl:top-8 xl:h-[calc(100dvh-4rem)] xl:flex-col">
          <h1 className="font-display text-3xl font-semibold leading-none text-ink">
            OpoRitmo
          </h1>
          <p className="mt-2 text-sm text-muted">Tu oposición, a tu ritmo</p>
          <div className="mt-1">
            <SyncHint />
          </div>
          <nav className="mt-8 flex flex-col gap-1">
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium",
                    active
                      ? "bg-accent text-accent-fg"
                      : "text-muted hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <SidebarResumen />
          <div className="mt-auto flex items-center justify-between gap-3 pt-8">
            <Credit className="mt-0 text-left" />
            <ThemeToggle />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col pb-[calc(8rem+env(safe-area-inset-bottom))] sm:pb-0">
          <header className="mb-5 flex items-start justify-between gap-3 xl:hidden">
            <div>
              <h1 className="font-display text-3xl font-semibold leading-none text-ink">
                OpoRitmo
              </h1>
              <p className="mt-2 text-sm text-muted">
                Tu oposición, a tu ritmo
              </p>
              <SyncHint />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <ThemeToggle />
            </div>
          </header>

          <nav className="card card-static relative mb-6 hidden p-1 sm:flex xl:hidden">
            <span
              aria-hidden
              className="absolute inset-y-1 z-0 rounded-full bg-accent transition-[left] duration-700 ease-[cubic-bezier(0.22,1.15,0.32,1)]"
              style={{
                width: "calc((100% - 0.5rem) / 5)",
                left: `calc(0.25rem + ${activeIndex} * ((100% - 0.5rem) / 5))`,
              }}
            />
            {NAV.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={toque}
                  className={cn(
                    "relative z-10 flex-1 rounded-full px-3 py-2 text-center text-sm font-medium",
                    active ? "text-accent-fg" : "text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="flex-1">
            <div
              key={pathname}
              className={yaMontado.current ? "page-in" : undefined}
            >
              {children}
            </div>
          </main>
          <div className="xl:hidden">
            <Credit />
          </div>
        </div>
      </div>

      <nav
        aria-label="Pestañas"
        className="glass card-static fixed inset-x-3 bottom-3 z-20 overflow-hidden rounded-3xl sm:hidden"
        style={{ touchAction: "pan-x" }}
        onPointerDown={onBarraDown}
        onPointerUp={onBarraUp}
        onPointerCancel={() => {
          barra.current = null;
        }}
      >
        <ul className="relative mx-auto grid max-w-lg grid-cols-5 p-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <span
            aria-hidden
            className="pointer-events-none absolute top-1 z-0 h-14 rounded-2xl bg-accent transition-[left] duration-700 ease-[cubic-bezier(0.22,1.15,0.32,1)]"
            style={{
              width: "calc((100% - 0.5rem) / 5)",
              left: `calc(0.25rem + ${activeIndex} * ((100% - 0.5rem) / 5))`,
            }}
          />
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <li key={item.to} className="pointer-events-none relative z-10">
                <span
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-medium",
                    active ? "text-accent-fg" : "text-muted",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
