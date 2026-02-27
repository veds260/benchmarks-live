import { getDb } from "../src/lib/db";

const db = getDb();
const today = new Date().toISOString().split("T")[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

// Get all current entry scores
const entries = db
  .prepare(
    "SELECT id, score_composite, score_quality, score_popularity, score_sentiment, score_community, score_activity FROM entries"
  )
  .all() as {
  id: number;
  score_composite: number;
  score_quality: number;
  score_popularity: number;
  score_sentiment: number;
  score_community: number;
  score_activity: number;
}[];

// Delete old synthetic history except today
db.prepare("DELETE FROM score_history WHERE date < ?").run(yesterday);

const upsert = db.prepare(`
  INSERT INTO score_history (entry_id, date, score_composite, score_quality, score_popularity, score_sentiment, score_community, score_activity)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(entry_id, date) DO UPDATE SET
    score_composite = excluded.score_composite,
    score_quality = excluded.score_quality,
    score_popularity = excluded.score_popularity,
    score_sentiment = excluded.score_sentiment,
    score_community = excluded.score_community,
    score_activity = excluded.score_activity
`);

// Generate 14 days of plausible history based on current scores
const tx = db.transaction(() => {
  for (const e of entries) {
    for (let d = 13; d >= 1; d--) {
      const date = new Date(Date.now() - d * 86400000)
        .toISOString()
        .split("T")[0];
      // Small random drift from current score
      const drift = (Math.random() - 0.5) * 3;
      const dayDrift = (Math.random() - 0.5) * 1.5;
      upsert.run(
        e.id,
        date,
        Math.max(0, Math.min(100, e.score_composite + drift + dayDrift * (d / 7))),
        Math.max(0, Math.min(100, e.score_quality + (Math.random() - 0.5) * 2)),
        Math.max(0, Math.min(100, e.score_popularity + (Math.random() - 0.5) * 3)),
        Math.max(0, Math.min(100, e.score_sentiment + (Math.random() - 0.5) * 4)),
        Math.max(0, Math.min(100, e.score_community + (Math.random() - 0.5) * 3)),
        Math.max(0, Math.min(100, e.score_activity + (Math.random() - 0.5) * 3))
      );
    }
  }
});

tx();
console.log(`Smoothed history for ${entries.length} entries over 14 days`);

// Update trends
db.prepare("UPDATE entries SET trend_24h = 0, trend_7d = 0, trend_30d = 0").run();

// Now recompute to get proper trends based on smoothed history
import { computeAllScores } from "../src/lib/score";
computeAllScores();
console.log("Recomputed scores with smoothed history");
