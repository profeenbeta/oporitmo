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
const PUBLIC_HOST = "oporitmo.grok.me";
const injectedHost = String(import.meta.env.VITE_PUBLIC_HOSTNAME ?? "").trim();
/** Preview has no hostname (no og tags). On deploy, VITE_PUBLIC_HOSTNAME is often
 *  an internal *.vercel.app URL that requires SSO — scrapers cannot fetch it. */
const host = injectedHost
  ? injectedHost.endsWith(".grok.me")
    ? injectedHost
    : PUBLIC_HOST
  : undefined;
const ogImage = host
  ? "https://cdn.jsdelivr.net/gh/profeenbeta/oporitmo@main/public/og.jpg"
  : undefined;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Organiza el temario de oposiciones con vueltas, repasos y sorteos. Sin romper el calendario.",
      },
      { property: "og:title", content: APP_NAME },
      {
        property: "og:description",
        content:
          "Organiza el temario de oposiciones con vueltas, repasos y sorteos. Sin romper el calendario.",
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
      ...(ogImage
        ? [
            { property: "og:image", content: ogImage },
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
            { property: "og:image:type", content: "image/jpeg" },
            { property: "og:image:alt", content: "OpoRitmo" },
            { name: "twitter:image", content: ogImage },
          ]
        : []),
    ],
    links: [
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
    <html lang="es" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
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
