import { getDb } from "../db";

const GITHUB_API = "https://api.github.com";

interface GitHubRepo {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
}

interface GitHubContributor {
  contributions: number;
}

export async function fetchGitHubStats(): Promise<number> {
  const db = getDb();
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "benchmarks-live",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const entries = db
    .prepare("SELECT id, github_repo FROM entries WHERE github_repo IS NOT NULL")
    .all() as { id: number; github_repo: string }[];

  const today = new Date().toISOString().split("T")[0];
  let updated = 0;

  const upsert = db.prepare(`
    INSERT INTO github_stats (entry_id, date, stars, forks, open_issues, contributors, commits_30d, last_commit_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(entry_id, date) DO UPDATE SET
      stars = excluded.stars, forks = excluded.forks,
      open_issues = excluded.open_issues, contributors = excluded.contributors,
      commits_30d = excluded.commits_30d, last_commit_at = excluded.last_commit_at
  `);

  for (const entry of entries) {
    try {
      // Rate limit: 60/hour unauthenticated, 5000/hour with token
      const repoRes = await fetch(`${GITHUB_API}/repos/${entry.github_repo}`, { headers });

      // Check for rate limiting
      const remaining = parseInt(repoRes.headers.get("x-ratelimit-remaining") || "999");
      if (repoRes.status === 403 || remaining <= 1) {
        const resetTime = parseInt(repoRes.headers.get("x-ratelimit-reset") || "0") * 1000;
        const waitMs = Math.max(0, resetTime - Date.now()) + 1000;
        console.log(`Rate limited. Waiting ${Math.ceil(waitMs / 1000)}s (${updated} entries done so far)...`);
        await new Promise((r) => setTimeout(r, waitMs));
        // Retry this entry
        const retryRes = await fetch(`${GITHUB_API}/repos/${entry.github_repo}`, { headers });
        if (!retryRes.ok) continue;
        const retryRepo: GitHubRepo = await retryRes.json();
        upsert.run(entry.id, today, retryRepo.stargazers_count, retryRepo.forks_count, retryRepo.open_issues_count, 0, 0, retryRepo.pushed_at);
        updated++;
        continue;
      }

      if (!repoRes.ok) {
        console.log(`  Skip ${entry.github_repo}: HTTP ${repoRes.status}`);
        continue;
      }
      const repo: GitHubRepo = await repoRes.json();

      // Get contributor count (just first page count) - skip if low on rate limit
      let contributors = 0;
      if (remaining > 10) {
        try {
          const contribRes = await fetch(
            `${GITHUB_API}/repos/${entry.github_repo}/contributors?per_page=1&anon=true`,
            { headers }
          );
          if (contribRes.ok) {
            const linkHeader = contribRes.headers.get("link") || "";
            const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
            contributors = lastMatch ? parseInt(lastMatch[1]) : 1;
          }
        } catch {
          // skip contributor count on error
        }
      }

      // Get commits in last 30 days - skip if low on rate limit
      let commits30d = 0;
      if (remaining > 10) {
        try {
          const since = new Date(Date.now() - 30 * 86400000).toISOString();
          const commitRes = await fetch(
            `${GITHUB_API}/repos/${entry.github_repo}/commits?since=${since}&per_page=1`,
            { headers }
          );
          if (commitRes.ok) {
            const linkHeader = commitRes.headers.get("link") || "";
            const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
            commits30d = lastMatch ? parseInt(lastMatch[1]) : 1;
          }
        } catch {
          // skip commit count on error
        }
      }

      upsert.run(
        entry.id,
        today,
        repo.stargazers_count,
        repo.forks_count,
        repo.open_issues_count,
        contributors,
        commits30d,
        repo.pushed_at
      );
      updated++;
      console.log(`  ${entry.github_repo}: ${repo.stargazers_count.toLocaleString()} stars (${remaining} API calls left)`);

      // Small delay to be nice to the API
      await new Promise((r) => setTimeout(r, token ? 200 : 1200));
    } catch (err) {
      console.error(`GitHub fetch failed for ${entry.github_repo}:`, err);
    }
  }

  return updated;
}
