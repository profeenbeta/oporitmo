export const COLORES_BLOQUE = [
  "bosque",
  "azul",
  "terracota",
  "mostaza",
  "berenjena",
  "oliva",
  "coral",
  "pizarra",
] as const;

export type ColorBloque = (typeof COLORES_BLOQUE)[number];

export type Bloque = {
  id: string;
  nombre: string;
  color: ColorBloque;
};

export const COLOR_BLOQUE_CLASE: Record<ColorBloque, string> = {
  bosque: "bg-bloque-bosque",
  azul: "bg-bloque-azul",
  terracota: "bg-bloque-terracota",
  mostaza: "bg-bloque-mostaza",
  berenjena: "bg-bloque-berenjena",
  oliva: "bg-bloque-oliva",
  coral: "bg-bloque-coral",
  pizarra: "bg-bloque-pizarra",
};

export const COLOR_CELDA_BLOQUE: Record<ColorBloque, string> = {
  bosque: "bg-bloque-bosque text-accent-fg",
  azul: "bg-bloque-azul text-accent-fg",
  terracota: "bg-bloque-terracota text-accent-fg",
  mostaza: "bg-bloque-mostaza text-ink",
  berenjena: "bg-bloque-berenjena text-accent-fg",
  oliva: "bg-bloque-oliva text-accent-fg",
  coral: "bg-bloque-coral text-accent-fg",
  pizarra: "bg-bloque-pizarra text-accent-fg dark:text-ink",
};

export function clasePuntoFoco(foco: string): string {
  if (foco === "examen") return "bg-warn ring-1 ring-ink/40";
  if (foco === "repaso") return "bg-white ring-1 ring-ink/50";
  if (
    foco === "nuevo" ||
    foco === "profundizar" ||
    foco === "acabar" ||
    foco === "hecho"
  ) {
    return "bg-ink ring-1 ring-white/80";
  }
  return "bg-faint ring-1 ring-ink/20";
}

export function esColorBloque(v: unknown): v is ColorBloque {
  return typeof v === "string" && (COLORES_BLOQUE as readonly string[]).includes(v);
}

export function siguienteColor(usados: ColorBloque[]): ColorBloque {
  const libre = COLORES_BLOQUE.find((c) => !usados.includes(c));
  return libre ?? COLORES_BLOQUE[usados.length % COLORES_BLOQUE.length]!;
}

export function bloquesDemo(): Bloque[] {
  return [
    { id: "b-did", nombre: "Didáctica", color: "bosque" },
    { id: "b-cf", nombre: "Condición física", color: "azul" },
    { id: "b-juego", nombre: "Juego", color: "terracota" },
  ];
}

export function bloqueDeDemo(temaId: number): string | null {
  if (temaId <= 8) return "b-did";
  if (temaId <= 16) return "b-cf";
  return "b-juego";
}
