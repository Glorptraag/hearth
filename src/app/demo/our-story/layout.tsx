"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/demo/our-story/portfolio", label: "Portfolio" },
  { href: "/demo/our-story/report", label: "Report" },
  { href: "/demo/our-story/capabilities", label: "Capabilities" },
];

export default function DemoOurStoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHub = pathname === '/demo/our-story';

  return (
    <div>
      {/* Sub-navigation tabs — hidden on hub root */}
      {!isHub && (
      <nav className="flex gap-xs overflow-x-auto border-b border-border-subtle bg-surface-panel px-md">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative px-md py-sm font-sans text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
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
