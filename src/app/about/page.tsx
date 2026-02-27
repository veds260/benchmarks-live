import { Navbar } from "@/components/navbar";

export const metadata = {
  title: "About & Methodology",
  description: "How the AI Cap Score is calculated. Learn about our methodology, data sources, and scoring weights.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar maxWidth="max-w-3xl" />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-text-primary mb-6">
          Methodology
        </h1>

        <div className="space-y-8 text-sm text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              What is the AI Cap Score?
            </h2>
            <p>
              The AI Cap Score is a composite metric (0-100) that ranks AI
              models, tools, and infrastructure by combining quality benchmarks,
              developer adoption, social momentum, community health, and
              development activity into a single comparable number.
            </p>
            <p className="mt-2">
              Think of it like a market cap for AI tools, but instead of
              dollars, it measures real usage and impact signals.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              Score Components
            </h2>
            <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="text-left px-4 py-2 font-medium">Signal</th>
                    <th className="text-right px-4 py-2 font-medium">Weight</th>
                    <th className="text-left px-4 py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="px-4 py-2 text-text-primary">Quality (Benchmarks)</td>
                    <td className="px-4 py-2 text-right font-mono-nums text-accent">30%</td>
                    <td className="px-4 py-2 text-text-muted">LM Arena, MMLU, SWE-bench, MTEB</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="px-4 py-2 text-text-primary">Developer Adoption</td>
                    <td className="px-4 py-2 text-right font-mono-nums text-accent">25%</td>
                    <td className="px-4 py-2 text-text-muted">GitHub stars, PyPI/npm/HF downloads</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="px-4 py-2 text-text-primary">Social Momentum</td>
                    <td className="px-4 py-2 text-right font-mono-nums text-accent">20%</td>
                    <td className="px-4 py-2 text-text-muted">Hacker News, Reddit mentions</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="px-4 py-2 text-text-primary">Community Health</td>
                    <td className="px-4 py-2 text-right font-mono-nums text-accent">15%</td>
                    <td className="px-4 py-2 text-text-muted">Contributors, forks, HF likes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-text-primary">Development Activity</td>
                    <td className="px-4 py-2 text-right font-mono-nums text-accent">10%</td>
                    <td className="px-4 py-2 text-text-muted">Recent commits, release recency</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-text-muted">
              For proprietary models without GitHub repos (GPT-5, Gemini, etc.), weights are
              adjusted: Quality 45%, Social 30%, Adoption 25%.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              Normalization
            </h2>
            <p>
              All signals are normalized within their category using
              log-scaling. This means a model is ranked against peers in the
              same category (LLMs vs LLMs, Code Tools vs Code Tools), not
              against unrelated tools. A score of 85 in the LLM category means
              that model is in the top tier for LLMs specifically.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              Data Sources
            </h2>
            <p>All data comes from free, public APIs:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>GitHub REST API (stars, forks, contributors, commits)</li>
              <li>HuggingFace Hub API (model downloads, likes)</li>
              <li>PyPI Stats API (Python package downloads)</li>
              <li>npm Downloads API (JavaScript package downloads)</li>
              <li>Hacker News Algolia API (story points, comments)</li>
              <li>Reddit JSON API (upvotes, comments)</li>
              <li>Manual curation for benchmark scores and pricing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              Update Frequency
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>GitHub, HuggingFace, PyPI, npm: Daily</li>
              <li>Hacker News, Reddit: Every 6 hours</li>
              <li>Benchmark scores: Weekly (manually curated)</li>
              <li>Score computation: After each data refresh</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">
              Categories
            </h2>
            <p>
              We track 9 categories across the AI ecosystem: LLMs, Image Gen,
              Video Gen, Audio/TTS, Code Tools, Search/RAG, Agents/Frameworks,
              Infrastructure, and Embeddings. Each category has its own
              normalized scoring, so an 80 in Code Tools reflects the same
              relative standing as an 80 in LLMs.
            </p>
          </section>

          <section className="border-t border-border pt-6">
            <p className="text-text-muted">
              Built with Next.js, SQLite, and free public APIs. Inspired by
              Balaji&apos;s call for an &quot;AI Market Cap&quot; tracker.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
