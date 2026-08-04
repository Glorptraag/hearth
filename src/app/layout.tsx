import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { headers } from "next/headers";
import ClerkThemeProvider from "@/components/ClerkThemeProvider";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { NativeProvider } from "@/components/platform/NativeProvider";
import { isNativeRequest } from "@/lib/platform/native";
import { IconProvider } from "@/components/icons";
import "./globals.css";

// Hearth Design System v2: Fraunces (variable, with SOFT axis) replaces Crimson Text.
// Variable axes — SOFT (warmth, 0–100) and opsz (optical size, 9–144) — are tuned
// per element via the .display / .heading / .body-serif utility classes in globals.css.
const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "opsz"],
  style: ["normal", "italic"],
});

// DM Sans (variable) replaces Inter — warmer round-o, friendlier r, pairs with Fraunces.
const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hearth",
  description: "Homeschool learning management for Australian families",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Hearth",
    // The app paints its own surface behind the status bar; translucent lets
    // the warm body colour run to the top edge instead of a black band.
    statusBarStyle: "black-translucent",
  },
};

// `themeColor` is deliberately NOT declared here. Next would emit a static
// <meta name="theme-color">, but Hearth switches theme by time of day, so the
// tag is created and kept in sync by the flash-prevention script below and
// applyTheme() in src/hooks/use-theme.ts. One tag, one owner.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Required for env(safe-area-inset-*) to report real values — the mobile
  // bottom nav and tray already consume them.
  viewportFit: "cover",
  // Zoom stays enabled: disabling it is a WCAG failure and Hearth targets AA.
  userScalable: true,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  // Resolved once per request here, then read by client components through
  // useIsNative(). Sniffing window.Capacitor in a client component instead
  // would desync from this HTML on hydration.
  const isNative = isNativeRequest(headersList);
  // Routes that must render without Clerk. dev-preview and demo cannot reach
  // Clerk's API; /offline must render with no network at all, since the
  // service worker serves it as the airplane-mode fallback.
  const skipClerk =
    pathname.startsWith("/dev-preview") ||
    pathname.startsWith("/demo") ||
    pathname.startsWith("/offline");

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            // Mirrors the resolution order in src/hooks/use-theme.ts exactly:
            // auto mode always wins over a stale stored value. Also owns the
            // theme-color meta tag (created here so there is only ever one).
            __html: `(function(){try{var stored=localStorage.getItem('hearth-theme');var isAuto=localStorage.getItem('hearth-theme-auto')!=='false';var h=new Date().getHours();var auto=(h>=6&&h<18)?'gathering':'dark';var t=(!isAuto&&stored)?stored:auto;document.documentElement.setAttribute('data-theme',t==='gathering'?'gathering':'');var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.setAttribute('name','theme-color');document.head.appendChild(m)}m.setAttribute('content',t==='gathering'?'#FDF6F0':'#15110D')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface-body text-text-primary font-sans">
        <ServiceWorkerRegistrar />
        <NativeProvider isNative={isNative}>
          <IconProvider>
            {skipClerk ? children : <ClerkThemeProvider>{children}</ClerkThemeProvider>}
          </IconProvider>
        </NativeProvider>
      </body>
    </html>
  );
}
