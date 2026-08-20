import {
  COLOR_BLOQUE_CLASE,
  COLORES_BLOQUE,
  type ColorBloque,
} from "@/lib/oporitmo/bloques";
import { cn } from "@/lib/utils";

export function BloqueMarca({
  color,
  className,
}: {
  color?: ColorBloque | null;
  className?: string;
}) {
  if (!color) return <span className={cn("size-2.5 rounded-full bg-line", className)} />;
  return (
    <span
      className={cn("size-2.5 rounded-full", COLOR_BLOQUE_CLASE[color], className)}
    />
  );
}

export function PaletaColor({
  value,
  onChange,
}: {
  value: ColorBloque;
  onChange: (c: ColorBloque) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORES_BLOQUE.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          onClick={() => onChange(c)}
          className={cn(
            "size-8 rounded-full",
            COLOR_BLOQUE_CLASE[c],
            value === c && "ring-2 ring-ink ring-offset-2 ring-offset-surface",
          )}
        />
      ))}
    </div>
  );
}
