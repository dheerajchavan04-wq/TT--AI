'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/store'
import { getModels } from '@/lib/openrouter'
import { resolveInferenceBaseUrl, isOpenRouterBase } from '@/lib/upstream'
import { ChevronDown, Sparkles, RefreshCw } from 'lucide-react'

interface ModelInfo {
  id: string
  name: string
  provider: string
  description: string
  context: string
}

const MODELS: ModelInfo[] = [
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'Google', description: 'Frontier multimodal reasoning', context: '1M' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'Google', description: 'Fast agentic model', context: '1M' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Strong reasoning + coding', context: '1M' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Fast and efficient', context: '1M' },
  { id: 'stepfun/step-3.5-flash', name: 'Step 3.5 Flash', provider: 'StepFun', description: 'Fast open MoE, 196B/11B active', context: '256K' },
  { id: 'x-ai/grok-4', name: 'Grok 4', provider: 'xAI', description: 'Frontier reasoning, 256K context', context: '256K' },
  { id: 'x-ai/grok-code-fast-1', name: 'Grok Code Fast', provider: 'xAI', description: 'Fast coding model', context: '128K' },
  { id: 'x-ai/grok-4-fast', name: 'Grok 4 Fast', provider: 'xAI', description: 'Balanced speed and reasoning', context: '128K' },
  { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xAI', description: 'Fast reasoning, 2M context', context: '2M' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Reliable workhorse', context: '200K' },
  { id: 'anthropic/claude-opus-4.6', name: 'Claude Opus 4.6', provider: 'Anthropic', description: 'Latest flagship model', context: '200K' },
  { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', description: 'Best balance of speed + quality', context: '200K' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', description: 'Strong and reliable', context: '200K' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic', description: 'Previous flagship', context: '200K' },
  { id: 'openai/gpt-5.3-chat', name: 'GPT-5.3 Chat', provider: 'OpenAI', description: 'Latest non-reasoning flagship', context: '128K' },
  { id: 'openai/gpt-5.2', name: 'GPT-5.2', provider: 'OpenAI', description: 'Strong flagship model', context: '128K' },
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI', description: 'OpenAI flagship', context: '128K' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Reliable workhorse', context: '128K' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'OpenAI', description: 'Open-weight MoE, Apache 2.0', context: '131K' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'OpenAI', description: 'Lightweight open-weight, runs on 16GB', context: '131K' },
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', provider: 'DeepSeek', description: 'GPT-5 class, extremely cheap', context: '128K' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek', description: 'Fast and capable', context: '128K' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', description: 'Strong reasoning model', context: '128K' },
  { id: 'qwen/qwen3.5-plus-02-15', name: 'Qwen 3.5 Plus', provider: 'Qwen', description: 'Latest Qwen flagship', context: '131K' },
  { id: 'qwen/qwen3-coder', name: 'Qwen3 Coder 480B', provider: 'Qwen', description: 'Frontier agentic coding MoE', context: '262K' },
  { id: 'qwen/qwen3-235b-a22b', name: 'Qwen3 235B', provider: 'Qwen', description: 'Powerful MoE model', context: '131K' },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', provider: 'Qwen', description: 'Strong open model', context: '131K' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B', provider: 'Qwen', description: 'Strong coding model', context: '131K' },
  { id: 'qwen/qwq-32b', name: 'QwQ 32B', provider: 'Qwen', description: 'Reasoning model, competitive with o1-mini', context: '131K' },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta', description: 'Latest Meta flagship', context: '128K' },
  { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout', provider: 'Meta', description: 'Efficient Meta model', context: '128K' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta', description: 'Solid all-rounder', context: '128K' },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'Meta', description: 'Largest open model', context: '128K' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', provider: 'Meta', description: 'Lightweight speed option', context: '128K' },
  { id: 'google/gemma-3-27b-it', name: 'Gemma 3 27B', provider: 'Google', description: 'Multimodal open model, 140+ languages', context: '128K' },
  { id: 'z-ai/glm-5', name: 'GLM-5', provider: 'Z.AI', description: 'Latest GLM flagship', context: '128K' },
  { id: 'z-ai/glm-4.7', name: 'GLM-4.7', provider: 'Z.AI', description: 'Strong coding + agent tasks', context: '128K' },
  { id: 'mistralai/mistral-large-2512', name: 'Mistral Large 3', provider: 'Mistral', description: '675B MoE, Apache 2.0, multimodal', context: '262K' },
  { id: 'mistralai/mixtral-8x22b-instruct', name: 'Mixtral 8x22B', provider: 'Mistral', description: 'MoE powerhouse', context: '65K' },
  { id: 'mistralai/mistral-medium-3.1', name: 'Mistral Medium 3.1', provider: 'Mistral', description: 'Balanced Mistral model', context: '128K' },
  { id: 'nousresearch/hermes-4-70b', name: 'Hermes 4 70B', provider: 'Nous Research', description: 'Uncensored champion', context: '128K' },
  { id: 'nousresearch/hermes-4-405b', name: 'Hermes 4 405B', provider: 'Nous Research', description: 'Uncensored 405B, hybrid reasoning', context: '131K' },
  { id: 'nousresearch/hermes-3-llama-3.1-70b', name: 'Hermes 3 70B', provider: 'Nous Research', description: 'Classic uncensored', context: '128K' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b', name: 'Hermes 3 405B', provider: 'Nous Research', description: 'Uncensored 405B legacy', context: '128K' },
  { id: 'minimax/minimax-m2.5', name: 'MiniMax M2.5', provider: 'MiniMax', description: 'SWE-Bench 80.2%, agentic coding', context: '205K' },
  { id: 'moonshotai/kimi-k2', name: 'Kimi K2', provider: 'Moonshot AI', description: '1T MoE instruct, tool-use', context: '256K' },
  { id: 'moonshotai/kimi-k2.5', name: 'Kimi K2.5', provider: 'Moonshot AI', description: 'Native multimodal, agent swarm', context: '256K' },
  { id: 'perplexity/sonar', name: 'Perplexity Sonar', provider: 'Perplexity', description: 'Web-grounded answers', context: '128K' },
  { id: 'xiaomi/mimo-v2-flash', name: 'MiMo-V2 Flash', provider: 'Xiaomi', description: '309B MoE, #1 open-source on SWE-bench', context: '256K' },
  { id: 'xiaomi/mimo-v2-pro', name: 'MiMo-V2 Pro', provider: 'Xiaomi', description: '1T flagship, #1 Programming on OpenRouter', context: '1M' },
  { id: 'z-ai/glm-5-turbo', name: 'GLM 5 Turbo', provider: 'Z.AI', description: 'Fast agentic inference, 203K context', context: '203K' },
  { id: 'nvidia/nemotron-3-super-120b-a12b', name: 'Nemotron 3 Super', provider: 'NVIDIA', description: 'Hybrid Mamba-Transformer, 1M context', context: '262K' },
  { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'Google', description: 'Latest Gemini 3.1, advanced reasoning', context: '1M' },
]

