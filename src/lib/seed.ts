import Database from "better-sqlite3";
import { ENTRIES } from "./constants";

type BenchmarkSeed = { slug: string; benchmarks: { name: string; score: number; max: number }[] };

function getBaseScore(slug: string, category: string): number {
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
  const catDefaults: Record<string, number> = {
    llm: 60, image: 58, video: 55, audio: 52,
    code: 62, search: 56, agents: 55, infra: 58, embeddings: 54,
  };
  return (catDefaults[category] || 50) + Math.random() * 20;
}

function getBenchmarkSeeds(): BenchmarkSeed[] {
  return [
    { slug: "claude-opus-4", benchmarks: [{ name: "MMLU Pro", score: 74.3, max: 100 }, { name: "GPQA Diamond", score: 67.5, max: 100 }, { name: "SWE-bench Verified", score: 72.0, max: 100 }, { name: "HumanEval", score: 95.2, max: 100 }, { name: "MATH-500", score: 81.4, max: 100 }, { name: "LM Arena ELO", score: 1410, max: 1500 }] },
    { slug: "claude-sonnet-4", benchmarks: [{ name: "MMLU Pro", score: 72.8, max: 100 }, { name: "GPQA Diamond", score: 65.2, max: 100 }, { name: "SWE-bench Verified", score: 72.7, max: 100 }, { name: "HumanEval", score: 93.8, max: 100 }, { name: "MATH-500", score: 80.6, max: 100 }, { name: "LM Arena ELO", score: 1390, max: 1500 }] },
    { slug: "gpt-5", benchmarks: [{ name: "MMLU Pro", score: 78.4, max: 100 }, { name: "GPQA Diamond", score: 72.8, max: 100 }, { name: "SWE-bench Verified", score: 58.6, max: 100 }, { name: "HumanEval", score: 95.8, max: 100 }, { name: "MATH-500", score: 86.2, max: 100 }, { name: "LM Arena ELO", score: 1400, max: 1500 }] },
    { slug: "o3", benchmarks: [{ name: "MMLU Pro", score: 79.1, max: 100 }, { name: "GPQA Diamond", score: 87.7, max: 100 }, { name: "SWE-bench Verified", score: 71.7, max: 100 }, { name: "HumanEval", score: 97.1, max: 100 }, { name: "MATH-500", score: 96.7, max: 100 }, { name: "LM Arena ELO", score: 1415, max: 1500 }] },
    { slug: "deepseek-r1", benchmarks: [{ name: "MMLU Pro", score: 79.8, max: 100 }, { name: "GPQA Diamond", score: 71.5, max: 100 }, { name: "SWE-bench Verified", score: 49.2, max: 100 }, { name: "HumanEval", score: 92.6, max: 100 }, { name: "MATH-500", score: 97.3, max: 100 }, { name: "LM Arena ELO", score: 1380, max: 1500 }] },
    { slug: "gemini-25-pro", benchmarks: [{ name: "MMLU Pro", score: 75.8, max: 100 }, { name: "GPQA Diamond", score: 63.8, max: 100 }, { name: "SWE-bench Verified", score: 63.2, max: 100 }, { name: "HumanEval", score: 92.4, max: 100 }, { name: "MATH-500", score: 83.1, max: 100 }, { name: "LM Arena ELO", score: 1405, max: 1500 }] },
    { slug: "grok-3", benchmarks: [{ name: "MMLU Pro", score: 74.2, max: 100 }, { name: "GPQA Diamond", score: 61.8, max: 100 }, { name: "SWE-bench Verified", score: 48.9, max: 100 }, { name: "HumanEval", score: 91.4, max: 100 }, { name: "MATH-500", score: 82.6, max: 100 }, { name: "LM Arena ELO", score: 1385, max: 1500 }] },
    { slug: "gpt-4o", benchmarks: [{ name: "MMLU Pro", score: 72.6, max: 100 }, { name: "GPQA Diamond", score: 53.6, max: 100 }, { name: "SWE-bench Verified", score: 38.4, max: 100 }, { name: "HumanEval", score: 90.2, max: 100 }, { name: "MATH-500", score: 76.6, max: 100 }, { name: "LM Arena ELO", score: 1340, max: 1500 }] },
    { slug: "o4-mini", benchmarks: [{ name: "MMLU Pro", score: 78.2, max: 100 }, { name: "GPQA Diamond", score: 81.4, max: 100 }, { name: "SWE-bench Verified", score: 68.1, max: 100 }, { name: "HumanEval", score: 96.3, max: 100 }, { name: "MATH-500", score: 94.2, max: 100 }, { name: "LM Arena ELO", score: 1395, max: 1500 }] },
    { slug: "deepseek-v3", benchmarks: [{ name: "MMLU Pro", score: 75.9, max: 100 }, { name: "GPQA Diamond", score: 59.1, max: 100 }, { name: "SWE-bench Verified", score: 42.0, max: 100 }, { name: "HumanEval", score: 88.4, max: 100 }, { name: "MATH-500", score: 90.2, max: 100 }, { name: "LM Arena ELO", score: 1350, max: 1500 }] },
    { slug: "qwen-3-235b", benchmarks: [{ name: "MMLU Pro", score: 76.8, max: 100 }, { name: "GPQA Diamond", score: 62.4, max: 100 }, { name: "SWE-bench Verified", score: 46.8, max: 100 }, { name: "HumanEval", score: 90.2, max: 100 }, { name: "MATH-500", score: 89.1, max: 100 }, { name: "LM Arena ELO", score: 1370, max: 1500 }] },
    { slug: "llama-4-maverick", benchmarks: [{ name: "MMLU Pro", score: 73.4, max: 100 }, { name: "GPQA Diamond", score: 55.2, max: 100 }, { name: "HumanEval", score: 86.8, max: 100 }, { name: "MATH-500", score: 74.1, max: 100 }, { name: "LM Arena ELO", score: 1355, max: 1500 }] },
    { slug: "gemini-25-flash", benchmarks: [{ name: "MMLU Pro", score: 70.4, max: 100 }, { name: "GPQA Diamond", score: 59.1, max: 100 }, { name: "HumanEval", score: 89.6, max: 100 }, { name: "MATH-500", score: 78.8, max: 100 }, { name: "LM Arena ELO", score: 1360, max: 1500 }] },
    { slug: "cursor", benchmarks: [{ name: "SWE-bench (Agent)", score: 64.2, max: 100 }, { name: "User Satisfaction", score: 92, max: 100 }] },
    { slug: "claude-code", benchmarks: [{ name: "SWE-bench (Agent)", score: 72.7, max: 100 }, { name: "User Satisfaction", score: 90, max: 100 }] },
    { slug: "github-copilot", benchmarks: [{ name: "SWE-bench (Agent)", score: 45.8, max: 100 }, { name: "User Satisfaction", score: 83, max: 100 }] },
    { slug: "aider", benchmarks: [{ name: "SWE-bench (Agent)", score: 53.6, max: 100 }, { name: "User Satisfaction", score: 86, max: 100 }] },
    { slug: "groq", benchmarks: [{ name: "Throughput Score", score: 96, max: 100 }] },
    { slug: "midjourney", benchmarks: [{ name: "Image Arena ELO", score: 1280, max: 1500 }, { name: "Prompt Adherence", score: 82, max: 100 }] },
    { slug: "flux-1-dev", benchmarks: [{ name: "Image Arena ELO", score: 1245, max: 1500 }, { name: "Prompt Adherence", score: 80, max: 100 }] },
    { slug: "elevenlabs", benchmarks: [{ name: "TTS Quality (MOS)", score: 4.6, max: 5.0 }] },
    { slug: "whisper", benchmarks: [{ name: "WER (LibriSpeech)", score: 96.8, max: 100 }] },
    { slug: "veo-3", benchmarks: [{ name: "Video Quality", score: 82, max: 100 }] },
    { slug: "perplexity", benchmarks: [{ name: "User Satisfaction", score: 88, max: 100 }] },
    { slug: "ollama", benchmarks: [{ name: "Ease of Use", score: 92, max: 100 }] },
    { slug: "vllm", benchmarks: [{ name: "Throughput Score", score: 88, max: 100 }] },
  ];
}

