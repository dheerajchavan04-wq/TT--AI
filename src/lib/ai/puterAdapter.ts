/**
 * puterAdapter.ts
 * Single transport adapter that forwards OpenAI-style chat/completions
 * requests to Puter's OpenAI-compatible endpoint.
 *
 * Env vars:
 *   PUTER_AUTH_TOKEN   — Bearer token for Puter API (required for Puter mode)
 *   AI_BASE_URL        — Override Puter endpoint (default: https://api.puter.com/puterai/openai/v1)
 */

export const PUTER_BASE_URL =
  process.env.AI_BASE_URL || 'https://api.puter.com/puterai/openai/v1'

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: any
  name?: string
  tool_call_id?: string
}

export type ChatWithPuterArgs = {
  model: string
  messages: ChatMessage[]
  stream?: boolean
  tools?: any[]
  temperature?: number
  max_tokens?: number
  [key: string]: unknown
}

/**
 * Post an OpenAI-style chat/completions request to Puter.
 * - Non-streaming: returns parsed JSON (OpenAI-compatible response shape)
 * - Streaming: returns the raw ReadableStream body for SSE consumption
 *
 * Throws if PUTER_AUTH_TOKEN is not set or if the request fails.
 * The thrown error has `.status` attached for callers that format HTTP errors.
 */
export async function chatWithPuter({
  model,
  messages,
  stream = false,
  tools,
  temperature,
  max_tokens,
  ...rest
}: ChatWithPuterArgs) {
  const token = process.env.PUTER_AUTH_TOKEN
  if (!token) {
    throw new Error('PUTER_AUTH_TOKEN is not set; cannot call Puter API')
  }

  const url = `${PUTER_BASE_URL.replace(/\/$/, '')}/chat/completions`

  const body: Record<string, unknown> = {
    model,
    messages,
    stream,
    ...rest,
  }
  if (tools !== undefined) body.tools = tools
  if (temperature !== undefined) body.temperature = temperature
  if (max_tokens !== undefined) body.max_tokens = max_tokens

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`Puter error ${res.status}: ${text}`) as any
    err.status = res.status
    throw err
  }

  if (stream) {
    // Return raw body for SSE streaming — caller handles chunk parsing
    return res.body
  }

  return res.json()
}

export default chatWithPuter
