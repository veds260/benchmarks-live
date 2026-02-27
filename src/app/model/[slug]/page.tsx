"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EntryDetail } from "@/lib/types";
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/detail/hero-section";
import { MetricsCards } from "@/components/detail/metrics-cards";
import { HistoryChart } from "@/components/detail/history-chart";
import { BenchmarkTable } from "@/components/detail/benchmark-table";
import { SocialBuzz } from "@/components/detail/social-buzz";
import { RelatedEntries } from "@/components/detail/related-entries";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";

export default function ModelDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [entry, setEntry] = useState<EntryDetail | null>(null);
  const [error, setError] = useState(false);

  const fetchEntry = () => {
    setError(false);
    trackEvent("model_view", { slug }, `/model/${slug}`);
    fetch(`/api/entries/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setEntry)
      .catch(() => setError(true));
  };

  useEffect(() => {
    fetchEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Navbar maxWidth="max-w-5xl" />
        <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Not Found
            </h1>
            <p className="text-text-secondary mb-4">
              No entry found for &quot;{slug}&quot;
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={fetchEntry}
                className="px-4 py-2 bg-accent/15 text-accent border border-accent/30 rounded-lg text-sm font-medium hover:bg-accent/25 transition-colors"
              >
                Retry
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-bg-card text-text-secondary border border-border rounded-lg text-sm font-medium hover:text-text-primary transition-colors"
              >
                Back to rankings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Navbar maxWidth="max-w-5xl" />
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4 animate-pulse">
          <div className="h-36 bg-bg-card rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-bg-card rounded-lg" />
            ))}
          </div>
          <div className="h-72 bg-bg-card rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar maxWidth="max-w-5xl" />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <HeroSection entry={entry} />
        <MetricsCards entry={entry} />
        <HistoryChart history={entry.score_history} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BenchmarkTable benchmarks={entry.benchmarks} />
          <div className="space-y-6">
            <SocialBuzz mentions={entry.social_mentions} />
            <RelatedEntries entries={entry.related} />
          </div>
        </div>
      </main>
    </div>
  );
}
