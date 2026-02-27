import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { ENTRIES } from "../src/lib/constants";

const DB_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DB_DIR, "benchmarks.db");

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Delete existing DB to start fresh
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    provider TEXT NOT NULL,
    logo_url TEXT,
    website_url TEXT,
    github_repo TEXT,
    huggingface_id TEXT,
    pypi_package TEXT,
    npm_package TEXT,
    pricing_type TEXT DEFAULT 'free',
    pricing_note TEXT,
    score_composite REAL DEFAULT 0,
    score_quality REAL DEFAULT 0,
    score_popularity REAL DEFAULT 0,
    score_sentiment REAL DEFAULT 0,
    score_community REAL DEFAULT 0,
    score_activity REAL DEFAULT 0,
    trend_24h REAL DEFAULT 0,
    trend_7d REAL DEFAULT 0,
    trend_30d REAL DEFAULT 0,
    rank INTEGER DEFAULT 0,
    rank_prev INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS score_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES entries(id),
    date TEXT NOT NULL,
    score_composite REAL DEFAULT 0,
    score_quality REAL DEFAULT 0,
    score_popularity REAL DEFAULT 0,
    score_sentiment REAL DEFAULT 0,
    score_community REAL DEFAULT 0,
    score_activity REAL DEFAULT 0,
    UNIQUE(entry_id, date)
  );

  CREATE TABLE IF NOT EXISTS github_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES entries(id),
    date TEXT NOT NULL,
    stars INTEGER DEFAULT 0,
    forks INTEGER DEFAULT 0,
    open_issues INTEGER DEFAULT 0,
    contributors INTEGER DEFAULT 0,
    commits_30d INTEGER DEFAULT 0,
    last_commit_at TEXT,
    UNIQUE(entry_id, date)
  );

  CREATE TABLE IF NOT EXISTS download_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES entries(id),
    date TEXT NOT NULL,
    source TEXT NOT NULL,
    downloads_day INTEGER DEFAULT 0,
    downloads_week INTEGER DEFAULT 0,
    downloads_month INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    UNIQUE(entry_id, date, source)
  );

  CREATE TABLE IF NOT EXISTS benchmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES entries(id),
    benchmark_name TEXT NOT NULL,
    score REAL NOT NULL,
    max_score REAL DEFAULT 100,
    unit TEXT DEFAULT 'score',
    source_url TEXT,
    measured_at TEXT DEFAULT (datetime('now')),
    UNIQUE(entry_id, benchmark_name)
  );

  CREATE TABLE IF NOT EXISTS social_mentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES entries(id),
    date TEXT NOT NULL,
    source TEXT NOT NULL,
    mention_count INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    top_url TEXT,
    top_title TEXT,
    UNIQUE(entry_id, date, source)
  );

  CREATE TABLE IF NOT EXISTS fetch_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    started_at TEXT DEFAULT (datetime('now')),
    finished_at TEXT,
    status TEXT DEFAULT 'running',
    entries_updated INTEGER DEFAULT 0,
    error TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category);
  CREATE INDEX IF NOT EXISTS idx_entries_rank ON entries(rank);
  CREATE INDEX IF NOT EXISTS idx_entries_score ON entries(score_composite DESC);
  CREATE INDEX IF NOT EXISTS idx_score_history_entry_date ON score_history(entry_id, date);
  CREATE INDEX IF NOT EXISTS idx_github_stats_entry_date ON github_stats(entry_id, date);
  CREATE INDEX IF NOT EXISTS idx_download_stats_entry_date ON download_stats(entry_id, date, source);
  CREATE INDEX IF NOT EXISTS idx_social_mentions_entry_date ON social_mentions(entry_id, date, source);
`);

console.log(`Created database at ${DB_PATH}`);

// Insert entries
const insertEntry = db.prepare(`
  INSERT INTO entries (slug, name, category, provider, logo_url, website_url, github_repo, huggingface_id, pypi_package, npm_package, pricing_type, pricing_note)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertTx = db.transaction(() => {
  for (const e of ENTRIES) {
    insertEntry.run(
      e.slug, e.name, e.category, e.provider,
      null, e.website_url, e.github_repo, e.huggingface_id,
      e.pypi_package, e.npm_package, e.pricing_type, e.pricing_note
    );
  }
});

insertTx();
console.log(`Inserted ${ENTRIES.length} entries`);

// Seed benchmark data for LLMs
type BenchmarkSeed = { slug: string; benchmarks: { name: string; score: number; max: number }[] };

