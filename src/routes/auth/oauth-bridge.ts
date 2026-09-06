import { createFileRoute } from "@tanstack/react-router";
import { origenPermitido } from "@/lib/auth/dominio";
import { SESSION_TOKEN_COOKIE } from "@/lib/auth/session-cookie";

export const Route = createFileRoute("/auth/oauth-bridge")({
  server: {
    handlers: {
      GET: ({ request }) => puente(request),
    },
  },
});

function cookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie") ?? "";
  const prefix = `${name}=`;
  for (const part of raw.split(/;\s*/)) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length));
    }
  }
  return null;
}

function puente(request: Request): Response {
  const url = new URL(request.url);
  const back = url.searchParams.get("back") || "https://oporitmo.es/";
  if (!origenPermitido(back)) {
    return Response.redirect("https://oporitmo.es/", 302);
  }
  const destino = new URL(back);
  if (destino.hostname === url.hostname) {
    destino.pathname = "/";
    destino.search = "";
    return Response.redirect(destino, 302);
  }
  const token = cookie(request, SESSION_TOKEN_COOKIE);
  if (!token) {
    return Response.redirect(back, 302);
  }
  const action = `${destino.origin}/auth/oauth-land`;
  const html = `<!doctype html><meta charset="utf-8"><title>OpoRitmo</title>
<body>
<form method="post" action="${action}">
<input type="hidden" name="t" value="${encodeURIComponent(token)}">
<input type="hidden" name="next" value="${destino.pathname}${destino.search}">
</form>
<script>document.forms[0].submit()</script>
<p>Volviendo a OpoRitmo…</p>
</body>`;
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
