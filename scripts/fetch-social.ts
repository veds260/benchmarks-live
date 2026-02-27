import { fetchHackerNewsStats } from "../src/lib/fetchers/hackernews";
import { fetchRedditStats } from "../src/lib/fetchers/reddit";

async function main() {
  console.log("Fetching HN stats...");
  const hn = await fetchHackerNewsStats();
  console.log(`HN: Updated ${hn} entries`);

  console.log("Fetching Reddit stats...");
  const reddit = await fetchRedditStats();
  console.log(`Reddit: Updated ${reddit} entries`);
}

main().catch(console.error);
