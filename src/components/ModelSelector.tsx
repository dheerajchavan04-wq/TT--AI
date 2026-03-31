'use client'

import { useState } from 'react'
import { useStore } from '@/store'
import { ChevronDown, Sparkles } from 'lucide-react'

interface ModelInfo {
  id: string
  name: string
  provider: string
  description: string
  context: string
  free?: boolean
}

const MODELS: ModelInfo[] = [
  // ── Google (top) ──
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'Google',
    description: 'Frontier multimodal reasoning',
    context: '1M'
  },
  {
    id: 'google/gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'Google',
    description: 'Fast agentic model',
    context: '1M'
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    description: 'Strong reasoning + coding',
    context: '1M'
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Fast and efficient',
    context: '1M'
  },
  // ── StepFun ──
  {
    id: 'stepfun/step-3.5-flash',
    name: 'Step 3.5 Flash',
    provider: 'StepFun',
    description: 'Fast open MoE, 196B/11B active',
    context: '256K'
  },
  // ── xAI ──
  {
    id: 'x-ai/grok-4',
    name: 'Grok 4',
    provider: 'xAI',
    description: 'Frontier reasoning, 256K context',
    context: '256K'
  },
  {
    id: 'x-ai/grok-code-fast-1',
    name: 'Grok Code Fast',
    provider: 'xAI',
    description: 'Fast coding model',
    context: '128K'
  },
  {
    id: 'x-ai/grok-4-fast',
    name: 'Grok 4 Fast',
    provider: 'xAI',
    description: 'Balanced speed and reasoning',
    context: '128K'
  },
  {
    id: 'x-ai/grok-4.1-fast',
    name: 'Grok 4.1 Fast',
    provider: 'xAI',
    description: 'Fast reasoning, 2M context',
    context: '2M'
  },
  // ── Anthropic ──
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Reliable workhorse',
    context: '200K'
  },
  {
    id: 'anthropic/claude-opus-4.6',
    name: 'Claude Opus 4.6',
    provider: 'Anthropic',
    description: 'Latest flagship model',
    context: '200K'
  },
  {
    id: 'anthropic/claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6',
    provider: 'Anthropic',
    description: 'Best balance of speed + quality',
    context: '200K'
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    description: 'Strong and reliable',
    context: '200K'
  },
  {
    id: 'anthropic/claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    description: 'Previous flagship',
    context: '200K'
  },
  // ── OpenAI ──
  {
    id: 'openai/gpt-5.3-chat',
    name: 'GPT-5.3 Chat',
    provider: 'OpenAI',
    description: 'Latest non-reasoning flagship',
    context: '128K'
  },
  {
    id: 'openai/gpt-5.2',
    name: 'GPT-5.2',
    provider: 'OpenAI',
    description: 'Strong flagship model',
    context: '128K'
  },
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    description: 'OpenAI flagship',
    context: '128K'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Reliable workhorse',
    context: '128K'
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    provider: 'OpenAI',
    description: 'Open-weight MoE, Apache 2.0',
    context: '131K'
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT-OSS 20B',
    provider: 'OpenAI',
    description: 'Lightweight open-weight, runs on 16GB',
    context: '131K'
  },
  // ── DeepSeek ──
  {
    id: 'deepseek/deepseek-v3.2',
    name: 'DeepSeek V3.2',
    provider: 'DeepSeek',
    description: 'GPT-5 class, extremely cheap',
    context: '128K'
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    description: 'Fast and capable',
    context: '128K'
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    description: 'Strong reasoning model',
    context: '128K'
  },
  // ── Qwen ──
  {
    id: 'qwen/qwen3.5-plus-02-15',
    name: 'Qwen 3.5 Plus',
    provider: 'Qwen',
    description: 'Latest Qwen flagship',
    context: '131K'
  },
  {
    id: 'qwen/qwen3-coder',
    name: 'Qwen3 Coder 480B',
    provider: 'Qwen',
    description: 'Frontier agentic coding MoE',
    context: '262K'
  },
  {
    id: 'qwen/qwen3-235b-a22b',
    name: 'Qwen3 235B',
    provider: 'Qwen',
    description: 'Powerful MoE model',
    context: '131K'
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B',
    provider: 'Qwen',
    description: 'Strong open model',
    context: '131K'
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder 32B',
    provider: 'Qwen',
    description: 'Strong coding model',
    context: '131K'
  },
  {
    id: 'qwen/qwq-32b',
    name: 'QwQ 32B',
    provider: 'Qwen',
    description: 'Reasoning model, competitive with o1-mini',
    context: '131K'
  },
  // ── Meta ──
  {
    id: 'meta-llama/llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'Meta',
    description: 'Latest Meta flagship',
    context: '128K'
  },
  {
    id: 'meta-llama/llama-4-scout',
    name: 'Llama 4 Scout',
    provider: 'Meta',
    description: 'Efficient Meta model',
    context: '128K'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    description: 'Solid all-rounder',
    context: '128K'
  },
  {
    id: 'meta-llama/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B',
    provider: 'Meta',
    description: 'Largest open model',
    context: '128K'
  },
  {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    description: 'Lightweight speed option',
    context: '128K'
  },
  // ── Google (Open) ──
  {
    id: 'google/gemma-3-27b-it',
    name: 'Gemma 3 27B',
    provider: 'Google',
    description: 'Multimodal open model, 140+ languages',
    context: '128K'
  },
  // ── Z.AI (GLM) ──
  {
    id: 'z-ai/glm-5',
    name: 'GLM-5',
    provider: 'Z.AI',
    description: 'Latest GLM flagship',
    context: '128K'
  },
  {
    id: 'z-ai/glm-4.7',
    name: 'GLM-4.7',
    provider: 'Z.AI',
    description: 'Strong coding + agent tasks',
    context: '128K'
  },
  // ── Mistral ──
  {
    id: 'mistralai/mistral-large-2512',
    name: 'Mistral Large 3',
    provider: 'Mistral',
    description: '675B MoE, Apache 2.0, multimodal',
    context: '262K'
  },
  {
    id: 'mistralai/mixtral-8x22b-instruct',
    name: 'Mixtral 8x22B',
    provider: 'Mistral',
    description: 'MoE powerhouse',
    context: '65K'
  },
  {
    id: 'mistralai/mistral-medium-3.1',
    name: 'Mistral Medium 3.1',
    provider: 'Mistral',
    description: 'Balanced Mistral model',
    context: '128K'
  },
  // ── Hermes ──
  {
    id: 'nousresearch/hermes-4-70b',
    name: 'Hermes 4 70B',
    provider: 'Nous Research',
    description: 'Uncensored champion',
    context: '128K'
  },
  {
    id: 'nousresearch/hermes-4-405b',
    name: 'Hermes 4 405B',
    provider: 'Nous Research',
    description: 'Uncensored 405B, hybrid reasoning',
    context: '131K'
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-70b',
    name: 'Hermes 3 70B',
    provider: 'Nous Research',
    description: 'Classic uncensored',
    context: '128K'
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b',
    name: 'Hermes 3 405B',
    provider: 'Nous Research',
    description: 'Uncensored 405B legacy',
    context: '128K'
  },
  // ── MiniMax ──
  {
    id: 'minimax/minimax-m2.5',
    name: 'MiniMax M2.5',
    provider: 'MiniMax',
    description: 'SWE-Bench 80.2%, agentic coding',
    context: '205K'
  },
  // ── Other ──
  {
    id: 'moonshotai/kimi-k2',
    name: 'Kimi K2',
    provider: 'Moonshot AI',
    description: '1T MoE instruct, tool-use',
    context: '256K'
  },
  {
    id: 'moonshotai/kimi-k2.5',
    name: 'Kimi K2.5',
    provider: 'Moonshot AI',
    description: 'Native multimodal, agent swarm',
    context: '256K'
  },
  {
    id: 'perplexity/sonar',
    name: 'Perplexity Sonar',
    provider: 'Perplexity',
    description: 'Web-grounded answers',
    context: '128K'
  },
  // ── Xiaomi ──
  {
    id: 'xiaomi/mimo-v2-flash',
    name: 'MiMo-V2 Flash',
    provider: 'Xiaomi',
    description: '309B MoE, #1 open-source on SWE-bench',
    context: '256K'
  },
  // ── Xiaomi ──
  {
    id: 'xiaomi/mimo-v2-pro',
    name: 'MiMo-V2 Pro',
    provider: 'Xiaomi',
    description: '1T flagship, #1 Programming on OpenRouter',
    context: '1M'
  },
  // ── Z.AI ──
  {
    id: 'z-ai/glm-5-turbo',
    name: 'GLM 5 Turbo',
    provider: 'Z.AI',
    description: 'Fast agentic inference, 203K context',
    context: '203K'
  },
  // ── NVIDIA ──
  {
    id: 'nvidia/nemotron-3-super-120b-a12b',
    name: 'Nemotron 3 Super',
    provider: 'NVIDIA',
    description: 'Hybrid Mamba-Transformer, 1M context',
    context: '262K'
  },
  // ── Google ──
  {
    id: 'google/gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    provider: 'Google',
    description: 'Latest Gemini 3.1, advanced reasoning',
    context: '1M'
  },

  // ═══════════════════════════════════════════════════════════════════════
  // 🆓 FREE MODELS — $0/M tokens on OpenRouter
  // ═══════════════════════════════════════════════════════════════════════

  {
    id: 'stepfun/step-3.5-flash:free',
    name: 'Step 3.5 Flash (Free)',
    provider: 'StepFun',
    description: 'Free — Fast open MoE, 196B/11B active',
    context: '256K',
    free: true
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    name: 'Nemotron 3 Super (Free)',
    provider: 'NVIDIA',
    description: 'Free — Hybrid Mamba-Transformer, 1M context',
    context: '262K',
    free: true
  },
  {
    id: 'qwen/qwen3.6-plus-preview:free',
    name: 'Qwen 3.6 Plus (Free)',
    provider: 'Qwen',
    description: 'Free — Next-gen hybrid architecture, flagship preview',
    context: '1M',
    free: true
  },
  {
    id: 'arcee-ai/trinity-large-preview:free',
    name: 'Trinity Large (Free)',
    provider: 'Arcee AI',
    description: 'Free — 400B MoE, 13B active, agentic coding',
    context: '131K',
    free: true
  },
  {
    id: 'z-ai/glm-4.5-air:free',
    name: 'GLM 4.5 Air (Free)',
    provider: 'Z.AI',
    description: 'Free — Lightweight MoE, hybrid thinking modes',
    context: '131K',
    free: true
  },
  {
    id: 'nvidia/nemotron-3-nano-30b-a3b:free',
    name: 'Nemotron 3 Nano 30B (Free)',
    provider: 'NVIDIA',
    description: 'Free — Small MoE, high compute efficiency',
    context: '256K',
    free: true
  },
  {
    id: 'arcee-ai/trinity-mini:free',
    name: 'Trinity Mini (Free)',
    provider: 'Arcee AI',
    description: 'Free — 26B MoE, 3B active, function calling',
    context: '131K',
    free: true
  },
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl:free',
    name: 'Nemotron Nano 12B 2 VL (Free)',
    provider: 'NVIDIA',
    description: 'Free — Multimodal, video + document understanding',
    context: '128K',
    free: true
  },
  {
    id: 'qwen/qwen3-next-80b-a3b-instruct:free',
    name: 'Qwen3 Next 80B (Free)',
    provider: 'Qwen',
    description: 'Free — Fast stable responses, no thinking traces',
    context: '262K',
    free: true
  },
  {
    id: 'nvidia/nemotron-nano-9b-v2:free',
    name: 'Nemotron Nano 9B V2 (Free)',
    provider: 'NVIDIA',
    description: 'Free — Unified reasoning + non-reasoning model',
    context: '128K',
    free: true
  },
  {
    id: 'openai/gpt-oss-120b:free',
    name: 'GPT-OSS 120B (Free)',
    provider: 'OpenAI',
    description: 'Free — Open-weight MoE, Apache 2.0',
    context: '131K',
    free: true
  },
  {
    id: 'openai/gpt-oss-20b:free',
    name: 'GPT-OSS 20B (Free)',
    provider: 'OpenAI',
    description: 'Free — Lightweight open-weight, runs on 16GB',
    context: '131K',
    free: true
  },
  {
    id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
    name: 'Venice Uncensored (Free)',
    provider: 'Venice',
    description: 'Free — Uncensored Mistral-based model',
    context: '32K',
    free: true
  },
  {
    id: 'google/gemma-3n-e2b-it:free',
    name: 'Gemma 3n 2B (Free)',
    provider: 'Google',
    description: 'Free — Ultra-lightweight, edge-ready',
    context: '8K',
    free: true
  },
  {
    id: 'google/gemma-3n-e4b-it:free',
    name: 'Gemma 3n 4B (Free)',
    provider: 'Google',
    description: 'Free — Compact multimodal model',
    context: '8K',
    free: true
  },
  {
    id: 'google/gemma-3-4b-it:free',
    name: 'Gemma 3 4B (Free)',
    provider: 'Google',
    description: 'Free — Small open model, instruction-tuned',
    context: '32K',
    free: true
  },
  {
    id: 'google/gemma-3-12b-it:free',
    name: 'Gemma 3 12B (Free)',
    provider: 'Google',
    description: 'Free — Mid-size open model, 140+ languages',
    context: '32K',
    free: true
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B (Free)',
    provider: 'Google',
    description: 'Free — Multimodal open model, 140+ languages',
    context: '128K',
    free: true
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B (Free)',
    provider: 'Meta',
    description: 'Free — Solid all-rounder, multilingual',
    context: '65K',
    free: true
  },
  {
    id: 'meta-llama/llama-3.2-3b-instruct:free',
    name: 'Llama 3.2 3B (Free)',
    provider: 'Meta',
    description: 'Free — Ultra-lightweight Meta model',
    context: '128K',
    free: true
  },
  {
    id: 'nousresearch/hermes-3-llama-3.1-405b:free',
    name: 'Hermes 3 405B (Free)',
    provider: 'Nous Research',
    description: 'Free — Uncensored 405B, hybrid reasoning',
    context: '131K',
    free: true
  },
  {
    id: 'minimax/minimax-m2.5:free',
    name: 'MiniMax M2.5 (Free)',
    provider: 'MiniMax',
    description: 'Free — SWE-Bench 80.2%, agentic coding',
    context: '197K',
    free: true
  },
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3 Coder 480B (Free)',
    provider: 'Qwen',
    description: 'Free — Frontier agentic coding MoE',
    context: '262K',
    free: true
  },
  {
    id: 'liquid/lfm-2.5-1.2b-thinking:free',
    name: 'LFM2.5 1.2B Thinking (Free)',
    provider: 'LiquidAI',
    description: 'Free — Tiny reasoning model, edge-ready',
    context: '32K',
    free: true
  },
  {
    id: 'liquid/lfm-2.5-1.2b-instruct:free',
    name: 'LFM2.5 1.2B Instruct (Free)',
    provider: 'LiquidAI',
    description: 'Free — Ultra-light instruct model',
    context: '32K',
    free: true
  },
]

