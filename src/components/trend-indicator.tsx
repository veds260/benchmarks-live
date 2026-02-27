"use client";

import { cn, trendColor, formatPercent } from "@/lib/utils";

export function TrendIndicator({
  value,
  showArrow = true,
}: {
  value: number;
  showArrow?: boolean;
}) {
  return (
    <span className={cn("font-mono-nums text-sm inline-flex items-center gap-0.5", trendColor(value))}>
      {showArrow && value !== 0 && (
        <span className="text-[10px]">{value > 0 ? "▲" : "▼"}</span>
      )}
      {formatPercent(value)}
    </span>
  );
}
