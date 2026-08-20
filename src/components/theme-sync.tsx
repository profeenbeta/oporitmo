import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { aplicarApariencia, type Apariencia } from "@/lib/theme";
import { useOpoStore } from "@/lib/oporitmo/store";
import { cn } from "@/lib/utils";

export function ThemeSync() {
  const apariencia = useOpoStore((s) => s.apariencia);
  useEffect(() => {
    aplicarApariencia(apariencia);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => aplicarApariencia(apariencia);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [apariencia]);
  return null;
}

export function ThemeToggle({ className }: { className?: string }) {
  const apariencia = useOpoStore((s) => s.apariencia);
  const setApariencia = useOpoStore((s) => s.setApariencia);
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    const sync = () =>
      setOscuro(document.documentElement.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, [apariencia]);

  return (
    <button
      type="button"
      onClick={() => setApariencia(oscuro ? "claro" : "oscuro")}
      className={cn(
        "grid size-11 place-items-center rounded-md border border-line bg-surface text-ink",
        className,
      )}
      aria-label={oscuro ? "Pasar a modo claro" : "Pasar a modo oscuro"}
    >
      {oscuro ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}

const OPCIONES: { id: Apariencia; label: string }[] = [
  { id: "claro", label: "Claro" },
  { id: "oscuro", label: "Oscuro" },
  { id: "sistema", label: "Sistema" },
];

export function ThemePicker() {
  const apariencia = useOpoStore((s) => s.apariencia);
  const setApariencia = useOpoStore((s) => s.setApariencia);
  return (
    <div>
      <p className="mb-1 text-sm text-muted">Apariencia</p>
      <div className="grid grid-cols-3 gap-1 rounded-md bg-surface-2 p-1">
        {OPCIONES.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setApariencia(o.id)}
            className={cn(
              "h-10 rounded-md text-sm font-medium",
              apariencia === o.id
                ? "bg-accent text-accent-fg"
                : "text-muted",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
