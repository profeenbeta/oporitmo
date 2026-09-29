/** Id numérico de X de @ProfeEnBeta. Una sola cuenta admin. */
const ADMIN_X_ID = "114512020";
const ADMIN_HANDLE = "profeenbeta";

function compacto(s: string): string {
  return s.replace(/^@/, "").replace(/[\s._-]+/g, "").toLowerCase();
}

function esIdentidadAdmin(accountId: string, name: string): boolean {
  const id = accountId.trim();
  if (id === ADMIN_X_ID) return true;
  if (compacto(id) === ADMIN_HANDLE) return true;
  return compacto(name).includes(ADMIN_HANDLE);
}

export async function esAdminX(userId: string): Promise<boolean> {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  const rows = await sql<{ accountId: string; name: string }>`
    select a."accountId" as "accountId", u.name as name
    from "account" a
    join "user" u on u.id = a."userId"
    where a."userId" = ${userId}
      and a."providerId" in ('grok-x', 'twitter')
  `;
  return rows.some((r) => esIdentidadAdmin(r.accountId, r.name));
}
