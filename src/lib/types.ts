export type Category =
  | "llm"
  | "image"
  | "video"
  | "audio"
  | "code"
  | "search"
  | "agents"
  | "infra"
  | "embeddings";

export const CATEGORY_LABELS: Record<Category, string> = {
  llm: "LLMs",
  image: "Image Gen",
  video: "Video Gen",
  audio: "Audio/TTS",
  code: "Code Tools",
  search: "Search/RAG",
  agents: "Agents",
  infra: "Infrastructure",
  embeddings: "Embeddings",
};

export interface Entry {
  id: number;
  slug: string;
  name: string;
  category: Category;
  provider: string;
  logo_url: string | null;
  website_url: string | null;
  github_repo: string | null;
  huggingface_id: string | null;
  pypi_package: string | null;
  npm_package: string | null;
  pricing_type: "free" | "freemium" | "paid" | "open-source";
  pricing_note: string | null;
  score_composite: number;
  score_quality: number;
  score_popularity: number;
  score_sentiment: number;
  score_community: number;
  score_activity: number;
  trend_24h: number;
  trend_7d: number;
  trend_30d: number;
  rank: number;
  rank_prev: number;
  updated_at: string;
}

export interface EntryRow {
  id: number;
  slug: string;
  name: string;
  category: Category;
  provider: string;
  logo_url: string | null;
  pricing_type: string;
  score_composite: number;
  score_quality: number;
  score_popularity: number;
  trend_24h: number;
  trend_7d: number;
  trend_30d: number;
  rank: number;
  rank_prev: number;
  github_stars: number | null;
  monthly_downloads: number | null;
  sparkline: number[];
}

export interface ScoreHistory {
  date: string;
  score_composite: number;
  score_quality: number;
  score_popularity: number;
  score_sentiment: number;
  score_community: number;
  score_activity: number;
}

export interface GlobalStats {
  total_entries: number;
  trending_category: string;
  top_gainer: { name: string; slug: string; trend_24h: number } | null;
  top_loser: { name: string; slug: string; trend_24h: number } | null;
  avg_score: number;
}

export interface EntriesResponse {
  entries: EntryRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EntryDetail extends Entry {
  github_stars: number | null;
  github_forks: number | null;
  github_contributors: number | null;
  github_commits_30d: number | null;
  github_last_commit: string | null;
  hf_downloads_30d: number | null;
  hf_likes: number | null;
  pypi_downloads_month: number | null;
  npm_downloads_month: number | null;
  benchmarks: Benchmark[];
  social_mentions: SocialMention[];
  score_history: ScoreHistory[];
  related: RelatedEntry[];
}

export interface Benchmark {
  benchmark_name: string;
  score: number;
  max_score: number;
  unit: string;
  source_url: string | null;
  measured_at: string;
}

export interface SocialMention {
  date: string;
  source: "hackernews" | "reddit" | "twitter";
  mention_count: number;
  total_points: number;
  total_comments: number;
  top_url: string | null;
  top_title: string | null;
}

export interface RelatedEntry {
  slug: string;
  name: string;
  category: Category;
  score_composite: number;
  provider: string;
}

export interface TrendingEntry {
  slug: string;
  name: string;
  category: Category;
  provider: string;
  score_composite: number;
  trend_24h: number;
  trend_7d: number;
  rank: number;
  rank_prev: number;
}

export interface CompareEntry {
  entry: Entry;
  github_stars: number | null;
  monthly_downloads: number | null;
  benchmarks: Benchmark[];
  score_history: ScoreHistory[];
}
