import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { headers } from "next/headers";
import ClerkThemeProvider from "@/components/ClerkThemeProvider";
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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isDevPreview = pathname.startsWith("/dev-preview") || pathname.startsWith("/demo");

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('hearth-theme');var a=localStorage.getItem('hearth-theme-auto');if(a!=='false'&&!s){var h=new Date().getHours();s=(h>=6&&h<18)?'gathering':''}document.documentElement.setAttribute('data-theme',s==='gathering'?'gathering':'')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface-body text-text-primary font-sans">
        <IconProvider>
          {isDevPreview ? children : <ClerkThemeProvider>{children}</ClerkThemeProvider>}
        </IconProvider>
      </body>
    </html>
  );
}
