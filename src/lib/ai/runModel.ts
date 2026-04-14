/**
 * runModel.ts
 * Thin wrapper: provider + mode → resolve model ID → call Puter.
 *
 * Use this instead of provider-specific transport when you have
 * provider/mode semantics rather than a concrete model string.
 * The model ID is resolved via modelResolver (live discovery > static fallback).
 */

import { resolveModel, type ProviderKey, type ModelMode } from './modelResolver'
import { chatWithPuter, type ChatMessage } from './puterAdapter'

export type RunModelArgs = {
  /** Provider key (openai, anthropic, google, …) */
  provider: ProviderKey
  /** Resolution mode — defaults to 'defaultFast' */
  mode?: ModelMode
  messages: ChatMessage[]
  stream?: boolean
  tools?: any[]
  temperature?: number
  max_tokens?: number
}

/**
 * Resolve a provider+mode to a Puter model ID and send the request.
 * Returns parsed JSON for non-streaming, ReadableStream body for streaming.
 */
export async function runModel({
  provider,
  mode = 'defaultFast',
  messages,
  stream = false,
  tools,
  temperature,
  max_tokens,
}: RunModelArgs) {
  const model = resolveModel(provider, mode)
  return chatWithPuter({ model, messages, stream, tools, temperature, max_tokens })
}

export default runModel
