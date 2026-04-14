/**
 * puterDiscovery.ts
 * Fetches the live Puter model catalog at server startup and populates
 * the model resolver's live map.
 *
 * Call syncPuterModels() once in server initialization (best-effort).
 * If discovery fails the static fallback map in modelResolver.ts is used.
 *
 * Env vars:
 *   PUTER_AUTH_TOKEN     — Bearer token (required)
 *   PUTER_DISCOVERY_URL  — Override discovery endpoint (optional)
 */

import { setLiveModelMap, type ProviderKey } from './modelResolver'

const PUTER_DISCOVERY_URL =
  process.env.PUTER_DISCOVERY_URL || 'https://api.puter.com/puterai/chat/models/details'

type PuterModelRecord = {
  id?: string
  name?: string
  provider?: string
  slug?: string
}

function normalizeProvider(raw?: string): ProviderKey | null {
  if (!raw) return null
  const p = raw.toLowerCase()
  if (p.includes('openai') || p.startsWith('gpt')) return 'openai'
  if (p.includes('anthropic') || p.includes('claude')) return 'anthropic'
  if (p.includes('google') || p.includes('gemini') || p.includes('gemma')) return 'google'
  if (p.includes('xai') || p.includes('grok') || p.startsWith('x-ai')) return 'xai'
  if (p.includes('deepseek')) return 'deepseek'
  if (p.includes('mistral') || p.includes('mixtral') || p.includes('codestral') || p.includes('devstral')) return 'mistral'
  if (p.includes('meta') || p.includes('llama')) return 'meta'
  if (p.includes('qwen')) return 'qwen'
  if (p.includes('cohere') || p.includes('command')) return 'cohere'
  if (p.includes('perplexity') || p.includes('sonar')) return 'perplexity'
  if (p.includes('minimax')) return 'minimax'
  if (p.includes('moonshot') || p.includes('kimi')) return 'moonshot'
  return null
}

function pickFastAndSmart(ids: string[]): { defaultFast?: string; defaultSmart?: string } {
  if (ids.length === 0) return {}
  const sorted = [...ids].sort()
  const fast =
    sorted.find(m => /nano|mini|small|flash|fast|lite|chat|8b|3b/i.test(m)) ?? sorted[0]
  const smart =
    sorted.find(m => /opus|reasoner|large|pro|maverick|405b|r1|4\.6/i.test(m)) ??
    sorted[sorted.length - 1]
  return { defaultFast: fast, defaultSmart: smart }
}

/**
 * Fetch the Puter model catalog and populate the resolver's live map.
 * Returns the built provider → {defaultFast, defaultSmart} map.
 * Throws on network/HTTP errors (caller should catch and warn, not crash).
 */
export async function syncPuterModels(): Promise<
  Record<string, { defaultFast?: string; defaultSmart?: string }>
> {
  const token = process.env.PUTER_AUTH_TOKEN
  if (!token) {
    console.warn('[puterDiscovery] PUTER_AUTH_TOKEN not set — skipping live model discovery')
    return {}
  }

  const res = await fetch(PUTER_DISCOVERY_URL, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Puter discovery HTTP ${res.status}: ${body}`)
  }

  const data = await res.json().catch(() => null)
  const rows: PuterModelRecord[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.models)
      ? data.models
      : []

  const grouped: Record<string, string[]> = {}
  for (const row of rows) {
    const providerKey = normalizeProvider(row.provider || row.name || row.id)
    const id = row.id || row.slug || row.name
    if (!providerKey || !id) continue
    grouped[providerKey] ??= []
    grouped[providerKey].push(id)
  }

  const next: Record<string, { defaultFast?: string; defaultSmart?: string }> = {}
  for (const [prov, ids] of Object.entries(grouped)) {
    next[prov] = pickFastAndSmart(ids)
  }

  setLiveModelMap(next as any)
  return next
}
