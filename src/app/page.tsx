import { GlobalStatsBar } from "@/components/global-stats-bar";
import { RankingTable } from "@/components/ranking-table";
import { Navbar } from "@/components/navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ height: "180px" }}>
        <div className="relative z-10 max-w-7xl mx-auto px-4 flex flex-col justify-center h-full">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
            AI Ecosystem Tracker
          </h1>
          <p className="text-text-secondary text-sm mb-3 max-w-xl">
            Real-time rankings of AI models, tools, and infrastructure scored by
            quality benchmarks, developer adoption, social momentum, and
            community activity.
          </p>
          <GlobalStatsBar />
        </div>
      </section>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <RankingTable />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-text-muted">
          Data sourced from GitHub, HuggingFace, PyPI, npm, Hacker News, and
          Reddit. Updated daily.
        </div>
      </footer>
    </div>
  );
}
