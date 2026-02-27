"use client";

import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

export function CategoryTabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (category: string) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onChange(cat.key)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
            active === cat.key
              ? "bg-accent/15 text-accent border border-accent/30"
              : "bg-bg-card text-text-secondary border border-border hover:border-border-hover hover:text-text-primary"
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
