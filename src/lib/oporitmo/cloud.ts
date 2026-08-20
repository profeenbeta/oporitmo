import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type { CloudPayload } from "./cloud-types";

function asPayload(value: unknown): CloudPayload | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<CloudPayload>;
  if (!Array.isArray(v.temas) || !v.config) return null;
  return {
    savedAt: typeof v.savedAt === "number" ? v.savedAt : 0,
    config: v.config,
    temas: v.temas,
    sesiones: Array.isArray(v.sesiones) ? v.sesiones : [],
    bloques: Array.isArray(v.bloques) ? v.bloques : [],
    simulacros: Array.isArray(v.simulacros) ? v.simulacros : [],
    onboardingHecho: Boolean(v.onboardingHecho),
    apariencia: v.apariencia,
  };
}

export const loadCloudState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ payload: unknown }>`
      select payload from oporitmo_state where user_id = ${context.userId} limit 1
    `;
    return asPayload(rows[0]?.payload);
  });

export const saveCloudState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: CloudPayload) => {
    if (!data || !Array.isArray(data.temas) || !data.config) {
      throw new Error("Copia no válida");
    }
    return data;
  })
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql.query(
      `insert into oporitmo_state (user_id, payload, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (user_id) do update
       set payload = excluded.payload, updated_at = now()`,
      [context.userId, JSON.stringify(data)],
    );
    return { ok: true as const, savedAt: data.savedAt };
  });
