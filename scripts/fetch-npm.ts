import { fetchNpmStats } from "../src/lib/fetchers/npm";

async function main() {
  console.log("Fetching npm stats...");
  const count = await fetchNpmStats();
  console.log(`Updated ${count} entries`);
}

main().catch(console.error);