const llmBenchmarks: BenchmarkSeed[] = [
  // === Frontier Models ===
  { slug: "claude-opus-4", benchmarks: [
    { name: "MMLU Pro", score: 74.3, max: 100 },
    { name: "GPQA Diamond", score: 67.5, max: 100 },
    { name: "SWE-bench Verified", score: 72.0, max: 100 },
    { name: "HumanEval", score: 95.2, max: 100 },
    { name: "MATH-500", score: 81.4, max: 100 },
    { name: "LM Arena ELO", score: 1410, max: 1500 },
  ]},
  { slug: "claude-sonnet-4", benchmarks: [
    { name: "MMLU Pro", score: 72.8, max: 100 },
    { name: "GPQA Diamond", score: 65.2, max: 100 },
    { name: "SWE-bench Verified", score: 72.7, max: 100 },
    { name: "HumanEval", score: 93.8, max: 100 },
    { name: "MATH-500", score: 80.6, max: 100 },
    { name: "LM Arena ELO", score: 1390, max: 1500 },
  ]},
  { slug: "claude-haiku-35", benchmarks: [
    { name: "MMLU Pro", score: 65.0, max: 100 },
    { name: "GPQA Diamond", score: 41.6, max: 100 },
    { name: "SWE-bench Verified", score: 40.6, max: 100 },
    { name: "HumanEval", score: 88.1, max: 100 },
    { name: "MATH-500", score: 69.4, max: 100 },
    { name: "LM Arena ELO", score: 1270, max: 1500 },
  ]},
  { slug: "gpt-4o", benchmarks: [
    { name: "MMLU Pro", score: 72.6, max: 100 },
    { name: "GPQA Diamond", score: 53.6, max: 100 },
    { name: "SWE-bench Verified", score: 38.4, max: 100 },
    { name: "HumanEval", score: 90.2, max: 100 },
    { name: "MATH-500", score: 76.6, max: 100 },
    { name: "LM Arena ELO", score: 1340, max: 1500 },
  ]},
  { slug: "gpt-4o-mini", benchmarks: [
    { name: "MMLU Pro", score: 63.1, max: 100 },
    { name: "GPQA Diamond", score: 39.2, max: 100 },
    { name: "SWE-bench Verified", score: 23.8, max: 100 },
    { name: "HumanEval", score: 87.2, max: 100 },
    { name: "MATH-500", score: 70.2, max: 100 },
    { name: "LM Arena ELO", score: 1260, max: 1500 },
  ]},
  { slug: "gpt-5", benchmarks: [
    { name: "MMLU Pro", score: 78.4, max: 100 },
    { name: "GPQA Diamond", score: 72.8, max: 100 },
    { name: "SWE-bench Verified", score: 58.6, max: 100 },
    { name: "HumanEval", score: 95.8, max: 100 },
    { name: "MATH-500", score: 86.2, max: 100 },
    { name: "LM Arena ELO", score: 1400, max: 1500 },
  ]},
  { slug: "o3", benchmarks: [
    { name: "MMLU Pro", score: 79.1, max: 100 },
    { name: "GPQA Diamond", score: 87.7, max: 100 },
    { name: "SWE-bench Verified", score: 71.7, max: 100 },
    { name: "HumanEval", score: 97.1, max: 100 },
    { name: "MATH-500", score: 96.7, max: 100 },
    { name: "LM Arena ELO", score: 1415, max: 1500 },
  ]},
  { slug: "o4-mini", benchmarks: [
    { name: "MMLU Pro", score: 78.2, max: 100 },
    { name: "GPQA Diamond", score: 81.4, max: 100 },
    { name: "SWE-bench Verified", score: 68.1, max: 100 },
    { name: "HumanEval", score: 96.3, max: 100 },
    { name: "MATH-500", score: 94.2, max: 100 },
    { name: "LM Arena ELO", score: 1395, max: 1500 },
  ]},
  { slug: "gemini-25-pro", benchmarks: [
    { name: "MMLU Pro", score: 75.8, max: 100 },
    { name: "GPQA Diamond", score: 63.8, max: 100 },
    { name: "SWE-bench Verified", score: 63.2, max: 100 },
    { name: "HumanEval", score: 92.4, max: 100 },
    { name: "MATH-500", score: 83.1, max: 100 },
    { name: "LM Arena ELO", score: 1405, max: 1500 },
  ]},
  { slug: "gemini-25-flash", benchmarks: [
    { name: "MMLU Pro", score: 70.4, max: 100 },
    { name: "GPQA Diamond", score: 59.1, max: 100 },
    { name: "SWE-bench Verified", score: 49.2, max: 100 },
    { name: "HumanEval", score: 89.6, max: 100 },
    { name: "MATH-500", score: 78.8, max: 100 },
    { name: "LM Arena ELO", score: 1360, max: 1500 },
  ]},
  { slug: "gemini-20-flash-lite", benchmarks: [
    { name: "MMLU Pro", score: 58.6, max: 100 },
    { name: "GPQA Diamond", score: 34.2, max: 100 },
    { name: "HumanEval", score: 82.1, max: 100 },
    { name: "MATH-500", score: 62.4, max: 100 },
    { name: "LM Arena ELO", score: 1210, max: 1500 },
  ]},
  // === Open Source Models ===
  { slug: "deepseek-v3", benchmarks: [
    { name: "MMLU Pro", score: 75.9, max: 100 },
    { name: "GPQA Diamond", score: 59.1, max: 100 },
    { name: "SWE-bench Verified", score: 42.0, max: 100 },
    { name: "HumanEval", score: 88.4, max: 100 },
    { name: "MATH-500", score: 90.2, max: 100 },
    { name: "LM Arena ELO", score: 1350, max: 1500 },
  ]},
  { slug: "deepseek-r1", benchmarks: [
    { name: "MMLU Pro", score: 79.8, max: 100 },
    { name: "GPQA Diamond", score: 71.5, max: 100 },
    { name: "SWE-bench Verified", score: 49.2, max: 100 },
    { name: "HumanEval", score: 92.6, max: 100 },
    { name: "MATH-500", score: 97.3, max: 100 },
    { name: "LM Arena ELO", score: 1380, max: 1500 },
  ]},
  { slug: "llama-4-maverick", benchmarks: [
    { name: "MMLU Pro", score: 73.4, max: 100 },
    { name: "GPQA Diamond", score: 55.2, max: 100 },
    { name: "SWE-bench Verified", score: 38.6, max: 100 },
    { name: "HumanEval", score: 86.8, max: 100 },
    { name: "MATH-500", score: 74.1, max: 100 },
    { name: "LM Arena ELO", score: 1355, max: 1500 },
  ]},
  { slug: "llama-4-scout", benchmarks: [
    { name: "MMLU Pro", score: 70.2, max: 100 },
    { name: "GPQA Diamond", score: 49.8, max: 100 },
    { name: "HumanEval", score: 83.4, max: 100 },
    { name: "MATH-500", score: 68.7, max: 100 },
    { name: "LM Arena ELO", score: 1310, max: 1500 },
  ]},
  { slug: "llama-33-70b", benchmarks: [
    { name: "MMLU Pro", score: 66.2, max: 100 },
    { name: "GPQA Diamond", score: 46.7, max: 100 },
    { name: "HumanEval", score: 84.2, max: 100 },
    { name: "MATH-500", score: 71.9, max: 100 },
    { name: "LM Arena ELO", score: 1290, max: 1500 },
  ]},
  { slug: "qwen-3-235b", benchmarks: [
    { name: "MMLU Pro", score: 76.8, max: 100 },
    { name: "GPQA Diamond", score: 62.4, max: 100 },
    { name: "SWE-bench Verified", score: 46.8, max: 100 },
    { name: "HumanEval", score: 90.2, max: 100 },
    { name: "MATH-500", score: 89.1, max: 100 },
    { name: "LM Arena ELO", score: 1370, max: 1500 },
  ]},
  { slug: "qwen-3-32b", benchmarks: [
    { name: "MMLU Pro", score: 71.2, max: 100 },
    { name: "GPQA Diamond", score: 54.3, max: 100 },
    { name: "HumanEval", score: 86.5, max: 100 },
    { name: "MATH-500", score: 81.8, max: 100 },
    { name: "LM Arena ELO", score: 1325, max: 1500 },
  ]},
  { slug: "qwen-25-coder-32b", benchmarks: [
    { name: "SWE-bench Verified", score: 45.2, max: 100 },
    { name: "HumanEval", score: 92.7, max: 100 },
    { name: "MATH-500", score: 76.4, max: 100 },
    { name: "LM Arena ELO", score: 1300, max: 1500 },
  ]},
  { slug: "mistral-large", benchmarks: [
    { name: "MMLU Pro", score: 69.4, max: 100 },
    { name: "GPQA Diamond", score: 45.1, max: 100 },
    { name: "SWE-bench Verified", score: 28.2, max: 100 },
    { name: "HumanEval", score: 86.4, max: 100 },
    { name: "MATH-500", score: 69.2, max: 100 },
    { name: "LM Arena ELO", score: 1295, max: 1500 },
  ]},
  { slug: "mistral-small", benchmarks: [
    { name: "MMLU Pro", score: 62.8, max: 100 },
    { name: "GPQA Diamond", score: 38.4, max: 100 },
    { name: "HumanEval", score: 82.6, max: 100 },
    { name: "MATH-500", score: 64.1, max: 100 },
    { name: "LM Arena ELO", score: 1240, max: 1500 },
  ]},
  { slug: "codestral", benchmarks: [
    { name: "SWE-bench Verified", score: 32.8, max: 100 },
    { name: "HumanEval", score: 90.4, max: 100 },
    { name: "MATH-500", score: 67.2, max: 100 },
    { name: "LM Arena ELO", score: 1265, max: 1500 },
  ]},
  { slug: "grok-3", benchmarks: [
    { name: "MMLU Pro", score: 74.2, max: 100 },
    { name: "GPQA Diamond", score: 61.8, max: 100 },
    { name: "SWE-bench Verified", score: 48.9, max: 100 },
    { name: "HumanEval", score: 91.4, max: 100 },
    { name: "MATH-500", score: 82.6, max: 100 },
    { name: "LM Arena ELO", score: 1385, max: 1500 },
  ]},
  { slug: "grok-3-mini", benchmarks: [
    { name: "MMLU Pro", score: 66.8, max: 100 },
    { name: "GPQA Diamond", score: 52.4, max: 100 },
    { name: "HumanEval", score: 87.2, max: 100 },
    { name: "MATH-500", score: 78.1, max: 100 },
    { name: "LM Arena ELO", score: 1320, max: 1500 },
  ]},
  { slug: "phi-4", benchmarks: [
    { name: "MMLU Pro", score: 58.4, max: 100 },
    { name: "GPQA Diamond", score: 36.8, max: 100 },
    { name: "HumanEval", score: 82.6, max: 100 },
    { name: "MATH-500", score: 72.1, max: 100 },
    { name: "LM Arena ELO", score: 1210, max: 1500 },
  ]},
  { slug: "gemma-3-27b", benchmarks: [
    { name: "MMLU Pro", score: 63.2, max: 100 },
    { name: "GPQA Diamond", score: 42.4, max: 100 },
    { name: "HumanEval", score: 84.8, max: 100 },
    { name: "MATH-500", score: 68.4, max: 100 },
    { name: "LM Arena ELO", score: 1265, max: 1500 },
  ]},
  { slug: "command-r-plus", benchmarks: [
    { name: "MMLU Pro", score: 61.4, max: 100 },
    { name: "GPQA Diamond", score: 38.2, max: 100 },
    { name: "HumanEval", score: 79.8, max: 100 },
    { name: "LM Arena ELO", score: 1240, max: 1500 },
  ]},
  { slug: "jamba-15-large", benchmarks: [
    { name: "MMLU Pro", score: 58.2, max: 100 },
    { name: "GPQA Diamond", score: 35.6, max: 100 },
    { name: "HumanEval", score: 76.4, max: 100 },
    { name: "LM Arena ELO", score: 1220, max: 1500 },
  ]},
  { slug: "nvidia-nemotron-70b", benchmarks: [
    { name: "MMLU Pro", score: 68.4, max: 100 },
    { name: "GPQA Diamond", score: 48.6, max: 100 },
    { name: "HumanEval", score: 85.2, max: 100 },
    { name: "MATH-500", score: 74.8, max: 100 },
    { name: "LM Arena ELO", score: 1305, max: 1500 },
  ]},
  { slug: "internlm-3", benchmarks: [
    { name: "MMLU Pro", score: 54.2, max: 100 },
    { name: "HumanEval", score: 76.8, max: 100 },
    { name: "MATH-500", score: 62.4, max: 100 },
  ]},
  { slug: "glm-4", benchmarks: [
    { name: "MMLU Pro", score: 56.8, max: 100 },
    { name: "HumanEval", score: 78.2, max: 100 },
    { name: "MATH-500", score: 64.8, max: 100 },
  ]},
  { slug: "wizardlm-2-8x22b", benchmarks: [
    { name: "MMLU Pro", score: 60.4, max: 100 },
    { name: "HumanEval", score: 80.6, max: 100 },
    { name: "LM Arena ELO", score: 1230, max: 1500 },
  ]},
  { slug: "nous-hermes-3", benchmarks: [
    { name: "MMLU Pro", score: 58.8, max: 100 },
    { name: "HumanEval", score: 78.4, max: 100 },
    { name: "LM Arena ELO", score: 1215, max: 1500 },
  ]},
  { slug: "yi-lightning", benchmarks: [
    { name: "MMLU Pro", score: 55.6, max: 100 },
    { name: "HumanEval", score: 74.8, max: 100 },
    { name: "MATH-500", score: 58.2, max: 100 },
  ]},
  { slug: "dbrx", benchmarks: [
    { name: "MMLU Pro", score: 57.4, max: 100 },
    { name: "HumanEval", score: 76.2, max: 100 },
    { name: "LM Arena ELO", score: 1195, max: 1500 },
  ]},
  { slug: "arctic", benchmarks: [
    { name: "MMLU Pro", score: 52.8, max: 100 },
    { name: "HumanEval", score: 72.4, max: 100 },
  ]},
  { slug: "llama-31-405b", benchmarks: [
    { name: "MMLU Pro", score: 73.3, max: 100 },
    { name: "GPQA Diamond", score: 51.1, max: 100 },
    { name: "HumanEval", score: 89.0, max: 100 },
    { name: "MATH-500", score: 73.8, max: 100 },
    { name: "LM Arena ELO", score: 1266, max: 1500 },
  ]},
  { slug: "llama-32-3b", benchmarks: [
    { name: "MMLU Pro", score: 43.6, max: 100 },
    { name: "HumanEval", score: 62.8, max: 100 },
    { name: "MATH-500", score: 48.0, max: 100 },
  ]},
  { slug: "mistral-nemo", benchmarks: [
    { name: "MMLU Pro", score: 55.6, max: 100 },
    { name: "HumanEval", score: 78.0, max: 100 },
    { name: "LM Arena ELO", score: 1198, max: 1500 },
  ]},
  { slug: "qwen-25-72b", benchmarks: [
    { name: "MMLU Pro", score: 71.1, max: 100 },
    { name: "GPQA Diamond", score: 49.0, max: 100 },
    { name: "HumanEval", score: 86.6, max: 100 },
    { name: "MATH-500", score: 83.1, max: 100 },
    { name: "LM Arena ELO", score: 1283, max: 1500 },
  ]},
  { slug: "gemma-2-27b", benchmarks: [
    { name: "MMLU Pro", score: 57.5, max: 100 },
    { name: "HumanEval", score: 74.4, max: 100 },
    { name: "LM Arena ELO", score: 1220, max: 1500 },
  ]},
];

