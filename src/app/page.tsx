import { GlobalStatsBar } from "@/components/global-stats-bar";
import { RankingTable } from "@/components/ranking-table";
import { RecommendBar } from "@/components/recommend-bar";
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

      {/* Recommend */}
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <div className="bg-bg-card border border-border rounded-xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-sm font-semibold text-text-primary">
              Find the right model for your use case
            </h2>
          </div>
          <RecommendBar />
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
