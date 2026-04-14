/**
 * availability.ts
 * Build a UI-friendly availability map from the live Puter discovery results.
 * The frontend can use this to enable/disable (gray-out) provider selectors
 * based on what Puter currently exposes.
 *
 * Usage:
 *   import { buildAvailabilityMap } from '@/lib/ai/availability'
 *   const avail = buildAvailabilityMap()  // reads current live map
 */

import { getLiveModelMap, type ProviderKey } from './modelResolver'

export type ModelAvailability = {
  provider: ProviderKey
  /** Puter model ID for the fast variant (if available) */
  defaultFast?: string
  /** Puter model ID for the smart variant (if available) */
  defaultSmart?: string
  /** true when at least one variant is available in the live map */
  enabled: boolean
}

const ALL_PROVIDERS: ProviderKey[] = [
  'openai', 'anthropic', 'google', 'xai', 'deepseek',
  'mistral', 'meta', 'qwen', 'cohere', 'perplexity', 'minimax', 'moonshot',
]

/**
 * Build an availability map for all known providers.
 *
 * @param live - Optional explicit map; defaults to the current live map from modelResolver.
 */
export function buildAvailabilityMap(
  live?: Record<string, { defaultFast?: string; defaultSmart?: string }>,
): Record<string, ModelAvailability> {
  const map = (live ?? getLiveModelMap()) as Record<string, { defaultFast?: string; defaultSmart?: string }>
  const result: Record<string, ModelAvailability> = {}
  for (const provider of ALL_PROVIDERS) {
    const row = map[provider] ?? {}
    result[provider] = {
      provider,
      defaultFast: row.defaultFast,
      defaultSmart: row.defaultSmart,
      enabled: Boolean(row.defaultFast || row.defaultSmart),
    }
  }
  return result
}
