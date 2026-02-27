import { isSignedUp } from "./auth";

const STORAGE_KEY = "bml_queries";
const MAX_QUERIES = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

interface QueryRecord {
  count: number;
  firstAt: number; // timestamp of first query in this window
}

function getRecord(): QueryRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, firstAt: Date.now() };
    const rec: QueryRecord = JSON.parse(raw);
    // Reset if window expired
    if (Date.now() - rec.firstAt > WINDOW_MS) {
      return { count: 0, firstAt: Date.now() };
    }
    return rec;
  } catch {
    return { count: 0, firstAt: Date.now() };
  }
}

function saveRecord(rec: QueryRecord) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
  } catch {
    // storage full or private browsing
  }
}

/** Returns true if the user still has queries left */
export function canQuery(): boolean {
  if (isSignedUp()) return true;
  const rec = getRecord();
  return rec.count < MAX_QUERIES;
}

/** Consume one query. Returns false if limit reached. */
export function useQuery(): boolean {
  if (isSignedUp()) return true;
  const rec = getRecord();
  if (rec.count >= MAX_QUERIES) return false;
  rec.count += 1;
  if (rec.count === 1) rec.firstAt = Date.now();
  saveRecord(rec);
  return true;
}

/** How many queries remain */
export function queriesRemaining(): number {
  if (isSignedUp()) return Infinity;
  const rec = getRecord();
  return Math.max(0, MAX_QUERIES - rec.count);
}

/** Milliseconds until the window resets */
export function msUntilReset(): number {
  const rec = getRecord();
  return Math.max(0, rec.firstAt + WINDOW_MS - Date.now());
}
