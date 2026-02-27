import { getDb } from "../db";

const HF_API = "https://huggingface.co/api/models";

interface HFModel {
  downloads: number;
  likes: number;
}

export async function fetchHuggingFaceStats(): Promise<number> {
  const db = getDb();

  const entries = db
    .prepare("SELECT id, huggingface_id FROM entries WHERE huggingface_id IS NOT NULL")
    .all() as { id: number; huggingface_id: string }[];

  const today = new Date().toISOString().split("T")[0];
  let updated = 0;

  const upsert = db.prepare(`
    INSERT INTO download_stats (entry_id, date, source, downloads_day, downloads_week, downloads_month, likes)
    VALUES (?, ?, 'huggingface', 0, 0, ?, ?)
    ON CONFLICT(entry_id, date, source) DO UPDATE SET
      downloads_month = excluded.downloads_month, likes = excluded.likes
  `);

  for (const entry of entries) {
    try {
      const res = await fetch(`${HF_API}/${entry.huggingface_id}`);
      if (!res.ok) continue;
      const model: HFModel = await res.json();

      upsert.run(entry.id, today, model.downloads || 0, model.likes || 0);
      updated++;

      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.error(`HF fetch failed for ${entry.huggingface_id}:`, err);
    }
  }

  return updated;
}