// Seed code tool benchmarks
const codeToolBenchmarks: BenchmarkSeed[] = [
  { slug: "cursor", benchmarks: [
    { name: "SWE-bench (Agent)", score: 64.2, max: 100 },
    { name: "User Satisfaction", score: 92, max: 100 },
  ]},
  { slug: "claude-code", benchmarks: [
    { name: "SWE-bench (Agent)", score: 72.7, max: 100 },
    { name: "User Satisfaction", score: 90, max: 100 },
  ]},
  { slug: "github-copilot", benchmarks: [
    { name: "SWE-bench (Agent)", score: 45.8, max: 100 },
    { name: "User Satisfaction", score: 83, max: 100 },
  ]},
  { slug: "aider", benchmarks: [
    { name: "SWE-bench (Agent)", score: 53.6, max: 100 },
    { name: "User Satisfaction", score: 86, max: 100 },
  ]},
  { slug: "cline", benchmarks: [
    { name: "SWE-bench (Agent)", score: 48.2, max: 100 },
    { name: "User Satisfaction", score: 85, max: 100 },
  ]},
  { slug: "devin", benchmarks: [
    { name: "SWE-bench (Agent)", score: 55.1, max: 100 },
    { name: "User Satisfaction", score: 72, max: 100 },
  ]},
  { slug: "windsurf", benchmarks: [
    { name: "SWE-bench (Agent)", score: 52.4, max: 100 },
    { name: "User Satisfaction", score: 87, max: 100 },
  ]},
  { slug: "codex-cli", benchmarks: [
    { name: "SWE-bench (Agent)", score: 69.1, max: 100 },
    { name: "User Satisfaction", score: 81, max: 100 },
  ]},
  { slug: "bolt", benchmarks: [
    { name: "User Satisfaction", score: 78, max: 100 },
  ]},
  { slug: "lovable", benchmarks: [
    { name: "User Satisfaction", score: 76, max: 100 },
  ]},
  { slug: "v0", benchmarks: [
    { name: "User Satisfaction", score: 80, max: 100 },
  ]},
  { slug: "continue", benchmarks: [
    { name: "User Satisfaction", score: 74, max: 100 },
  ]},
  { slug: "tabby", benchmarks: [
    { name: "User Satisfaction", score: 72, max: 100 },
  ]},
  { slug: "supermaven", benchmarks: [
    { name: "User Satisfaction", score: 82, max: 100 },
  ]},
  { slug: "sourcegraph-cody", benchmarks: [
    { name: "User Satisfaction", score: 75, max: 100 },
  ]},
  { slug: "replit-agent", benchmarks: [
    { name: "User Satisfaction", score: 71, max: 100 },
  ]},
];