export function ModelSelector() {
  const { defaultModel, setDefaultModel } = useStore()
  const [isOpen, setIsOpen] = useState(false)

  const activeModel = MODELS.find(m => m.id === defaultModel) || MODELS[0]

  return (
    <div className="relative">
      <label className="text-xs theme-secondary mb-1 block">Model</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2
          bg-theme-bg border border-theme-primary rounded-lg
          hover:glow-box transition-all text-sm"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span className="truncate">{activeModel.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 right-0 mt-1 z-20
            bg-theme-dim border border-theme-primary rounded-lg
            shadow-lg max-h-80 overflow-y-auto"
          >
            {MODELS.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  setDefaultModel(model.id)
                  setIsOpen(false)
                }}
                className={`w-full flex items-start gap-3 px-3 py-3 text-left
                  hover:bg-theme-accent transition-colors
                  ${defaultModel === model.id ? 'bg-theme-accent' : ''}`}
              >
                <Sparkles className="w-4 h-4 mt-0.5 theme-secondary" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{model.name}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-theme-accent rounded">
                      {model.context}
                    </span>
                    {model.free && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded font-medium">
                        FREE
                      </span>
                    )}
                  </div>
                  <div className="text-xs theme-secondary">
                    {model.provider} • {model.description}
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
