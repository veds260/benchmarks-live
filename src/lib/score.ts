import { getDb } from "./db";

interface RawSignals {
  entry_id: number;
  has_github: boolean;
  // Quality
  avg_benchmark_pct: number; // avg(score/max_score) across benchmarks
  // Popularity (downloads)
  github_stars: number;
  hf_downloads_month: number;
  pypi_downloads_month: number;
  npm_downloads_month: number;
  // Sentiment (social)
  hn_points_7d: number;
  hn_comments_7d: number;
  reddit_points_7d: number;
  reddit_comments_7d: number;
  // Community
  github_contributors: number;
  github_forks: number;
  hf_likes: number;
  // Activity
  github_commits_30d: number;
  days_since_last_commit: number;
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function logNormalize(value: number, values: number[]): number {
  const logged = values.map((v) => Math.log1p(v));
  const logVal = Math.log1p(value);
  const min = Math.min(...logged);
  const max = Math.max(...logged);
  return normalize(logVal, min, max);
}

export function computeAllScores(): void {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  // Gather raw signals for every entry
  const entries = db
    .prepare("SELECT id, github_repo, pypi_package, npm_package FROM entries")
    .all() as { id: number; github_repo: string | null; pypi_package: string | null; npm_package: string | null }[];

  // Count how many entries share each package so we can split downloads fairly
  const pypiSharers = new Map<string, number>();
  const npmSharers = new Map<string, number>();
  const ghSharers = new Map<string, number>();
  for (const e of entries) {
    if (e.pypi_package) pypiSharers.set(e.pypi_package, (pypiSharers.get(e.pypi_package) || 0) + 1);
    if (e.npm_package) npmSharers.set(e.npm_package, (npmSharers.get(e.npm_package) || 0) + 1);
    if (e.github_repo) ghSharers.set(e.github_repo, (ghSharers.get(e.github_repo) || 0) + 1);
  }

  const signals: RawSignals[] = entries.map((e) => {
    // Benchmarks
    const benchRow = db
      .prepare(
        "SELECT AVG(score * 1.0 / max_score) as avg_pct FROM benchmarks WHERE entry_id = ?"
      )
      .get(e.id) as { avg_pct: number | null };

    // GitHub latest
    const gh = db
      .prepare(
        "SELECT stars, forks, contributors, commits_30d, last_commit_at FROM github_stats WHERE entry_id = ? ORDER BY date DESC LIMIT 1"
      )
      .get(e.id) as {
      stars: number;
      forks: number;
      contributors: number;
      commits_30d: number;
      last_commit_at: string | null;
    } | undefined;

    // Downloads (latest per source) - split by number of entries sharing the package
    const hfDl = db
      .prepare(
        "SELECT downloads_month, likes FROM download_stats WHERE entry_id = ? AND source = 'huggingface' ORDER BY date DESC LIMIT 1"
      )
      .get(e.id) as { downloads_month: number; likes: number } | undefined;

    const pypiDl = db
      .prepare(
        "SELECT downloads_month FROM download_stats WHERE entry_id = ? AND source = 'pypi' ORDER BY date DESC LIMIT 1"
      )
      .get(e.id) as { downloads_month: number } | undefined;

    const npmDl = db
      .prepare(
        "SELECT downloads_month FROM download_stats WHERE entry_id = ? AND source = 'npm' ORDER BY date DESC LIMIT 1"
      )
      .get(e.id) as { downloads_month: number } | undefined;

    // Divide shared package downloads by number of sharers
    const pypiDivisor = e.pypi_package ? (pypiSharers.get(e.pypi_package) || 1) : 1;
    const npmDivisor = e.npm_package ? (npmSharers.get(e.npm_package) || 1) : 1;
    const ghDivisor = e.github_repo ? (ghSharers.get(e.github_repo) || 1) : 1;

    // Social last 7 days
    const social = db
      .prepare(
        `SELECT source,
          SUM(total_points) as pts,
          SUM(total_comments) as cmt
        FROM social_mentions
        WHERE entry_id = ? AND date >= date('now', '-7 days')
        GROUP BY source`
      )
      .all(e.id) as { source: string; pts: number; cmt: number }[];

    const hnRow = social.find((s) => s.source === "hackernews");
    const redditRow = social.find((s) => s.source === "reddit");

    let daysSinceCommit = 365;
    if (gh?.last_commit_at) {
      const diff =
        Date.now() - new Date(gh.last_commit_at).getTime();
      daysSinceCommit = Math.floor(diff / 86400000);
    }

    return {
      entry_id: e.id,
      has_github: !!e.github_repo,
      avg_benchmark_pct: benchRow?.avg_pct ?? 0,
      github_stars: Math.round((gh?.stars ?? 0) / ghDivisor),
      hf_downloads_month: hfDl?.downloads_month ?? 0,
      pypi_downloads_month: Math.round((pypiDl?.downloads_month ?? 0) / pypiDivisor),
      npm_downloads_month: Math.round((npmDl?.downloads_month ?? 0) / npmDivisor),
      hn_points_7d: hnRow?.pts ?? 0,
      hn_comments_7d: hnRow?.cmt ?? 0,
      reddit_points_7d: redditRow?.pts ?? 0,
      reddit_comments_7d: redditRow?.cmt ?? 0,
      github_contributors: Math.round((gh?.contributors ?? 0) / ghDivisor),
      github_forks: Math.round((gh?.forks ?? 0) / ghDivisor),
      hf_likes: hfDl?.likes ?? 0,
      github_commits_30d: Math.round((gh?.commits_30d ?? 0) / ghDivisor),
      days_since_last_commit: daysSinceCommit,
    };
  });

  // Compute category-wise normalized sub-scores
  const categoryMap = new Map<string, RawSignals[]>();
  const entryCategories = db
    .prepare("SELECT id, category FROM entries")
    .all() as { id: number; category: string }[];

  for (const ec of entryCategories) {
    const sig = signals.find((s) => s.entry_id === ec.id);
    if (!sig) continue;
    if (!categoryMap.has(ec.category)) categoryMap.set(ec.category, []);
    categoryMap.get(ec.category)!.push(sig);
  }

  const results: {
    entry_id: number;
    quality: number;
    popularity: number;
    sentiment: number;
    community: number;
    activity: number;
    composite: number;
  }[] = [];

  for (const [, catSignals] of categoryMap) {
    for (const sig of catSignals) {
      // Quality (0-100): benchmark percentage * 100
      const quality = sig.avg_benchmark_pct * 100;

      // Popularity: log-normalized combined downloads + stars
      const totalDownloads =
        sig.hf_downloads_month +
        sig.pypi_downloads_month +
        sig.npm_downloads_month;
      const popValues = catSignals.map(
        (s) =>
          s.hf_downloads_month +
          s.pypi_downloads_month +
          s.npm_downloads_month +
          s.github_stars * 10
      );
      const popularity = logNormalize(
        totalDownloads + sig.github_stars * 10,
        popValues
      );

      // Sentiment: social signals
      const socialScore =
        sig.hn_points_7d * 2 +
        sig.hn_comments_7d +
        sig.reddit_points_7d +
        sig.reddit_comments_7d;
      const sentValues = catSignals.map(
        (s) =>
          s.hn_points_7d * 2 +
          s.hn_comments_7d +
          s.reddit_points_7d +
          s.reddit_comments_7d
      );
      const sentiment = logNormalize(socialScore, sentValues);

      // Community: contributors + forks + likes
      const communityScore =
        sig.github_contributors * 5 +
        sig.github_forks +
        sig.hf_likes;
      const commValues = catSignals.map(
        (s) => s.github_contributors * 5 + s.github_forks + s.hf_likes
      );
      const community = logNormalize(communityScore, commValues);

      // Activity: commits + recency
      const recencyScore = Math.max(
        0,
        100 - sig.days_since_last_commit * 2
      );
      const commitScore = logNormalize(
        sig.github_commits_30d,
        catSignals.map((s) => s.github_commits_30d)
      );
      const activity = commitScore * 0.6 + recencyScore * 0.4;

      // Composite with weights depending on whether entry has github
      let composite: number;
      if (sig.has_github) {
        composite =
          quality * 0.3 +
          popularity * 0.25 +
          sentiment * 0.2 +
          community * 0.15 +
          activity * 0.1;
      } else {
        // Proprietary models without GitHub
        composite =
          quality * 0.45 + sentiment * 0.3 + popularity * 0.25;
      }

      results.push({
        entry_id: sig.entry_id,
        quality: Math.round(quality * 10) / 10,
        popularity: Math.round(popularity * 10) / 10,
        sentiment: Math.round(sentiment * 10) / 10,
        community: Math.round(community * 10) / 10,
        activity: Math.round(activity * 10) / 10,
        composite: Math.round(composite * 10) / 10,
      });
    }
  }

  // Re-normalize composites globally so categories are comparable
  // Without this, small categories (3 infra entries) can dominate large ones (40 LLMs)
  const allComposites = results.map((r) => r.composite);
  const globalMax = Math.max(...allComposites, 1);
  const globalMin = Math.min(...allComposites, 0);
  for (const r of results) {
    r.composite =
      globalMax === globalMin
        ? 50
        : Math.round(
            ((r.composite - globalMin) / (globalMax - globalMin)) * 100 * 10
          ) / 10;
  }

  // Sort by composite desc and assign ranks
  results.sort((a, b) => b.composite - a.composite);

  const updateEntry = db.prepare(`
    UPDATE entries SET
      score_composite = ?,
      score_quality = ?,
      score_popularity = ?,
      score_sentiment = ?,
      score_community = ?,
      score_activity = ?,
      rank_prev = rank,
      rank = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `);

  const upsertHistory = db.prepare(`
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

  const computeTrend = db.prepare(`
    SELECT score_composite FROM score_history
    WHERE entry_id = ? AND date = date('now', ? || ' days')
  `);

  const updateTx = db.transaction(() => {
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const rank = i + 1;

      updateEntry.run(
        r.composite,
        r.quality,
        r.popularity,
        r.sentiment,
        r.community,
        r.activity,
        rank,
        r.entry_id
      );

      upsertHistory.run(
        r.entry_id,
        today,
        r.composite,
        r.quality,
        r.popularity,
        r.sentiment,
        r.community,
        r.activity
      );

      // Compute trends
      const prev24h = computeTrend.get(r.entry_id, "-1") as {
        score_composite: number;
      } | undefined;
      const prev7d = computeTrend.get(r.entry_id, "-7") as {
        score_composite: number;
      } | undefined;
      const prev30d = computeTrend.get(r.entry_id, "-30") as {
        score_composite: number;
      } | undefined;

      const trend24h = prev24h
        ? ((r.composite - prev24h.score_composite) /
            Math.max(prev24h.score_composite, 1)) *
          100
        : 0;
      const trend7d = prev7d
        ? ((r.composite - prev7d.score_composite) /
            Math.max(prev7d.score_composite, 1)) *
          100
        : 0;
      const trend30d = prev30d
        ? ((r.composite - prev30d.score_composite) /
            Math.max(prev30d.score_composite, 1)) *
          100
        : 0;

      db.prepare(
        "UPDATE entries SET trend_24h = ?, trend_7d = ?, trend_30d = ? WHERE id = ?"
      ).run(
        Math.round(trend24h * 10) / 10,
        Math.round(trend7d * 10) / 10,
        Math.round(trend30d * 10) / 10,
        r.entry_id
      );
    }
  });

  updateTx();
}