// Seed embedding benchmarks (MTEB)
const embeddingBenchmarks: BenchmarkSeed[] = [
  { slug: "openai-embeddings", benchmarks: [
    { name: "MTEB Average", score: 64.6, max: 100 },
    { name: "MTEB Retrieval", score: 58.4, max: 100 },
  ]},
  { slug: "gemini-embedding", benchmarks: [
    { name: "MTEB Average", score: 66.2, max: 100 },
    { name: "MTEB Retrieval", score: 62.8, max: 100 },
  ]},
  { slug: "cohere-embed", benchmarks: [
    { name: "MTEB Average", score: 65.8, max: 100 },
    { name: "MTEB Retrieval", score: 60.4, max: 100 },
  ]},
  { slug: "voyage-3", benchmarks: [
    { name: "MTEB Average", score: 67.1, max: 100 },
    { name: "MTEB Retrieval", score: 63.2, max: 100 },
  ]},
  { slug: "jina-embeddings-v3", benchmarks: [
    { name: "MTEB Average", score: 65.4, max: 100 },
    { name: "MTEB Retrieval", score: 59.8, max: 100 },
  ]},
  { slug: "bge-m3", benchmarks: [
    { name: "MTEB Average", score: 68.3, max: 100 },
    { name: "MTEB Retrieval", score: 64.6, max: 100 },
  ]},
  { slug: "gte-qwen2", benchmarks: [
    { name: "MTEB Average", score: 70.2, max: 100 },
    { name: "MTEB Retrieval", score: 66.8, max: 100 },
  ]},
  { slug: "nomic-embed", benchmarks: [
    { name: "MTEB Average", score: 62.1, max: 100 },
    { name: "MTEB Retrieval", score: 55.6, max: 100 },
  ]},
  { slug: "e5-mistral", benchmarks: [
    { name: "MTEB Average", score: 66.8, max: 100 },
    { name: "MTEB Retrieval", score: 62.2, max: 100 },
  ]},
  { slug: "mixedbread-embed", benchmarks: [
    { name: "MTEB Average", score: 64.2, max: 100 },
    { name: "MTEB Retrieval", score: 58.8, max: 100 },
  ]},
];

