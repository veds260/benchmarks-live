import { getDb } from "../db";

export async function fetchNpmStats(): Promise<number> {
  const db = getDb();

  const entries = db
    .prepare("SELECT id, npm_package FROM entries WHERE npm_package IS NOT NULL")
    .all() as { id: number; npm_package: string }[];

  const today = new Date().toISOString().split("T")[0];
  let updated = 0;

  const upsert = db.prepare(`
    INSERT INTO download_stats (entry_id, date, source, downloads_day, downloads_week, downloads_month, likes)
    VALUES (?, ?, 'npm', ?, ?, ?, 0)
    ON CONFLICT(entry_id, date, source) DO UPDATE SET
      downloads_day = excluded.downloads_day,
      downloads_week = excluded.downloads_week,
      downloads_month = excluded.downloads_month
  `);

  for (const entry of entries) {
    try {
      // npm API for download counts
      const pkg = encodeURIComponent(entry.npm_package);

      // Last day
      const dayRes = await fetch(`https://api.npmjs.org/downloads/point/last-day/${pkg}`);
      const dayData = dayRes.ok ? await dayRes.json() : { downloads: 0 };

      // Last week
      const weekRes = await fetch(`https://api.npmjs.org/downloads/point/last-week/${pkg}`);
      const weekData = weekRes.ok ? await weekRes.json() : { downloads: 0 };

      // Last month
      const monthRes = await fetch(`https://api.npmjs.org/downloads/point/last-month/${pkg}`);
      const monthData = monthRes.ok ? await monthRes.json() : { downloads: 0 };

      upsert.run(
        entry.id,
        today,
        dayData.downloads || 0,
        weekData.downloads || 0,
        monthData.downloads || 0
      );
      updated++;

      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.error(`npm fetch failed for ${entry.npm_package}:`, err);
    }
  }

  return updated;
}
