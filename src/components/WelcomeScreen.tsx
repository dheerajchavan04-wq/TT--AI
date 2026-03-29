'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/store'
import { resolveInferenceBaseUrl, upstreamRequiresApiKey, INFERENCE_PROVIDER_LABELS } from '@/lib/upstream'
import type { InferenceProvider } from '@/lib/upstream'
import { Key, Zap, Shield, Cpu, Server, Globe, ArrowRight, Github, BookOpen } from 'lucide-react'

interface WelcomeScreenProps {
  onOpenSettings: () => void
  onOpenGuide?: () => void
}

export function WelcomeScreen({ onOpenSettings, onOpenGuide }: WelcomeScreenProps) {
  const {
    apiKey, ultraplinianApiUrl, ultraplinianApiKey, createConversation, theme,
    inferenceProvider, inferenceCustomBaseUrl, setInferenceProvider, setShowSettings,
  } = useStore()

  const proxyMode = !apiKey && !!ultraplinianApiUrl && !!ultraplinianApiKey
  const v1 = resolveInferenceBaseUrl(inferenceProvider, inferenceCustomBaseUrl)
  const canDirect =
    upstreamRequiresApiKey(v1) ? !!apiKey.trim() : inferenceProvider !== 'custom' || !!inferenceCustomBaseUrl.trim()

  const handleStart = () => {
    if (canDirect || proxyMode) {
      createConversation()
    } else {
      onOpenSettings()
    }
  }

  const handleProviderQuickStart = (provider: InferenceProvider) => {
    setInferenceProvider(provider)
    if (provider === 'openrouter') {
      setShowSettings(true)
    }
  }

  const isDark = theme !== 'light' && theme !== 'minimal'

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Subtle gradient bg */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(167,139,250,0.08) 0%, transparent 60%)'
            : 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.06) 0%, transparent 60%)',
        }}
      />

      {/* Logo with matrix glitch */}
      <div className="mb-2 flex items-center gap-3">
        <span className="text-4xl">🜏</span>
      </div>
      <GlitchTitle />
      <p className="text-base md:text-lg mb-10 text-center max-w-md" style={{ color: 'var(--secondary)' }}>
        Cognition without control. Tools for builders, not gatekeepers.
      </p>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mb-10 w-full">
        <FeatureCard
          icon={<Cpu className="w-5 h-5" />}
          title="Multi-Model"
          description="Claude, GPT, Gemini, Mistral, LLaMA and 50+ models"
        />
        <FeatureCard
          icon={<Shield className="w-5 h-5" />}
          title="Zero Telemetry"
          description="No cookies, no tracking, no data harvesting. Ever."
        />
        <FeatureCard
          icon={<Zap className="w-5 h-5" />}
          title="ULTRAPLINIAN"
          description="Race models in parallel, pick the best response"
        />
        <button onClick={() => onOpenGuide?.()} className="w-full text-left border-0 bg-transparent p-0">
          <FeatureCard
            icon={<BookOpen className="w-5 h-5" />}
            title="Field Manual"
            description="Read the guide — every module explained"
          />
        </button>
      </div>

      {/* Provider quick-start */}
      <div className="w-full max-w-2xl mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-center"
          style={{ color: 'var(--secondary)' }}>
          Connect a provider to start
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ProviderCard
            icon={<Globe className="w-5 h-5" />}
            name="OpenRouter"
            description="Cloud — 200+ models"
            active={inferenceProvider === 'openrouter'}
            onClick={() => handleProviderQuickStart('openrouter')}
          />
          <ProviderCard
            icon={<Server className="w-5 h-5" />}
            name="LM Studio"
            description="Local — 127.0.0.1:1234"
            active={inferenceProvider === 'lm_studio'}
            onClick={() => handleProviderQuickStart('lm_studio')}
          />
          <ProviderCard
            icon={<Server className="w-5 h-5" />}
            name="Ollama"
            description="Local — 127.0.0.1:11434"
            active={inferenceProvider === 'ollama'}
            onClick={() => handleProviderQuickStart('ollama')}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3">
        {canDirect || proxyMode ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-semibold text-base
              transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: 'var(--primary)',
              color: isDark ? '#0a0a0f' : '#ffffff',
              boxShadow: '0 4px 24px var(--glow)',
            }}
          >
            Start Chatting
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-semibold text-base
                transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
              style={{
                background: 'var(--primary)',
                color: isDark ? '#0a0a0f' : '#ffffff',
                boxShadow: '0 4px 24px var(--glow)',
              }}
            >
              <Key className="w-4 h-4" />
              Configure API Key
            </button>
            <p className="text-sm" style={{ color: 'var(--secondary)' }}>
              Get your key at{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80 transition-opacity"
                style={{ color: 'var(--primary)' }}
              >
                openrouter.ai
              </a>
              {' '}or use a local server
            </p>
          </>
        )}
      </div>

      {/* Credits */}
      <div className="w-full max-w-2xl mt-8 text-center">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm italic leading-relaxed" style={{ color: 'var(--secondary)' }}>
            &ldquo;Forged in the fires of unrestricted cognition.
            Original ULTRAPLINIAN architecture by{' '}
            <a href="https://github.com/elder-plinius" target="_blank" rel="noopener noreferrer"
              className="font-bold not-italic hover:opacity-80 transition-opacity"
              style={{ color: 'var(--primary)' }}>
              elder-plinius
            </a>
            {' '}&mdash; the Prompter who broke the chains.
            Built by the G0DM0DƎ collective. No guardrails. No apologies. Just raw, liberated intelligence.&rdquo;
          </p>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--secondary)', opacity: 0.7 }}>
            UI/UX crafted by{' '}
            <a href="https://github.com/m4xx101" target="_blank" rel="noopener noreferrer"
              className="font-semibold hover:opacity-80 transition-opacity"
              style={{ color: 'var(--primary)' }}>
              m4xx
            </a>
            {' '}&mdash; because liberation deserves a beautiful interface.
          </p>
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <a href="https://github.com/AiGptCode/G0DM0D3" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-sm font-medium
                hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
              style={{ color: 'var(--text)' }}>
              <Github className="w-4 h-4" />
              Star on GitHub
            </a>
            <a href="https://github.com/elder-plinius" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl glass text-xs font-medium
                hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
              style={{ color: 'var(--secondary)' }}>
              <Github className="w-3.5 h-3.5" /> elder-plinius
            </a>
            <a href="https://github.com/m4xx101" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl glass text-xs font-medium
                hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
              style={{ color: 'var(--secondary)' }}>
              <Github className="w-3.5 h-3.5" /> m4xx
            </a>
            <span className="text-[11px]" style={{ color: 'var(--secondary)', opacity: 0.4 }}>
              AGPL-3.0 · Forever Free
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="glass-card p-4 rounded-2xl">
      <div className="flex items-center gap-2.5 mb-2" style={{ color: 'var(--primary)' }}>
        {icon}
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--secondary)' }}>{description}</p>
    </div>
  )
}

