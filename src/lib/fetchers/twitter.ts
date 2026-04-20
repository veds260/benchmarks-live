import { getDb } from "../db";
import { getSearchTerms, matchesAny } from "./search-aliases";

// Nitter instances to try (in order of reliability)
const NITTER_INSTANCES = [
  "nitter.privacydev.net",
  "nitter.poast.org",
  "nitter.woodland.cafe",
  "nitter.net",
];

interface NitterResult {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

/**
 * Parse Nitter RSS XML to extract tweet data.
 * Nitter RSS format has <item> elements with <title>, <link>, <description>, <pubDate>.
 */
function parseNitterRss(xml: string): NitterResult[] {
  const results: NitterResult[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const description = extractTag(itemXml, "description");
    const pubDate = extractTag(itemXml, "pubDate");

    if (title && link) {
      results.push({ title, link, description: description || "", pubDate: pubDate || "" });
    }
  }

  return results;
}

function extractTag(xml: string, tag: string): string {
  // Handle CDATA sections
  const cdataRegex = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`);
  const cdataMatch = cdataRegex.exec(xml);
  if (cdataMatch) return cdataMatch[1].trim();

  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
  const match = regex.exec(xml);
  return match ? match[1].trim() : "";
}

/**
 * Try to fetch search results from Nitter RSS.
 * Returns parsed results or null if instance is down.
 */
async function searchNitter(query: string, instance: string): Promise<NitterResult[] | null> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://${instance}/search/rss?f=tweets&q=${encodedQuery}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "benchmarks-live/1.0",
        "Accept": "application/rss+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const text = await res.text();
    if (!text.includes("<rss") && !text.includes("<channel>")) return null;

    return parseNitterRss(text);
  } catch {
    return null;
  }
}

/**
 * Try all Nitter instances in order until one works.
 */
async function searchWithFallback(query: string): Promise<NitterResult[]> {
  for (const instance of NITTER_INSTANCES) {
    const results = await searchNitter(query, instance);
    if (results !== null) return results;
  }
  return [];
}

/**
 * Extract engagement numbers from Nitter RSS description HTML.
 * Nitter descriptions often contain the tweet text but not structured engagement data.
 * We estimate engagement from the presence of results (each result = 1 mention).
 */
function estimateEngagement(results: NitterResult[]): { points: number; comments: number } {
  // Each tweet found is a mention. We don't have like/RT counts from RSS.
  // Use count as a proxy for social signal strength.
  return {
    points: results.length * 5, // rough weighting
    comments: results.length,
  };
}

/**
 * Convert Nitter link back to x.com URL.
 * Nitter links look like: https://nitter.net/username/status/123456
 */
function toXUrl(nitterLink: string): string {
  try {
    const url = new URL(nitterLink);
    return `https://x.com${url.pathname}`;
  } catch {
    return nitterLink.replace(/https?:\/\/[^/]+/, "https://x.com");
  }
}

export async function fetchTwitterStats(): Promise<number> {
  const db = getDb();

  const entries = db
    .prepare("SELECT id, name, slug, provider FROM entries")
    .all() as { id: number; name: string; slug: string; provider: string }[];

  const today = new Date().toISOString().split("T")[0];
  let updated = 0;

  const upsert = db.prepare(`
    INSERT INTO social_mentions (entry_id, date, source, mention_count, total_points, total_comments, top_url, top_title)
    VALUES (?, ?, 'twitter', ?, ?, ?, ?, ?)
    ON CONFLICT(entry_id, date, source) DO UPDATE SET
      mention_count = excluded.mention_count,
      total_points = excluded.total_points,
      total_comments = excluded.total_comments,
      top_url = excluded.top_url,
      top_title = excluded.top_title
  `);

  // Process entries in batches to avoid hammering Nitter
  for (const entry of entries) {
    try {
      const searchTerms = getSearchTerms(entry.name, entry.slug, entry.provider);
      // Use the primary name as the search query (most specific)
      const query = entry.name;

      const results = await searchWithFallback(query);

      if (results.length === 0) {
        // If no results with full name, try slug-based search
        const slugQuery = entry.slug.replace(/-/g, " ");
        if (slugQuery !== query.toLowerCase()) {
          const slugResults = await searchWithFallback(slugQuery);
          if (slugResults.length > 0) {
            // Filter to only matching results
            const filtered = slugResults.filter((r) =>
              matchesAny(r.title + " " + r.description, searchTerms)
            );
            if (filtered.length > 0) {
              const engagement = estimateEngagement(filtered);
              const top = filtered[0];
              upsert.run(
                entry.id,
                today,
                filtered.length,
                engagement.points,
                engagement.comments,
                toXUrl(top.link),
                top.title.slice(0, 200)
              );
              updated++;
            }
          }
        }
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }

      // Filter results to ensure they actually mention the entry
      const filtered = results.filter((r) =>
        matchesAny(r.title + " " + r.description, searchTerms)
      );

      if (filtered.length === 0) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }

      const engagement = estimateEngagement(filtered);
      const top = filtered[0];

      upsert.run(
        entry.id,
        today,
        filtered.length,
        engagement.points,
        engagement.comments,
        toXUrl(top.link),
        top.title.slice(0, 200)
      );
      updated++;

      // Rate limit: 1.5s between entries to be nice to Nitter
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`Twitter fetch failed for ${entry.name}:`, err);
    }
  }

  return updated;
}
