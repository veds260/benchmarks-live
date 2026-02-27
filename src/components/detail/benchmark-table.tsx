"use client";

import { Benchmark } from "@/lib/types";

export function BenchmarkTable({ benchmarks }: { benchmarks: Benchmark[] }) {
  if (benchmarks.length === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-lg p-6 text-center text-text-muted text-sm">
        No benchmark data available.
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-text-primary">Benchmarks</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-text-muted text-xs">
            <th className="text-left px-4 py-2 font-medium">Benchmark</th>
            <th className="text-right px-4 py-2 font-medium">Score</th>
            <th className="text-right px-4 py-2 font-medium">Max</th>
            <th className="text-right px-4 py-2 font-medium">%</th>
          </tr>
        </thead>
        <tbody>
          {benchmarks.map((b) => {
            const pct = (b.score / b.max_score) * 100;
            return (
              <tr
                key={b.benchmark_name}
                className="border-b border-border/50 hover:bg-bg-tertiary transition-colors"
              >
                <td className="px-4 py-2 text-text-secondary">
                  {b.benchmark_name}
                </td>
                <td className="px-4 py-2 text-right font-mono-nums text-text-primary">
                  {b.score.toFixed(1)}
                </td>
                <td className="px-4 py-2 text-right font-mono-nums text-text-muted">
                  {b.max_score}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          backgroundColor:
                            pct >= 80
                              ? "#06D6A0"
                              : pct >= 60
                              ? "#48BFE3"
                              : "#8E95A3",
                        }}
                      />
                    </div>
                    <span className="font-mono-nums text-xs text-text-secondary w-10 text-right">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
