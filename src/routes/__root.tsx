import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { CloudSync } from "@/components/cloud-sync";
import { PwaRegister } from "@/components/pwa-install";
import { ThemeSync } from "@/components/theme-sync";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = "OpoRitmo";
const OG_IMAGE = "https://oporitmo.es/og.jpg";
const injectedHost = String(import.meta.env.VITE_PUBLIC_HOSTNAME ?? "").trim();
/** Preview has no hostname (no x-banner). Share card always uses oporitmo.es. */
const host = injectedHost
  ? injectedHost.endsWith(".grok.me")
    ? injectedHost
    : "oporitmo.es"
  : undefined;
const xBanner = host ? `https://${host}/x-banner.jpg` : undefined;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Tu oposición, a tu ritmo.",
      },
      { property: "og:title", content: APP_NAME },
      {
        property: "og:description",
        content:
          "Tu oposición, a tu ritmo.",
      },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:type", content: "website" },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "theme-color", content: "#f3eee4" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: APP_NAME },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: OG_IMAGE },
      ...(xBanner
        ? [
            { property: "x:game:image", content: xBanner },
            { property: "x:game:image:width", content: "1200" },
            { property: "x:game:image:height", content: "264" },
          ]
        : []),
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap",
      },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
    scripts: [{ children: THEME_BOOT_SCRIPT }],
  }),
  component: () => (
    <html
      lang="es"
      className="antialiased"
      suppressHydrationWarning
      style={{ background: "#f3eee4" }}
    >
      <head>
        <HeadContent />
      </head>
      <body style={{ background: "#f3eee4", margin: 0, minHeight: "100dvh" }}>
        <PreviewHostBridge />
        <ThemeSync />
        <PwaRegister />
        <AuthProvider>
          <CloudSync />
          <Outlet />
          <Toaster
            position="bottom-center"
            toastOptions={{
              className:
                "border border-line bg-surface text-ink shadow-none font-sans",
            }}
          />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
