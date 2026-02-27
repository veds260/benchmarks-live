import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";

interface ParsedIntent {
  categories: string[];
  pricing_preference: "cheap" | "mid" | "any";
  prefer_open_source: boolean;
  keywords: string[];
  use_case: string;
}

interface DbEntry {
  slug: string;
  name: string;
  category: string;
  provider: string;
  pricing_type: string;
  pricing_note: string | null;
  score_composite: number;
  score_quality: number;
  score_popularity: number;
  rank: number;
}

interface DbBenchmark {
  benchmark_name: string;
  score: number;
  max_score: number;
}

const SYSTEM_PROMPT = `You are a model recommendation engine. Given a user's description of their product or use case, extract structured intent as JSON.

Categories: llm, image, video, audio, code, search, agents, infra, embeddings

Return ONLY valid JSON (no markdown, no backticks):
{
  "categories": ["llm"],
  "pricing_preference": "cheap",
  "prefer_open_source": false,
  "keywords": ["coding", "fast"],
  "use_case": "one sentence summary of what they need"
}

Rules:
- categories: which types of AI tools they need (can be multiple)
- pricing_preference: "cheap" if they mention budget/cost, "mid" for balanced, "any" if not mentioned
- prefer_open_source: true if they mention self-hosting, privacy, open-source, local
- keywords: specific features mentioned (e.g. "128k context", "fast inference", "multilingual", "coding", "reasoning")
- use_case: brief summary of their actual need`;

async function parseWithLLM(query: string): Promise<ParsedIntent> {
  const models = [
    "google/gemini-2.0-flash-lite-001",
    "openai/gpt-4o-mini",
  ];

  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: query },
          ],
          temperature: 0,
          max_tokens: 200,
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim() || "";
      // Strip markdown fences if present
      const clean = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      return JSON.parse(clean) as ParsedIntent;
    } catch {
      continue;
    }
  }

  // Fallback: simple keyword-based parsing
  return fallbackParse(query);
}

function fallbackParse(query: string): ParsedIntent {
  const q = query.toLowerCase();
  const categories: string[] = [];

  if (q.match(/\b(llm|language model|chatbot|chat|text gen|reasoning)\b/)) categories.push("llm");
  if (q.match(/\b(image|picture|photo|art|illustration|generate image)\b/)) categories.push("image");
  if (q.match(/\b(video|animate|clip|footage)\b/)) categories.push("video");
  if (q.match(/\b(audio|voice|tts|speech|music|sound|transcri)\b/)) categories.push("audio");
  if (q.match(/\b(code|coding|developer|ide|copilot|programming|debug)\b/)) categories.push("code");
  if (q.match(/\b(search|rag|retrieval|find information)\b/)) categories.push("search");
  if (q.match(/\b(agent|automat|workflow|orchestrat|framework)\b/)) categories.push("agents");
  if (q.match(/\b(infra|deploy|serv|host|inference|self.host|local)\b/)) categories.push("infra");
  if (q.match(/\b(embed|vector|semantic|similarity)\b/)) categories.push("embeddings");

  if (categories.length === 0) categories.push("llm");

  return {
    categories,
    pricing_preference: q.match(/\b(cheap|budget|affordable|free|low.cost|save)\b/) ? "cheap" : "any",
    prefer_open_source: !!q.match(/\b(open.source|self.host|local|privacy|on.prem)\b/),
    keywords: [],
    use_case: query,
  };
}

