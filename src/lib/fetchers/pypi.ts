import { getDb } from "../db";

export async function fetchPyPIStats(): Promise<number> {
  const db = getDb();

  const entries = db
    .prepare("SELECT id, pypi_package FROM entries WHERE pypi_package IS NOT NULL")
    .all() as { id: number; pypi_package: string }[];

  const today = new Date().toISOString().split("T")[0];
  let updated = 0;

  const upsert = db.prepare(`
    INSERT INTO download_stats (entry_id, date, source, downloads_day, downloads_week, downloads_month, likes)
    VALUES (?, ?, 'pypi', ?, ?, ?, 0)
    ON CONFLICT(entry_id, date, source) DO UPDATE SET
      downloads_day = excluded.downloads_day,
      downloads_week = excluded.downloads_week,
      downloads_month = excluded.downloads_month
  `);

  for (const entry of entries) {
    try {
      // pypistats.org API
      const res = await fetch(
        `https://pypistats.org/api/packages/${entry.pypi_package}/recent`
      );
      if (!res.ok) continue;

      const data = await res.json();
      const recent = data.data || {};

      upsert.run(
        entry.id,
        today,
        recent.last_day || 0,
        recent.last_week || 0,
        recent.last_month || 0
      );
      updated++;

      await new Promise((r) => setTimeout(r, 300)); // PyPI rate limits are stricter
    } catch (err) {
      console.error(`PyPI fetch failed for ${entry.pypi_package}:`, err);
    }
  }

  return updated;
}
