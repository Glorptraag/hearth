"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/our-story/portfolio", label: "Portfolio" },
  { href: "/our-story/report", label: "Report" },
  { href: "/our-story/capabilities", label: "Capabilities" },
];

export default function OurStoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHub = pathname === '/our-story';

  return (
    <div>
      {/* Sub-navigation tabs — hidden on hub root */}
      {!isHub && (
      <nav className="flex gap-xs border-b border-border-subtle bg-surface-panel px-md">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative px-md py-sm font-sans text-sm font-medium transition-all duration-200 ease-[var(--ease-default)] ${
                active ? "text-ember" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {tab.label}
              {active && (
                <span className="absolute bottom-0 left-md right-md h-[2px] rounded-full bg-ember" />
              )}
            </Link>
          );
        })}
      </nav>
      )}
      {children}
    </div>
  );
}