function scorePriceCheapness(note: string | null, ptype: string): number {
  if (ptype === "free" || ptype === "open-source") return 100;
  if (!note) return 50;
  // Extract first dollar amount
  const match = note.match(/\$(\d+(?:\.\d+)?)/);
  if (!match) return 50;
  const price = parseFloat(match[1]);
  // Lower price = higher score (log scale)
  if (price <= 0.1) return 95;
  if (price <= 0.5) return 85;
  if (price <= 1) return 75;
  if (price <= 3) return 60;
  if (price <= 10) return 40;
  return 20;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.length < 3) {
      return NextResponse.json({ error: "Query too short" }, { status: 400 });
    }

    const intent = OPENROUTER_KEY ? await parseWithLLM(query) : fallbackParse(query);
    const db = getDb();

    // Fetch candidates from matching categories
    const placeholders = intent.categories.map(() => "?").join(",");
    const candidates = db
      .prepare(
        `SELECT slug, name, category, provider, pricing_type, pricing_note,
                score_composite, score_quality, score_popularity, rank
         FROM entries
         WHERE category IN (${placeholders})
         ORDER BY score_composite DESC`
      )
      .all(...intent.categories) as DbEntry[];

    // Score each candidate
    const scored = candidates.map((c) => {
      let score = 0;

      // Base quality (0-40 points)
      score += (c.score_quality / 100) * 40;

      // Popularity signal (0-15 points)
      score += (c.score_popularity / 100) * 15;

      // Price match (0-25 points)
      const cheapness = scorePriceCheapness(c.pricing_note, c.pricing_type);
      if (intent.pricing_preference === "cheap") {
        score += (cheapness / 100) * 25;
      } else if (intent.pricing_preference === "mid") {
        // Prefer mid-range (not cheapest, not most expensive)
        const midScore = 100 - Math.abs(cheapness - 60) * 2;
        score += (Math.max(0, midScore) / 100) * 25;
      } else {
        score += 12.5; // neutral
      }

      // Open source bonus (0-10 points)
      if (intent.prefer_open_source) {
        score += (c.pricing_type === "open-source" || c.pricing_type === "free") ? 10 : 0;
      } else {
        score += 5; // neutral
      }

      // Keyword match bonus (0-10 points)
      const nameAndNote = `${c.name} ${c.provider} ${c.pricing_note || ""}`.toLowerCase();
      const keywordMatches = intent.keywords.filter((k) =>
        nameAndNote.includes(k.toLowerCase())
      ).length;
      score += Math.min(10, keywordMatches * 3);

      return { ...c, matchScore: Math.round(score * 10) / 10 };
    });

    // Sort by match score
    scored.sort((a, b) => b.matchScore - a.matchScore);

    // Get benchmarks for top results
    const benchStmt = db.prepare(
      "SELECT benchmark_name, score, max_score FROM benchmarks WHERE entry_id = (SELECT id FROM entries WHERE slug = ?)"
    );

    const buildResult = (entry: typeof scored[0]) => {
      const benchmarks = benchStmt.all(entry.slug) as DbBenchmark[];
      return {
        slug: entry.slug,
        name: entry.name,
        category: entry.category,
        provider: entry.provider,
        pricing_type: entry.pricing_type,
        pricing_note: entry.pricing_note,
        score_quality: entry.score_quality,
        score_composite: entry.score_composite,
        rank: entry.rank,
        matchScore: entry.matchScore,
        benchmarks: benchmarks.slice(0, 3),
      };
    };

    // Best quality: highest quality score
    const byQuality = [...scored].sort((a, b) => b.score_quality - a.score_quality);

    // Best value: highest cheapness * quality ratio
    const byValue = [...scored].sort((a, b) => {
      const aValue = scorePriceCheapness(a.pricing_note, a.pricing_type) * (a.score_quality / 100);
      const bValue = scorePriceCheapness(b.pricing_note, b.pricing_type) * (b.score_quality / 100);
      return bValue - aValue;
    });

    // Balanced: the matchScore ranking
    const balanced = scored;

    return NextResponse.json({
      intent: {
        categories: intent.categories,
        pricing_preference: intent.pricing_preference,
        prefer_open_source: intent.prefer_open_source,
        use_case: intent.use_case,
      },
      recommendations: {
        best_quality: byQuality.slice(0, 3).map(buildResult),
        best_value: byValue.slice(0, 3).map(buildResult),
        balanced: balanced.slice(0, 3).map(buildResult),
      },
      total_considered: candidates.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