// Seed image generation benchmarks (human eval / ELO-based)
const imageGenBenchmarks: BenchmarkSeed[] = [
  { slug: "midjourney", benchmarks: [
    { name: "Image Arena ELO", score: 1280, max: 1500 },
    { name: "Prompt Adherence", score: 82, max: 100 },
  ]},
  { slug: "dall-e-3", benchmarks: [
    { name: "Image Arena ELO", score: 1190, max: 1500 },
    { name: "Prompt Adherence", score: 78, max: 100 },
  ]},
  { slug: "flux-1-dev", benchmarks: [
    { name: "Image Arena ELO", score: 1245, max: 1500 },
    { name: "Prompt Adherence", score: 80, max: 100 },
  ]},
  { slug: "flux-1-schnell", benchmarks: [
    { name: "Image Arena ELO", score: 1180, max: 1500 },
    { name: "Prompt Adherence", score: 74, max: 100 },
  ]},
  { slug: "stable-diffusion-3", benchmarks: [
    { name: "Image Arena ELO", score: 1140, max: 1500 },
    { name: "Prompt Adherence", score: 72, max: 100 },
  ]},
  { slug: "ideogram-2", benchmarks: [
    { name: "Image Arena ELO", score: 1260, max: 1500 },
    { name: "Prompt Adherence", score: 86, max: 100 },
  ]},
  { slug: "imagen-3", benchmarks: [
    { name: "Image Arena ELO", score: 1220, max: 1500 },
    { name: "Prompt Adherence", score: 81, max: 100 },
  ]},
  { slug: "recraft-v3", benchmarks: [
    { name: "Image Arena ELO", score: 1270, max: 1500 },
    { name: "Prompt Adherence", score: 84, max: 100 },
  ]},
  { slug: "leonardo-ai", benchmarks: [
    { name: "Image Arena ELO", score: 1150, max: 1500 },
    { name: "Prompt Adherence", score: 70, max: 100 },
  ]},
  { slug: "adobe-firefly", benchmarks: [
    { name: "Image Arena ELO", score: 1120, max: 1500 },
    { name: "Prompt Adherence", score: 68, max: 100 },
  ]},
  { slug: "playground-v3", benchmarks: [
    { name: "Image Arena ELO", score: 1130, max: 1500 },
    { name: "Prompt Adherence", score: 72, max: 100 },
  ]},
];

