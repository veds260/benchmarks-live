/**
 * Generates search terms for an entry to improve social mention matching.
 * Returns an array of search strings to use across HN, Reddit, and Twitter.
 */

// Known abbreviations and alternative names
const ABBREVIATIONS: Record<string, string[]> = {
  "stable-diffusion-3": ["SD3", "Stable Diffusion"],
  "stable-video-diffusion": ["SVD"],
  "flux-1-dev": ["FLUX Dev", "FLUX.1"],
  "flux-1-schnell": ["FLUX Schnell", "FLUX.1"],
  "dall-e-3": ["DALLE3", "DALL-E", "DALLE"],
  "gpt-4o": ["GPT4o", "GPT 4o"],
  "gpt-4o-mini": ["GPT4o mini", "GPT 4o mini"],
  "gpt-5": ["GPT5"],
  "o3": ["OpenAI o3"],
  "o4-mini": ["OpenAI o4", "o4 mini"],
  "claude-opus-4": ["Claude Opus", "Opus 4"],
  "claude-sonnet-4": ["Claude Sonnet", "Sonnet 4"],
  "claude-haiku-35": ["Claude Haiku", "Haiku 3.5"],
  "gemini-25-pro": ["Gemini Pro", "Gemini 2.5"],
  "gemini-25-flash": ["Gemini Flash"],
  "deepseek-v3": ["DeepSeek V3", "DeepSeek-V3"],
  "deepseek-r1": ["DeepSeek R1", "DeepSeek-R1"],
  "llama-4-maverick": ["Llama 4", "Llama Maverick"],
  "llama-4-scout": ["Llama Scout"],
  "llama-33-70b": ["Llama 3.3"],
  "llama-31-405b": ["Llama 3.1 405B"],
  "llama-32-3b": ["Llama 3.2"],
  "qwen-3-235b": ["Qwen3", "Qwen 3"],
  "qwen-3-32b": ["Qwen3 32B"],
  "whisper": ["OpenAI Whisper"],
  "llamacpp": ["llama.cpp", "llamacpp"],
  "vllm": ["vLLM"],
  "cursor": ["Cursor AI", "Cursor IDE"],
  "github-copilot": ["Copilot", "GitHub Copilot"],
  "claude-code": ["Claude Code", "claude-code"],
  "windsurf": ["Windsurf IDE", "Windsurf AI"],
  "cline": ["Cline AI"],
  "mcp-protocol": ["Model Context Protocol", "MCP"],
  "langchain": ["LangChain"],
  "langgraph": ["LangGraph"],
  "llamaindex": ["LlamaIndex", "Llama Index"],
  "crewai": ["CrewAI", "Crew AI"],
  "autogen": ["AutoGen", "Auto Gen"],
  "runway-gen4": ["Runway Gen-4", "Runway Gen4"],
  "sora": ["OpenAI Sora"],
  "veo-3": ["Google Veo", "Veo 3"],
  "elevenlabs": ["ElevenLabs", "Eleven Labs"],
  "midjourney": ["Midjourney", "MidJourney"],
  "perplexity": ["Perplexity AI"],
  "ollama": ["Ollama"],
  "groq": ["Groq"],
  "devin": ["Devin AI"],
  "bolt": ["Bolt.new"],
  "v0": ["v0 dev", "v0.dev"],
  "replit-agent": ["Replit Agent"],
  "browser-use": ["Browser Use", "browser-use"],
  "pydantic-ai": ["PydanticAI", "Pydantic AI"],
};

/**
 * Normalize a string for fuzzy matching:
 * lowercase, strip punctuation except dots and hyphens, collapse whitespace
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s.\-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Get all search terms for an entry.
 * Used by HN (as search queries) and Reddit/Twitter (for matching).
 */
export function getSearchTerms(
  name: string,
  slug: string,
  provider: string
): string[] {
  const terms = new Set<string>();

  // The actual name
  terms.add(name);

  // Slug with hyphens as spaces (e.g. "gpt 4o mini")
  const slugSpaced = slug.replace(/-/g, " ");
  if (slugSpaced !== name.toLowerCase()) {
    terms.add(slugSpaced);
  }

  // Provider + short name for disambiguation (e.g. "OpenAI GPT-4o")
  const shortName = name.split(" ")[0];
  if (shortName.toLowerCase() !== provider.toLowerCase()) {
    terms.add(`${provider} ${shortName}`);
  }

  // Known abbreviations
  const abbrevs = ABBREVIATIONS[slug];
  if (abbrevs) {
    for (const a of abbrevs) {
      terms.add(a);
    }
  }

  return Array.from(terms);
}

/**
 * Check if any of the search terms match a piece of text (title, tweet, etc.)
 * Uses normalized fuzzy matching.
 */
export function matchesAny(
  text: string,
  searchTerms: string[]
): boolean {
  const normalizedText = normalize(text);
  return searchTerms.some((term) => {
    const normalizedTerm = normalize(term);
    // Skip very short terms that would match too broadly
    if (normalizedTerm.length < 3) return false;
    return normalizedText.includes(normalizedTerm);
  });
}
