/**
 * modelResolver.ts
 * Maps provider + mode to a Puter model ID.
 *
 * Priority: live map (populated by puterDiscovery at startup) > static fallback.
 *
 * The static fallback map uses model IDs in the same format as the existing
 * ULTRAPLINIAN_MODELS tier lists so they work out of the box with Puter.
 */

export type ProviderKey =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'xai'
  | 'deepseek'
  | 'mistral'
  | 'meta'
  | 'qwen'
  | 'cohere'
  | 'perplexity'
  | 'minimax'
  | 'moonshot'

export type ModelMode = 'defaultFast' | 'defaultSmart'

/**
 * Static fallback map — used when live discovery hasn't run or partially failed.
 * Model IDs match the OpenRouter/Puter format (provider/model-name).
 */
const FALLBACK_MAP: Record<ProviderKey, Partial<Record<ModelMode, string>>> = {
  openai: {
    defaultFast: 'openai/gpt-oss-20b',
    defaultSmart: 'openai/gpt-5',
  },
  anthropic: {
    defaultFast: 'anthropic/claude-sonnet-4',
    defaultSmart: 'anthropic/claude-opus-4.6',
  },
  google: {
    defaultFast: 'google/gemini-2.5-flash',
    defaultSmart: 'google/gemini-3-pro-preview',
  },
  xai: {
    defaultFast: 'x-ai/grok-code-fast-1',
    defaultSmart: 'x-ai/grok-4',
  },
  deepseek: {
    defaultFast: 'deepseek/deepseek-chat',
    defaultSmart: 'deepseek/deepseek-r1',
  },
  mistral: {
    defaultFast: 'mistralai/mistral-small-3.2-24b-instruct',
    defaultSmart: 'mistralai/mistral-large-2512',
  },
  meta: {
    defaultFast: 'meta-llama/llama-3.1-8b-instruct',
    defaultSmart: 'meta-llama/llama-4-maverick',
  },
  qwen: {
    defaultFast: 'qwen/qwen-2.5-72b-instruct',
    defaultSmart: 'qwen/qwen3.5-plus-02-15',
  },
  cohere: {
    defaultFast: 'cohere/command-r',
    defaultSmart: 'cohere/command-a',
  },
  perplexity: {
    defaultFast: 'perplexity/sonar',
    defaultSmart: 'perplexity/sonar-reasoning-pro',
  },
  minimax: {
    defaultFast: 'minimax/minimax-m2.5',
    defaultSmart: 'minimax/minimax-m2.5',
  },
  moonshot: {
    defaultFast: 'moonshotai/kimi-k2.5',
    defaultSmart: 'moonshotai/kimi-k2',
  },
}

let liveModelMap: Partial<Record<ProviderKey, Partial<Record<ModelMode, string>>>> = {}

/** Override the live map at runtime (called by puterDiscovery.syncPuterModels) */
export function setLiveModelMap(
  next: Partial<Record<ProviderKey, Partial<Record<ModelMode, string>>>>,
) {
  liveModelMap = next
}

/** Read the current live map */
export function getLiveModelMap(): Partial<Record<ProviderKey, Partial<Record<ModelMode, string>>>> {
  return liveModelMap
}

/**
 * Resolve a Puter model ID for the given provider and mode.
 * Returns the live-discovered ID first, then falls back to the static map.
 * Throws if neither is available.
 */
export function resolveModel(provider: ProviderKey, mode: ModelMode): string {
  const live = liveModelMap[provider]?.[mode]
  if (live) return live

  const fallback = FALLBACK_MAP[provider]?.[mode]
  if (fallback) return fallback

  throw new Error(`No Puter model mapping for provider="${provider}" mode="${mode}"`)
}
