import Database from "better-sqlite3";
import path from "path";
import { autoSeedIfEmpty } from "./seed";

const DB_PATH = path.join(process.cwd(), "data", "benchmarks.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
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

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id TEXT NOT NULL,
      email TEXT,
      event_type TEXT NOT NULL,
      event_data TEXT DEFAULT '{}',
      path TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_visitor ON analytics_events(visitor_id);
  `);

  autoSeedIfEmpty(_db);

  return _db;
}