// Video generation benchmarks
const videoGenBenchmarks: BenchmarkSeed[] = [
  { slug: "sora", benchmarks: [{ name: "Video Quality", score: 74, max: 100 }]},
  { slug: "runway-gen4", benchmarks: [{ name: "Video Quality", score: 78, max: 100 }]},
  { slug: "veo-3", benchmarks: [{ name: "Video Quality", score: 82, max: 100 }]},
  { slug: "kling-ai", benchmarks: [{ name: "Video Quality", score: 76, max: 100 }]},
  { slug: "minimax-video", benchmarks: [{ name: "Video Quality", score: 72, max: 100 }]},
  { slug: "pika", benchmarks: [{ name: "Video Quality", score: 68, max: 100 }]},
  { slug: "luma-dream-machine", benchmarks: [{ name: "Video Quality", score: 70, max: 100 }]},
  { slug: "cogvideo", benchmarks: [{ name: "Video Quality", score: 62, max: 100 }]},
  { slug: "hunyuan-video", benchmarks: [{ name: "Video Quality", score: 66, max: 100 }]},
  { slug: "stable-video-diffusion", benchmarks: [{ name: "Video Quality", score: 58, max: 100 }]},
];

// Audio benchmarks
const audioBenchmarks: BenchmarkSeed[] = [
  { slug: "elevenlabs", benchmarks: [{ name: "TTS Quality (MOS)", score: 4.6, max: 5.0 }]},
  { slug: "openai-tts", benchmarks: [{ name: "TTS Quality (MOS)", score: 4.2, max: 5.0 }]},
  { slug: "whisper", benchmarks: [
    { name: "WER (LibriSpeech)", score: 96.8, max: 100 }, // 100 - WER, so lower WER = higher score
  ]},
  { slug: "bark", benchmarks: [{ name: "TTS Quality (MOS)", score: 3.6, max: 5.0 }]},
  { slug: "coqui-xtts", benchmarks: [{ name: "TTS Quality (MOS)", score: 3.8, max: 5.0 }]},
  { slug: "tortoise-tts", benchmarks: [{ name: "TTS Quality (MOS)", score: 4.1, max: 5.0 }]},
  { slug: "parler-tts", benchmarks: [{ name: "TTS Quality (MOS)", score: 3.5, max: 5.0 }]},
  { slug: "dia-tts", benchmarks: [{ name: "TTS Quality (MOS)", score: 4.3, max: 5.0 }]},
  { slug: "suno", benchmarks: [{ name: "Music Quality", score: 82, max: 100 }]},
  { slug: "udio", benchmarks: [{ name: "Music Quality", score: 78, max: 100 }]},
  { slug: "musicgen", benchmarks: [{ name: "Music Quality", score: 64, max: 100 }]},
  { slug: "stable-audio", benchmarks: [{ name: "Music Quality", score: 58, max: 100 }]},
];

