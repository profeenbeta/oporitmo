import { Check } from "lucide-react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

export type OpcionHoja = { id: string; label: string };

export function HojaOpciones({
  open,
  onOpenChange,
  titulo,
  descripcion,
  opciones,
  valor,
  onElegir,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  descripcion?: string;
  opciones: OpcionHoja[];
  valor: string;
  onElegir: (id: string) => void;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-ink/40" />
        <Drawer.Content className="glass fixed inset-x-3 bottom-3 z-50 mx-auto max-w-lg rounded-3xl px-2 pb-3 pt-2 outline-none">
          <div className="mx-auto mb-2 mt-1 h-1.5 w-10 rounded-full bg-faint" />
          <Drawer.Title className="px-3 pb-1 pt-1 text-center text-sm font-semibold">
            {titulo}
          </Drawer.Title>
          {descripcion ? (
            <Drawer.Description className="px-3 pb-3 text-center text-sm text-muted">
              {descripcion}
            </Drawer.Description>
          ) : (
            <Drawer.Description className="sr-only">{titulo}</Drawer.Description>
          )}
          <ul className="overflow-hidden rounded-2xl bg-surface">
            {opciones.map((o, i) => {
              const activo = o.id === valor;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onElegir(o.id);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "flex h-12 w-full items-center justify-between px-4 text-left text-base",
                      i < opciones.length - 1 && "border-b border-line",
                    )}
                  >
                    <span className={activo ? "font-semibold text-accent" : ""}>
                      {o.label}
                    </span>
                    {activo && (
                      <Check className="size-5 text-accent" strokeWidth={2.25} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <Drawer.Close asChild>
            <button
              type="button"
              className="mt-2 h-12 w-full rounded-full bg-surface text-base font-semibold"
            >
              Cancelar
            </button>
          </Drawer.Close>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
