import type { Metadata } from "next";
import { Crimson_Text, Inter } from "next/font/google";
import { headers } from "next/headers";
import ClerkThemeProvider from "@/components/ClerkThemeProvider";
import "./globals.css";

const crimsonText = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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
      className={`${crimsonText.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('hearth-theme');var a=localStorage.getItem('hearth-theme-auto');if(a!=='false'&&!s){var h=new Date().getHours();s=(h>=6&&h<18)?'gathering':''}document.documentElement.setAttribute('data-theme',s==='gathering'?'gathering':'')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface-body text-text-primary font-sans">
        {isDevPreview ? children : <ClerkThemeProvider>{children}</ClerkThemeProvider>}
      </body>
    </html>
  );
}