// Infrastructure benchmarks (throughput tokens/sec)
const infraBenchmarks: BenchmarkSeed[] = [
  { slug: "vllm", benchmarks: [{ name: "Throughput Score", score: 88, max: 100 }]},
  { slug: "tgi", benchmarks: [{ name: "Throughput Score", score: 76, max: 100 }]},
  { slug: "llamacpp", benchmarks: [{ name: "Throughput Score", score: 72, max: 100 }]},
  { slug: "sglang", benchmarks: [{ name: "Throughput Score", score: 90, max: 100 }]},
  { slug: "tensorrt-llm", benchmarks: [{ name: "Throughput Score", score: 92, max: 100 }]},
  { slug: "mlx", benchmarks: [{ name: "Throughput Score", score: 68, max: 100 }]},
  { slug: "groq", benchmarks: [{ name: "Throughput Score", score: 96, max: 100 }]},
  { slug: "cerebras-inference", benchmarks: [{ name: "Throughput Score", score: 94, max: 100 }]},
  { slug: "ollama", benchmarks: [{ name: "Ease of Use", score: 92, max: 100 }]},
];

const allBenchmarkSeeds = [
  ...llmBenchmarks, ...codeToolBenchmarks, ...embeddingBenchmarks,
  ...imageGenBenchmarks, ...videoGenBenchmarks, ...audioBenchmarks, ...infraBenchmarks,
];

const insertBenchmark = db.prepare(`
  INSERT INTO benchmarks (entry_id, benchmark_name, score, max_score, unit, source_url)
  VALUES (?, ?, ?, ?, 'score', NULL)
`);

const getEntryId = db.prepare("SELECT id FROM entries WHERE slug = ?");

const benchTx = db.transaction(() => {
  for (const seed of allBenchmarkSeeds) {
    const entry = getEntryId.get(seed.slug) as { id: number } | undefined;
    if (!entry) continue;
    for (const b of seed.benchmarks) {
      insertBenchmark.run(entry.id, b.name, b.score, b.max);
    }
  }
});

benchTx();
console.log("Inserted benchmark data");

// Generate synthetic score history for sparklines (last 14 days)
const today = new Date();
const allEntries = db.prepare("SELECT id, slug, category FROM entries").all() as { id: number; slug: string; category: string }[];

// Generate realistic-ish initial composite scores based on benchmarks and name recognition
function getBaseScore(slug: string, category: string): number {
  // Top-tier models get higher scores
  const topTier: Record<string, number> = {
    "claude-opus-4": 94, "gpt-5": 91, "o3": 90, "gemini-25-pro": 89,
    "claude-sonnet-4": 87, "deepseek-r1": 85, "grok-3": 84,
    "cursor": 88, "claude-code": 86, "github-copilot": 80,
    "perplexity": 82, "langchain": 79, "vllm": 81, "ollama": 83,
    "midjourney": 87, "dall-e-3": 78, "elevenlabs": 80, "suno": 75,
    "runway-gen4": 76, "veo-3": 78, "sora": 74,
    "openai-embeddings": 72, "gemini-embedding": 75,
    "gpt-4o": 82, "deepseek-v3": 80, "qwen-3-235b": 78,
    "llama-4-maverick": 76, "o4-mini": 83, "gemini-25-flash": 79,
    "cline": 77, "aider": 76, "windsurf": 75, "devin": 73,
    "flux-1-dev": 79, "stable-diffusion-3": 72,
    "llamaindex": 74, "crewai": 71, "autogen": 70,
    "groq": 76, "together-ai": 68, "llamacpp": 77,
    "whisper": 82, "bge-m3": 70, "gte-qwen2": 71,
    "bolt": 72, "lovable": 70, "v0": 74, "replit-agent": 69,
    "mcp-protocol": 78, "browser-use": 73, "vercel-ai-sdk": 72,
  };
  if (topTier[slug]) return topTier[slug];
  // Category-based defaults
  const catDefaults: Record<string, number> = {
    llm: 60, image: 58, video: 55, audio: 52,
    code: 62, search: 56, agents: 55, infra: 58, embeddings: 54,
  };
  return (catDefaults[category] || 50) + Math.random() * 20;
}