export function ModelSelector() {
  const {
    defaultModel, setDefaultModel, apiKey,
    inferenceProvider, inferenceCustomBaseUrl,
  } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [localIds, setLocalIds] = useState<string[]>([])
  const [localError, setLocalError] = useState<string | null>(null)
  const v1 = resolveInferenceBaseUrl(inferenceProvider, inferenceCustomBaseUrl)
  const isCloud = isOpenRouterBase(v1)

  const loadLocal = useCallback(async () => {
    if (isCloud) return
    try {
      const ids = await getModels(apiKey || '', v1)
      setLocalIds(ids)
      setLocalError(null)
      const current = typeof defaultModel === 'string' ? defaultModel : ''
      if (ids.length > 0 && (
        !current.trim() ||
        current.includes('/') ||
        !ids.includes(current)
      )) {
        setDefaultModel(ids[0])
      }
    } catch (err) {
      setLocalIds([])
      const message = (err instanceof Error && err.message) ? err.message : 'Unable to reach the local server'
      setLocalError(`LM Studio models unavailable — ${message}`)
    }
  }, [apiKey, v1, isCloud, defaultModel, setDefaultModel])

  useEffect(() => {
    if (isOpen && !isCloud) loadLocal()
  }, [isOpen, isCloud, loadLocal])

  useEffect(() => {
    if (!isCloud) {
      loadLocal()
    } else {
      setLocalIds([])
    }
  }, [isCloud, loadLocal])

  const activeModel = isCloud
    ? (MODELS.find(m => m.id === defaultModel) || MODELS[0])
    : { id: defaultModel, name: defaultModel || '(set model id)', provider: 'Local', description: '', context: 'local' }

  if (!isCloud) {
    return (
      <div className="space-y-2">
        <label className="text-[11px] font-medium block" style={{ color: 'var(--secondary)' }}>
          Model id (local server)
        </label>
        <input
          type="text"
          value={typeof defaultModel === 'string' ? defaultModel : ''}
          onChange={(e) => setDefaultModel(e.target.value)}
          placeholder="e.g. llama3.2, qwen2.5"
          className="w-full px-3 py-2 text-sm glass-input rounded-xl focus:outline-none"
          style={{ color: 'var(--text)' }}
        />
        {localIds.length > 0 && (
          <select
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="w-full px-3 py-2 text-xs glass-input rounded-xl"
            style={{ color: 'var(--text)' }}
          >
            {localIds.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        )}
        <button type="button" onClick={() => loadLocal()}
          className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
          style={{ color: 'var(--primary)' }}>
          <RefreshCw className="w-3 h-3" />
          Refresh model list
        </button>
        {localError && (
          <p className="text-[10px] mt-1 leading-relaxed" style={{ color: '#f87171' }}>
            {localError}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <label className="text-[11px] font-medium mb-1.5 block" style={{ color: 'var(--secondary)' }}>Model</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2
          glass rounded-xl transition-all text-sm"
        style={{ color: 'var(--text)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
          <span className="truncate">{activeModel.name}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200
          ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--secondary)' }}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-20
            glass-panel rounded-xl shadow-2xl max-h-80 overflow-y-auto"
            style={{ background: 'var(--dim)' }}
          >
            {MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  setDefaultModel(model.id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-start gap-3 px-3 py-2.5 text-left
                  transition-colors duration-100
                  ${defaultModel === model.id ? '' : 'hover:bg-[var(--glass-hover)]'}`}
                style={defaultModel === model.id ? { background: 'var(--accent)' } : {}}
              >
                <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--secondary)' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>{model.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono"
                      style={{ background: 'var(--accent)', color: 'var(--secondary)' }}>
                      {model.context}
                    </span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--secondary)' }}>
                    {model.provider} · {model.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export { MODELS }