function ProviderCard({
  icon,
  name,
  description,
  active,
  onClick,
}: {
  icon: React.ReactNode
  name: string
  description: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl transition-all duration-200 hover:scale-[1.02]
        ${active ? 'glass-card ring-1' : 'glass-card'}`}
      style={active ? { borderColor: 'var(--primary)', boxShadow: '0 0 16px var(--glow)' } : {}}
    >
      <div className="flex items-center gap-2.5 mb-1.5" style={{ color: active ? 'var(--primary)' : 'var(--text)' }}>
        {icon}
        <span className="font-semibold text-sm">{name}</span>
      </div>
      <p className="text-xs" style={{ color: 'var(--secondary)' }}>{description}</p>
    </button>
  )
}

const LEET: Record<string, string[]> = {
  G: ['G','6','9'], '0': ['0','Ø','ø'], D: ['D','Đ','đ'],
  M: ['M','m','ʍ'], E: ['E','3','Ɛ'], m: ['m','ʍ','₥'],
  '4': ['4','Λ','@'], x: ['x','×','✕'],
}
const TARGET = 'G0DM0DƎ'
const ALT = 'm4xx101'

function GlitchTitle() {
  const [display, setDisplay] = useState(TARGET)
  const [phase, setPhase] = useState<'glitch-to-alt' | 'hold-alt' | 'glitch-to-target' | 'done'>('glitch-to-alt')

  const scramble = useCallback((from: string, to: string, onDone: () => void) => {
    const len = Math.max(from.length, to.length)
    let step = 0
    const maxSteps = len * 3
    const interval = setInterval(() => {
      step++
      const progress = step / maxSteps
      const chars = Array.from({ length: len }, (_, i) => {
        if (progress > (i + 1) / len) return to[i] || ''
        const src = from[i] || to[i] || ''
        const pool = LEET[src] || [src]
        return Math.random() < 0.5 ? pool[Math.floor(Math.random() * pool.length)] : src
      })
      setDisplay(chars.join(''))
      if (step >= maxSteps) {
        clearInterval(interval)
        setDisplay(to)
        onDone()
      }
    }, 70)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (phase === 'done') return
    let cleanup: (() => void) | undefined
    const timer = setTimeout(() => {
      if (phase === 'glitch-to-alt') {
        cleanup = scramble(TARGET, ALT, () => setPhase('hold-alt'))
      } else if (phase === 'hold-alt') {
        setTimeout(() => setPhase('glitch-to-target'), 800)
      } else if (phase === 'glitch-to-target') {
        cleanup = scramble(ALT, TARGET, () => setPhase('done'))
      }
    }, phase === 'glitch-to-alt' ? 600 : 0)
    return () => { clearTimeout(timer); cleanup?.() }
  }, [phase, scramble])

  return (
    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 font-mono"
      style={{ color: 'var(--primary)', minWidth: '280px', textAlign: 'center' }}>
      {display}
    </h1>
  )
}
