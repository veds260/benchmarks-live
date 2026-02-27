import { fetchHuggingFaceStats } from "../src/lib/fetchers/huggingface";

async function main() {
  console.log("Fetching HuggingFace stats...");
  const count = await fetchHuggingFaceStats();
  console.log(`Updated ${count} entries`);
}

main().catch(console.error);
