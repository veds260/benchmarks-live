import { getDb } from "../db";

const SUBREDDITS = ["LocalLLaMA", "MachineLearning", "artificial", "StableDiffusion"];

interface RedditPost {
  data: {
    title: string;
    url: string;
    score: number;
    num_comments: number;
  };
}

export async function fetchRedditStats(): Promise<number> {
  const db = getDb();

  const entries = db
    .prepare("SELECT id, name, slug FROM entries")
    .all() as { id: number; name: string; slug: string }[];

  const today = new Date().toISOString().split("T")[0];
  let updated = 0;

  const upsert = db.prepare(`
    INSERT INTO social_mentions (entry_id, date, source, mention_count, total_points, total_comments, top_url, top_title)
    VALUES (?, ?, 'reddit', ?, ?, ?, ?, ?)
    ON CONFLICT(entry_id, date, source) DO UPDATE SET
      mention_count = excluded.mention_count,
      total_points = excluded.total_points,
      total_comments = excluded.total_comments,
      top_url = excluded.top_url,
      top_title = excluded.top_title
  `);

  // Fetch recent posts from each subreddit
  const allPosts: { title: string; url: string; score: number; num_comments: number }[] = [];

  for (const sub of SUBREDDITS) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/new.json?limit=100`,
        { headers: { "User-Agent": "benchmarks-live/1.0" } }
      );
      if (!res.ok) continue;

      const data = await res.json();
      const posts: RedditPost[] = data.data?.children || [];

      for (const post of posts) {
        allPosts.push({
          title: post.data.title,
          url: post.data.url,
          score: post.data.score,
          num_comments: post.data.num_comments,
        });
      }

      await new Promise((r) => setTimeout(r, 2000)); // Reddit rate limits
    } catch (err) {
      console.error(`Reddit fetch failed for r/${sub}:`, err);
    }
  }

  // Match posts to entries by name
  for (const entry of entries) {
    const nameLower = entry.name.toLowerCase();
    const matching = allPosts.filter((p) =>
      p.title.toLowerCase().includes(nameLower)
    );

    if (matching.length === 0) continue;

    const totalPoints = matching.reduce((sum, p) => sum + p.score, 0);
    const totalComments = matching.reduce((sum, p) => sum + p.num_comments, 0);

    const top = matching.reduce((best, p) =>
      p.score > best.score ? p : best
    );

    upsert.run(
      entry.id,
      today,
      matching.length,
      totalPoints,
      totalComments,
      top.url,
      top.title
    );
    updated++;
  }

  return updated;
}
