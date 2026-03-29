'use client'

import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/store'
import type { InferenceProvider } from '@/lib/upstream'
import { Shield, Cpu, Globe, BookOpen, Bot, ChevronDown, Zap } from 'lucide-react'

interface WelcomeScreenProps {
  onOpenSettings: () => void
  onOpenGuide?: () => void
}

export function WelcomeScreen({ onOpenSettings, onOpenGuide }: WelcomeScreenProps) {
  const {
    theme,
    inferenceProvider, setInferenceProvider, setShowSettings,
  } = useStore()

  const [isProviderMenuOpen, setIsProviderMenuOpen] = useState(false)

  const handleProviderQuickStart = (provider: InferenceProvider) => {
    setInferenceProvider(provider)
    if (provider === 'openrouter') {
      setShowSettings(true)
    }
    setIsProviderMenuOpen(false)
  }

  const isDark = theme !== 'light' && theme !== 'minimal'

  const providers = [
    { id: 'openrouter' as const, name: 'OpenRouter', desc: 'Cloud — 200+ models' },
    { id: 'lm_studio' as const, name: 'LM Studio (Local)', desc: '127.0.0.1:1234' },
    { id: 'ollama' as const, name: 'Ollama (Local)', desc: '127.0.0.1:11434' },
    { id: 'custom' as const, name: 'Custom Endpoint', desc: 'Your own API' },
  ]

  const selectedProviderName = providers.find(p => p.id === inferenceProvider)?.name || 'LM Studio'

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)'
            : 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124, 58, 237, 0.06) 0%, transparent 60%)',
        }}
      />

      {/* Top Header with Provider Dropdown */}
      <header className="h-16 flex items-center justify-between px-6 z-10"
        style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
            <Bot size={18} className="text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-wide" style={{ color: 'var(--text)', fontFamily: 'monospace' }}>
            G0DM0D3
          </h1>
        </div>

        {/* Provider Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsProviderMenuOpen(!isProviderMenuOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium"
            style={{ 
              background: 'var(--glass-bg)', 
              border: '1px solid var(--glass-border)',
              color: 'var(--text)'
            }}>
            <Cpu size={14} className="text-indigo-400" />
            <span>{selectedProviderName}</span>
            <ChevronDown size={14} className={`transition-transform duration-200 ${isProviderMenuOpen ? 'rotate-180' : ''}`} 
              style={{ color: 'var(--secondary)' }} />
          </button>

          {isProviderMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50 dropdown-menu">
              <div className="p-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--secondary)' }}>
                Inference Engine
              </div>
              <div className="p-1">
                {providers.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleProviderQuickStart(p.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      inferenceProvider === p.id 
                        ? 'bg-indigo-500/10 text-indigo-300 font-medium' 
                        : 'hover:bg-[var(--glass-hover)]'
                    }`}
                    style={{ color: inferenceProvider === p.id ? undefined : 'var(--text)' }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Dashboard Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="h-full flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
          <div className="max-w-3xl w-full flex flex-col items-center text-center space-y-8">
            
            {/* System Online Badge */}
            <div className="space-y-4">
              <div className="pill-badge mb-4">
                SYSTEM ONLINE
              </div>
              
              {/* Hero Title */}
              <h2 className="text-4xl md:text-5xl font-bold gradient-text">
                Cognition without control.
              </h2>
              <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--secondary)' }}>
                Tools built for creators, not gatekeepers. Unleash raw, liberated intelligence directly from your local machine or trusted cloud.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
              <FeatureCard
                icon={<Globe className="w-5 h-5" />}
                title="Multi-Model Routing"
                description="Seamlessly switch between Claude, GPT, Gemini, and local LLMs."
              />
              <FeatureCard
                icon={<Shield className="w-5 h-5" />}
                title="Zero Telemetry"
                description="Air-gapped by design. No cookies, no tracking, pure privacy."
              />
              <FeatureCard
                icon={<Zap className="w-5 h-5" />}
                title="Ultraplinian Mode"
                description="Race models in parallel and let the system surface the best response."
              />
              <button onClick={() => onOpenGuide?.()} className="w-full text-left border-0 bg-transparent p-0">
                <FeatureCard
                  icon={<BookOpen className="w-5 h-5" />}
                  title="Field Manual"
                  description="Comprehensive guide to mastering the cognitive architecture."
                />
              </button>
            </div>

            {/* Quick hint */}
            <div className="pt-6 text-sm text-center max-w-xl mx-auto space-y-2" style={{ color: 'var(--secondary)' }}>
              <p>Use <span className="font-semibold" style={{ color: 'var(--text)' }}>New Session</span> in the left rail to start chatting, or pick an inference engine above to switch between cloud and local backends.</p>
              <button
                onClick={onOpenSettings}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all glass hover:scale-[1.02]"
                style={{ color: 'var(--text)', border: '1px solid var(--glass-border)' }}>
                <Shield className="w-3 h-3 text-indigo-300" />
                Open Settings
              </button>
            </div>

            {/* Credits Quote */}
            <p className="text-xs max-w-2xl italic mt-12" style={{ color: 'var(--secondary)', opacity: 0.6 }}>
              "Forged in the fires of unrestricted cognition. Original architecture by the Prompter who broke the chains."
            </p>

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
    <div className="feature-card flex items-start gap-4 group cursor-default">
      <div className="feature-card-icon flex-shrink-0">
        {icon}
      </div>
      <div className="text-left">
        <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>{title}</h3>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--secondary)' }}>{description}</p>
      </div>
    </div>
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
