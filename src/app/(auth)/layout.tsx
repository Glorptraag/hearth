"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", emoji: "🏠" },
  { href: "/our-story/portfolio", label: "Story", emoji: "📖" },
  { href: "/log", label: "Log", emoji: "✏️", primary: true },
  { href: "/explore/activities", label: "Explore", emoji: "🔍" },
  { href: "/settings", label: "Settings", emoji: "⚙️" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/our-story/portfolio") return pathname.startsWith("/our-story");
  if (href === "/log") return pathname === "/log";
  if (href === "/explore/activities") return pathname.startsWith("/explore");
  if (href === "/settings") return pathname === "/settings";
  return false;
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const familyName = user?.lastName ? `${user.lastName} Family` : "My Family";

  return (
    <div className="flex min-h-dvh flex-col bg-surface-body">
      {/* Top header */}
      <header className="flex items-center justify-between border-b border-border-subtle bg-surface-panel px-md py-sm">
        <span className="font-serif text-lg font-semibold text-text-primary tracking-[-0.02em]">
          Hearth
        </span>
        <div className="flex items-center gap-md">
          <span className="font-sans text-sm text-text-secondary">
            {familyName}
          </span>
          <Link
            href="/notifications"
            className="flex h-[36px] w-[36px] items-center justify-center rounded-md text-text-muted transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-ember-glow hover:text-text-primary"
          >
            <span className="text-lg">🔔</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-[72px]">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border-subtle bg-surface-panel px-xs py-sm">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-xs font-sans text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                item.primary
                  ? active
                    ? "text-ember"
                    : "text-ember/80"
                  : active
                    ? "text-ember"
                    : "text-text-muted"
              }`}
            >
              <span
                className={`text-xl ${
                  item.primary
                    ? "flex h-[44px] w-[44px] items-center justify-center rounded-full bg-ember text-lg shadow-[0_4px_16px_rgba(217,123,58,0.3),var(--shadow-glow)]"
                    : ""
                }`}
              >
                {item.emoji}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
