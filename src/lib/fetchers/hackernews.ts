import { getDb } from "../db";
import { getSearchTerms, matchesAny } from "./search-aliases";

const HN_API = "https://hn.algolia.com/api/v1";

interface HNHit {
  objectID: string;
  title: string;
  url: string;
  points: number;
  num_comments: number;
}

export async function fetchHackerNewsStats(): Promise<number> {
  const db = getDb();

  const entries = db
    .prepare("SELECT id, name, slug, provider FROM entries")
    .all() as { id: number; name: string; slug: string; provider: string }[];

  const today = new Date().toISOString().split("T")[0];
  let updated = 0;

  const upsert = db.prepare(`
    INSERT INTO social_mentions (entry_id, date, source, mention_count, total_points, total_comments, top_url, top_title)
    VALUES (?, ?, 'hackernews', ?, ?, ?, ?, ?)
    ON CONFLICT(entry_id, date, source) DO UPDATE SET
      mention_count = excluded.mention_count,
      total_points = excluded.total_points,
      total_comments = excluded.total_comments,
      top_url = excluded.top_url,
      top_title = excluded.top_title
  `);

  // Search last 7 days instead of 24 hours
  const timestamp = Math.floor(Date.now() / 1000) - 7 * 86400;

  for (const entry of entries) {
    try {
      const searchTerms = getSearchTerms(entry.name, entry.slug, entry.provider);

      // Search with the entry name first
      const query = encodeURIComponent(entry.name);
      const res = await fetch(
        `${HN_API}/search?query=${query}&tags=story&numericFilters=created_at_i>${timestamp}&hitsPerPage=50`
      );
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }

      const data = await res.json();
      let hits: HNHit[] = data.hits || [];

      // If no results with full name, try slug-based search
      if (hits.length === 0) {
        const slugQuery = entry.slug.replace(/-/g, " ");
        if (slugQuery !== entry.name.toLowerCase()) {
          const res2 = await fetch(
            `${HN_API}/search?query=${encodeURIComponent(slugQuery)}&tags=story&numericFilters=created_at_i>${timestamp}&hitsPerPage=50`
          );
          if (res2.ok) {
            const data2 = await res2.json();
            hits = data2.hits || [];
          }
        }
      }

      // Filter hits to only those that actually mention this entry
      const filtered = hits.filter((h) =>
        matchesAny(h.title, searchTerms)
      );

      if (filtered.length === 0) {
        await new Promise((r) => setTimeout(r, 200));
        continue;
      }

      const totalPoints = filtered.reduce((sum, h) => sum + (h.points || 0), 0);
      const totalComments = filtered.reduce((sum, h) => sum + (h.num_comments || 0), 0);

      // Top hit by points
      const top = filtered.reduce((best, h) =>
        (h.points || 0) > (best.points || 0) ? h : best
      );

      upsert.run(
        entry.id,
        today,
        filtered.length,
        totalPoints,
        totalComments,
        top.url || `https://news.ycombinator.com/item?id=${top.objectID}`,
        top.title
      );
      updated++;

      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`HN fetch failed for ${entry.name}:`, err);
    }
  }

  return updated;
}
