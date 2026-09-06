import { createFileRoute } from "@tanstack/react-router";
import { SESSION_TOKEN_COOKIE } from "@/lib/auth/session-cookie";

export const Route = createFileRoute("/auth/oauth-land")({
  server: {
    handlers: {
      POST: ({ request }) => aterrizar(request),
      GET: () => Response.redirect("/", 302),
    },
  },
});

async function aterrizar(request: Request): Promise<Response> {
  const form = await request.formData().catch(() => null);
  const token = decodeURIComponent(String(form?.get("t") ?? ""));
  const nextRaw = String(form?.get("next") ?? "/");
  const next = nextRaw.startsWith("/") ? nextRaw : "/";
  if (!token) return Response.redirect(next, 302);

  const { auth } = await import("@/lib/auth/server");
  const session = await auth.api.getSession({
    headers: new Headers({ Authorization: `Bearer ${token}` }),
  });
  if (!session?.user) return Response.redirect(next, 302);

  const cookie = `${SESSION_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=2592000`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: next,
      "Set-Cookie": cookie,
      "cache-control": "no-store",
    },
  });
}