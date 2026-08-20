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
const host = import.meta.env.VITE_PUBLIC_HOSTNAME;
const ogImage = host ? `https://${host}/og.jpg` : undefined;
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
          "Organiza el temario de oposiciones con vueltas, repasos y sorteos. Sin romper el calendario.",
      },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "theme-color", content: "#f3eee4" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(ogImage
        ? [
            { property: "og:image", content: ogImage },
            { property: "og:image:width", content: "1200" },
            { property: "og:image:height", content: "630" },
          ]
        : []),
      ...(xBanner
        ? [
            { property: "x:game:image", content: xBanner },
            { property: "x:game:image:width", content: "1200" },
            { property: "x:game:image:height", content: "264" },
          ]
        : []),
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
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
        <CloudSync />
        <AuthProvider>
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
