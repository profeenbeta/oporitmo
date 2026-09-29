import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

function n(v: unknown): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

export type CifrasUso = {
  cuentas: number;
  cuentas7: number;
  cuentas30: number;
  visitas7: number;
  visitas30: number;
  personas7: number;
  personas30: number;
};

export const loadAdminUso = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<CifrasUso | { error: true } | null> => {
    const { esAdminX } = await import("./admin-acceso.server");
    if (!(await esAdminX(context.userId))) return null;
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const [cuentas] = await sql<{ n: number }>`
        select count(*)::int as n from "user"
      `;
      const [c7] = await sql<{ n: number }>`
        select count(*)::int as n from "user"
        where "createdAt" >= (now() - interval '7 days')
      `;
      const [c30] = await sql<{ n: number }>`
        select count(*)::int as n from "user"
        where "createdAt" >= (now() - interval '30 days')
      `;
      const [v7] = await sql<{ visitas: number; personas: number }>`
        select
          coalesce(sum(visitas), 0)::int as visitas,
          coalesce((
            select count(distinct visitante)::int
            from oporitmo_visitante_visto
            where dia >= (current_date - 6)
          ), 0) as personas
        from oporitmo_visita_dia
        where dia >= (current_date - 6)
      `;
      const [v30] = await sql<{ visitas: number; personas: number }>`
        select
          coalesce(sum(visitas), 0)::int as visitas,
          coalesce((
            select count(distinct visitante)::int
            from oporitmo_visitante_visto
            where dia >= (current_date - 29)
          ), 0) as personas
        from oporitmo_visita_dia
        where dia >= (current_date - 29)
      `;
      return {
        cuentas: n(cuentas?.n),
        cuentas7: n(c7?.n),
        cuentas30: n(c30?.n),
        visitas7: n(v7?.visitas),
        visitas30: n(v30?.visitas),
        personas7: n(v7?.personas),
        personas30: n(v30?.personas),
      };
    } catch {
      return { error: true };
    }
  });

export const registrarVisita = createServerFn({ method: "POST" })
  .validator((raw: unknown) => {
    const id = typeof raw === "string" ? raw.trim() : "";
    if (!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) return "";
    return id;
  })
  .handler(async ({ data: visitante }) => {
    if (!visitante) return { ok: false as const };
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    assertSameSiteRequest();
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into oporitmo_visita_dia (dia, visitas, visitantes)
      values (current_date, 1, 0)
      on conflict (dia) do update
      set visitas = oporitmo_visita_dia.visitas + 1
    `;
    const visto = await sql<{ visitante: string }>`
      insert into oporitmo_visitante_visto (dia, visitante)
      values (current_date, ${visitante})
      on conflict do nothing
      returning visitante
    `;
    if (visto[0]) {
      await sql`
        update oporitmo_visita_dia
        set visitantes = visitantes + 1
        where dia = current_date
      `;
    }
    return { ok: true as const };
  });
