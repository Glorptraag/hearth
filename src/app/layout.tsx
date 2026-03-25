import type { Metadata } from "next";
import { Crimson_Text, Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        data-theme="dark"
        className={`${crimsonText.variable} ${inter.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-surface-body text-text-primary font-sans">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
