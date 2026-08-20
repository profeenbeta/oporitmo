import { useEffect, useRef } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { loadCloudState, saveCloudState } from "@/lib/oporitmo/cloud";
import { useOpoHydrated, useOpoStore } from "@/lib/oporitmo/store";
import { useSyncStatus } from "@/lib/oporitmo/sync-status";

export function CloudSync() {
  const { user, isPending } = useCurrentUserState();
  const hydrated = useOpoHydrated();
  const setStatus = useSyncStatus((s) => s.setStatus);
  const skip = useRef(false);
  const ready = useRef(false);

  useEffect(() => {
    if (isPending || !hydrated) return;
    if (!user) {
      setStatus("local");
      ready.current = false;
      return;
    }

    let cancelled = false;
    ready.current = false;
    setStatus("cargando");

    void (async () => {
      try {
        const remote = await loadCloudState();
        if (cancelled) return;
        const local = useOpoStore.getState().snapshotNube();
        if (!remote) {
          await saveCloudState({ data: { ...local, savedAt: local.savedAt || Date.now() } });
        } else if (!local.savedAt || remote.savedAt >= local.savedAt) {
          skip.current = true;
          useOpoStore.getState().aplicarNube(remote);
        } else {
          await saveCloudState({ data: local });
        }
        if (!cancelled) {
          setStatus("ok");
          ready.current = true;
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          ready.current = true;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isPending, hydrated, setStatus]);

  useEffect(() => {
    if (!user) return;
    let timer = 0;
    const unsub = useOpoStore.subscribe(() => {
      if (skip.current) {
        skip.current = false;
        return;
      }
      if (!ready.current) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const payload = {
          ...useOpoStore.getState().snapshotNube(),
          savedAt: Date.now(),
        };
        useOpoStore.setState({ savedAt: payload.savedAt });
        void saveCloudState({ data: payload })
          .then(() => setStatus("ok"))
          .catch(() => setStatus("error"));
      }, 900);
    });
    return () => {
      unsub();
      window.clearTimeout(timer);
    };
  }, [user?.id, setStatus]);

  return null;
}

export function SyncHint() {
  const { user, isPending } = useCurrentUserState();
  const status = useSyncStatus((s) => s.status);
  if (isPending) return null;
  if (!user) {
    return (
      <p className="mt-1 text-xs text-muted">
        Sin cuenta, solo se guarda aquí. Entra para no perderlo.
      </p>
    );
  }
  const texto =
    status === "cargando"
      ? "Sincronizando…"
      : status === "ok"
        ? "Guardado en tu cuenta"
        : status === "error"
          ? "No se pudo guardar en la cuenta"
          : "Cuenta conectada";
  return <p className="mt-1 text-xs text-muted">{texto}</p>;
}
