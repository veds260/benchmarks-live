import { fetchGitHubStats } from "../src/lib/fetchers/github";

async function main() {
  console.log("Fetching GitHub stats...");
  const count = await fetchGitHubStats();
  console.log(`Updated ${count} entries`);
}

main().catch(console.error);
