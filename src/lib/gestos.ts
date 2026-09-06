export function gestoHorizontal(
  origen: { x: number; y: number },
  destino: { x: number; y: number },
  minimo = 72,
): -1 | 0 | 1 {
  const dx = destino.x - origen.x;
  const dy = destino.y - origen.y;
  if (Math.abs(dx) < minimo) return 0;
  if (Math.abs(dx) < Math.abs(dy) * 1.25) return 0;
  return dx < 0 ? 1 : -1;
}

export function esZonaSinGesto(el: EventTarget | null) {
  if (!(el instanceof Element)) return false;
  return Boolean(
    el.closest("input, textarea, select, [data-gesto], [data-vaul-drawer]"),
  );
}

export function esEscritorio() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1280px)").matches
  );
}
