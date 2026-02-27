"use client";

import { cn, scoreBgColor } from "@/lib/utils";

export function ScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5",
    lg: "text-base px-3 py-1",
  };

  return (
    <span
      className={cn(
        "font-mono-nums rounded-md font-semibold inline-flex items-center",
        scoreBgColor(score),
        sizeClasses[size],
        score >= 85 && "score-glow"
      )}
    >
      {score.toFixed(1)}
    </span>
  );
}
