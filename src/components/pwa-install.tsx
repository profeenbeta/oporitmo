import { useEffect, useState } from "react";

type BeforeInstall = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaRegister() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js");
  }, []);
  return null;
}

export function PwaInstall() {
  const [evento, setEvento] = useState<BeforeInstall | null>(null);
  const [instalada, setInstalada] = useState(false);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const solo =
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;
    setInstalada(solo);

    function onPrompt(e: Event) {
      e.preventDefault();
      setEvento(e as BeforeInstall);
    }
    function onInstalled() {
      setInstalada(true);
      setEvento(null);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
        En el móvil
      </p>
      <h3 className="mt-1 font-display text-xl font-semibold">Instalar OpoRitmo</h3>
      {instalada ? (
        <p className="mt-2 text-sm text-muted">
          Ya está instalada en este dispositivo. Se abre como una app, sin la
          barra del navegador.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">
            Así la tienes en la pantalla de inicio, como cualquier otra app. Los
            datos siguen en el dispositivo o en tu cuenta.
          </p>
          {evento && (
            <button
              type="button"
              onClick={() => void evento.prompt()}
              className="mt-4 h-11 w-full rounded-md bg-accent text-sm font-semibold text-accent-fg"
            >
              Instalar OpoRitmo
            </button>
          )}
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>
              <span className="font-medium text-ink">iPhone.</span> Safari →
              botón Compartir → Añadir a pantalla de inicio.
            </li>
            <li>
              <span className="font-medium text-ink">Android.</span> Menú del
              navegador → Instalar aplicación o Añadir a la pantalla de inicio.
            </li>
          </ul>
        </>
      )}
    </section>
  );
}
