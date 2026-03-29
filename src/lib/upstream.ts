/**
 * OpenAI-compatible upstream (OpenRouter, LM Studio, Ollama, etc.)
 * All bases are normalized to .../api/v1 style root (no trailing slash).
 */

export const OPENROUTER_V1_BASE = 'https://openrouter.ai/api/v1'

export type InferenceProvider = 'openrouter' | 'lm_studio' | 'ollama' | 'custom'

const PRESETS: Record<InferenceProvider, string> = {
  openrouter: OPENROUTER_V1_BASE,
  lm_studio: 'http://127.0.0.1:1234/',
  ollama: 'http://127.0.0.1:11434/v1',
  custom: '',
}

/** Normalize user/base string to an OpenAI-root URL ending in /v1 */
export function normalizeApiV1Base(input: string): string {
  const t = input.trim().replace(/\/$/, '')
  if (!t) return OPENROUTER_V1_BASE
  if (t.endsWith('/v1')) return t
  return `${t}/v1`
}

export function resolveInferenceBaseUrl(
  provider: InferenceProvider,
  customBase: string,
): string {
  if (provider === 'custom') {
    const c = customBase.trim()
    return c ? normalizeApiV1Base(c) : OPENROUTER_V1_BASE
  }
  return normalizeApiV1Base(PRESETS[provider])
}

export function chatCompletionsUrl(v1Base: string): string {
  return `${normalizeApiV1Base(v1Base)}/chat/completions`
}

export function openaiModelsUrl(v1Base: string): string {
  return `${normalizeApiV1Base(v1Base)}/models`
}

export function isOpenRouterBase(v1Base: string): boolean {
  return normalizeApiV1Base(v1Base).includes('openrouter.ai')
}

export function buildUpstreamHeaders(
  apiKey: string,
  v1Base: string,
  opts: { includeContentType?: boolean } = {},
): Record<string, string> {
  const h: Record<string, string> = {}
  if (opts.includeContentType !== false) {
    h['Content-Type'] = 'application/json'
  }
  if (apiKey) h['Authorization'] = `Bearer ${apiKey}`
  if (isOpenRouterBase(v1Base)) {
    h['HTTP-Referer'] = 'https://godmod3.ai'
    h['X-Title'] = 'GODMOD3.AI'
  }
  return h
}

export function upstreamRequiresApiKey(v1Base: string): boolean {
  return isOpenRouterBase(v1Base)
}

export const INFERENCE_PROVIDER_LABELS: Record<InferenceProvider, string> = {
  openrouter: 'OpenRouter (cloud)',
  lm_studio: 'LM Studio',
  ollama: 'Ollama',
  custom: 'Custom base URL',
}
