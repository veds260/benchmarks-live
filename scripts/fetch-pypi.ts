import { fetchPyPIStats } from "../src/lib/fetchers/pypi";

async function main() {
  console.log("Fetching PyPI stats...");
  const count = await fetchPyPIStats();
  console.log(`Updated ${count} entries`);
}

main().catch(console.error);
