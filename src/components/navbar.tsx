"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Rankings" },
  { href: "/trending", label: "Trending" },
  { href: "/categories", label: "Categories" },
  { href: "/compare", label: "Compare" },
  { href: "/about", label: "About" },
];

export function Navbar({ maxWidth = "max-w-7xl" }: { maxWidth?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-bg-primary/80 backdrop-blur-md border-b border-border">
      <div className={cn(maxWidth, "mx-auto px-4 py-3 flex items-center justify-between")}>
        <Link href="/" className="flex items-center gap-1">
          <span className="font-mono-nums text-lg font-bold text-accent tracking-wider">
            BENCHMARKS
          </span>
          <span className="font-mono-nums text-lg font-bold text-text-muted">
            .LIVE
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors",
                pathname === link.href
                  ? "text-accent font-medium"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="sm:hidden border-t border-border bg-bg-card/95 backdrop-blur-md">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-4 py-3 text-sm border-b border-border/50 transition-colors",
                pathname === link.href
                  ? "text-accent font-medium bg-accent/5"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
