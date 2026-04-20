import { getDb } from "../db";
import { getSearchTerms, matchesAny } from "./search-aliases";

const SUBREDDITS = [
  // AI general
  "LocalLLaMA",
  "MachineLearning",
  "artificial",
  "ArtificialIntelligence",
  "singularity",
  "deeplearning",
  // Provider-specific
  "ChatGPT",
  "OpenAI",
  "ClaudeAI",
  "AnthropicAI",
  "Bard",
  "ollama",
  // Image/video gen
  "StableDiffusion",
  "midjourney",
  "comfyui",
  // Code tools
  "cursor",
  "CodingWithAI",
  // General tech
  "programming",
  "technology",
];

interface RedditPost {
  data: {
    title: string;
    selftext: string;
    url: string;
    score: number;
    num_comments: number;
    permalink: string;
  };
}

export async function fetchRedditStats(): Promise<number> {
  const db = getDb();

  const entries = db
    .prepare("SELECT id, name, slug, provider FROM entries")
    .all() as { id: number; name: string; slug: string; provider: string }[];

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
  const allPosts: {
    title: string;
    selftext: string;
    url: string;
    score: number;
    num_comments: number;
    permalink: string;
  }[] = [];

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
          selftext: post.data.selftext || "",
          url: post.data.url,
          score: post.data.score,
          num_comments: post.data.num_comments,
          permalink: post.data.permalink,
        });
      }

      await new Promise((r) => setTimeout(r, 2000)); // Reddit rate limits
    } catch (err) {
      console.error(`Reddit fetch failed for r/${sub}:`, err);
    }
  }

  // Match posts to entries using fuzzy search aliases
  for (const entry of entries) {
    const searchTerms = getSearchTerms(entry.name, entry.slug, entry.provider);

    // Match against title AND selftext for better coverage
    const matching = allPosts.filter((p) =>
      matchesAny(p.title + " " + p.selftext, searchTerms)
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
      top.permalink ? `https://reddit.com${top.permalink}` : top.url,
      top.title
    );
    updated++;
  }

  return updated;
}