const insertHistory = db.prepare(`
  INSERT INTO score_history (entry_id, date, score_composite, score_quality, score_popularity, score_sentiment, score_community, score_activity)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateEntryScores = db.prepare(`
  UPDATE entries SET
    score_composite = ?, score_quality = ?, score_popularity = ?,
    score_sentiment = ?, score_community = ?, score_activity = ?,
    trend_24h = ?, trend_7d = ?, trend_30d = ?,
    rank = ?, rank_prev = ?
  WHERE id = ?
`);

const historyTx = db.transaction(() => {
  const entryScores: { id: number; scores: number[] }[] = [];

  for (const entry of allEntries) {
    const baseScore = getBaseScore(entry.slug, entry.category);
    const scores: number[] = [];

    for (let d = 13; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split("T")[0];

      // Random walk with mean reversion
      const prevScore = scores.length > 0 ? scores[scores.length - 1] : baseScore;
      const drift = (baseScore - prevScore) * 0.1;
      const noise = (Math.random() - 0.5) * 4;
      const score = Math.max(10, Math.min(99, prevScore + drift + noise));
      scores.push(Math.round(score * 10) / 10);

      const quality = Math.max(0, Math.min(100, score + (Math.random() - 0.5) * 15));
      const popularity = Math.max(0, Math.min(100, score + (Math.random() - 0.5) * 20));
      const sentiment = Math.max(0, Math.min(100, score + (Math.random() - 0.5) * 25));
      const community = Math.max(0, Math.min(100, score + (Math.random() - 0.5) * 20));
      const activity = Math.max(0, Math.min(100, score + (Math.random() - 0.5) * 20));

      insertHistory.run(
        entry.id, dateStr,
        Math.round(score * 10) / 10,
        Math.round(quality * 10) / 10,
        Math.round(popularity * 10) / 10,
        Math.round(sentiment * 10) / 10,
        Math.round(community * 10) / 10,
        Math.round(activity * 10) / 10
      );
    }

    entryScores.push({ id: entry.id, scores });
  }

  // Sort by latest score and assign ranks
  entryScores.sort((a, b) => b.scores[b.scores.length - 1] - a.scores[a.scores.length - 1]);

  for (let i = 0; i < entryScores.length; i++) {
    const es = entryScores[i];
    const latest = es.scores[es.scores.length - 1];
    const prev = es.scores[es.scores.length - 2] || latest;
    const week = es.scores[Math.max(0, es.scores.length - 7)] || latest;
    const month = es.scores[0] || latest;

    const trend24h = prev > 0 ? ((latest - prev) / prev) * 100 : 0;
    const trend7d = week > 0 ? ((latest - week) / week) * 100 : 0;
    const trend30d = month > 0 ? ((latest - month) / month) * 100 : 0;

    // Get subscores from latest history
    const latestDate = new Date(today).toISOString().split("T")[0];
    const latestHist = db.prepare(
      "SELECT * FROM score_history WHERE entry_id = ? AND date = ?"
    ).get(es.id, latestDate) as {
      score_quality: number; score_popularity: number;
      score_sentiment: number; score_community: number; score_activity: number;
    };

    updateEntryScores.run(
      latest,
      latestHist?.score_quality || latest,
      latestHist?.score_popularity || latest,
      latestHist?.score_sentiment || latest,
      latestHist?.score_community || latest,
      latestHist?.score_activity || latest,
      Math.round(trend24h * 10) / 10,
      Math.round(trend7d * 10) / 10,
      Math.round(trend30d * 10) / 10,
      i + 1,
      Math.max(1, i + 1 + Math.floor((Math.random() - 0.5) * 6)),
      es.id
    );
  }
});

historyTx();
console.log("Generated 14 days of score history");

const count = db.prepare("SELECT COUNT(*) as c FROM entries").get() as { c: number };
console.log(`\nDone! ${count.c} entries seeded with benchmarks and history.`);

db.close();
