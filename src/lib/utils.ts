export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatPercent(n: number | null | undefined): string {
  if (n == null) return "-";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-accent";
  if (score >= 60) return "text-secondary";
  if (score >= 40) return "text-text-secondary";
  return "text-text-muted";
}

export function scoreBgColor(score: number): string {
  if (score >= 80) return "bg-accent/15 text-accent";
  if (score >= 60) return "bg-secondary/15 text-secondary";
  if (score >= 40) return "bg-text-secondary/15 text-text-secondary";
  return "bg-text-muted/15 text-text-muted";
}

export function trendColor(trend: number): string {
  if (trend > 0) return "text-accent";
  if (trend < 0) return "text-down";
  return "text-text-muted";
}

export interface CategoryTag {
  abbr: string;
  color: string; // tailwind text color class
  bg: string;    // tailwind bg color class
}

export function categoryTag(category: string): CategoryTag {
  const map: Record<string, CategoryTag> = {
    llm:        { abbr: "LLM",  color: "text-[#06D6A0]", bg: "bg-[#06D6A0]/12 border-[#06D6A0]/20" },
    image:      { abbr: "IMG",  color: "text-[#A78BFA]", bg: "bg-[#A78BFA]/12 border-[#A78BFA]/20" },
    video:      { abbr: "VID",  color: "text-[#F472B6]", bg: "bg-[#F472B6]/12 border-[#F472B6]/20" },
    audio:      { abbr: "AUD",  color: "text-[#FFA800]", bg: "bg-[#FFA800]/12 border-[#FFA800]/20" },
    code:       { abbr: "CODE", color: "text-[#48BFE3]", bg: "bg-[#48BFE3]/12 border-[#48BFE3]/20" },
    search:     { abbr: "SRC",  color: "text-[#34D399]", bg: "bg-[#34D399]/12 border-[#34D399]/20" },
    agents:     { abbr: "AGT",  color: "text-[#F97316]", bg: "bg-[#F97316]/12 border-[#F97316]/20" },
    infra:      { abbr: "INF",  color: "text-[#60A5FA]", bg: "bg-[#60A5FA]/12 border-[#60A5FA]/20" },
    embeddings: { abbr: "EMB",  color: "text-[#C084FC]", bg: "bg-[#C084FC]/12 border-[#C084FC]/20" },
  };
  return map[category] || { abbr: "AI", color: "text-text-muted", bg: "bg-text-muted/12 border-text-muted/20" };
}
