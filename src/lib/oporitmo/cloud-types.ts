import type { AppData } from "./types";
import type { Apariencia } from "@/lib/theme";
import type { Bloque } from "./bloques";

export type CloudPayload = AppData & {
  savedAt: number;
  onboardingHecho: boolean;
  apariencia?: Apariencia;
  bloques?: Bloque[];
};