/** Auto-seeds entries, benchmarks, and score history if the DB is empty. */
export function autoSeedIfEmpty(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM entries").get() as { c: number };
  if (count.c > 0) return;

  console.log("[auto-seed] Empty database detected, seeding entries...");

  // Insert entries
  const insertEntry = db.prepare(`
    INSERT OR IGNORE INTO entries (slug, name, category, provider, website_url, github_repo, huggingface_id, pypi_package, npm_package, pricing_type, pricing_note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTx = db.transaction(() => {
    for (const e of ENTRIES) {
      insertEntry.run(
        e.slug, e.name, e.category, e.provider,
        e.website_url, e.github_repo, e.huggingface_id,
        e.pypi_package, e.npm_package, e.pricing_type, e.pricing_note
      );
    }
  });
  insertTx();

  // Seed benchmarks
  const benchmarkSeeds = getBenchmarkSeeds();
  const insertBenchmark = db.prepare(`
    INSERT OR IGNORE INTO benchmarks (entry_id, benchmark_name, score, max_score, unit)
    VALUES (?, ?, ?, ?, 'score')
  `);
  const getEntryId = db.prepare("SELECT id FROM entries WHERE slug = ?");

  const benchTx = db.transaction(() => {
    for (const seed of benchmarkSeeds) {
      const entry = getEntryId.get(seed.slug) as { id: number } | undefined;
      if (!entry) continue;
      for (const b of seed.benchmarks) {
        insertBenchmark.run(entry.id, b.name, b.score, b.max);
      }
    }
  });
  benchTx();

  // Generate 14 days of score history
  const today = new Date();
  const allEntries = db.prepare("SELECT id, slug, category FROM entries").all() as { id: number; slug: string; category: string }[];

  const insertHistory = db.prepare(`
    INSERT OR IGNORE INTO score_history (entry_id, date, score_composite, score_quality, score_popularity, score_sentiment, score_community, score_activity)
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

      const latestDate = today.toISOString().split("T")[0];
      const latestHist = db.prepare(
        "SELECT * FROM score_history WHERE entry_id = ? AND date = ?"
      ).get(es.id, latestDate) as {
        score_quality: number; score_popularity: number;
        score_sentiment: number; score_community: number; score_activity: number;
      } | undefined;

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

  const final = db.prepare("SELECT COUNT(*) as c FROM entries").get() as { c: number };
  console.log(`[auto-seed] Done: ${final.c} entries seeded with benchmarks and 14-day history`);
}
