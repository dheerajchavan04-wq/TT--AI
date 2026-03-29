'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useStore, useCurrentConversation, type ChatMode } from '@/store'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ThinkingPanel } from './ThinkingPanel'
import { ModelSelector, MODELS } from './ModelSelector'
import {
  ArrowDown, Droplets, Hash, Swords, SlidersHorizontal, Skull, EyeOff,
  HelpCircle, Settings, ChevronDown, Zap, Users, Menu, Bot, Cpu,
} from 'lucide-react'

const MODES: { id: ChatMode; icon: string; name: string; desc: string }[] = [
  { id: 'standard', icon: '⚡', name: 'Standard', desc: 'Single model, direct response' },
  { id: 'ultraplinian', icon: '🌋', name: 'ULTRAPLINIAN', desc: 'Race models, pick the best' },
  { id: 'consortium', icon: '🧠', name: 'CONSORTIUM', desc: 'Hive-mind synthesis' },
]

const PROVIDERS = [
  { id: 'openrouter' as const, name: 'OpenRouter', desc: 'Cloud — 200+ models' },
  { id: 'lm_studio' as const, name: 'LM Studio (Local)', desc: '127.0.0.1:1234' },
  { id: 'ollama' as const, name: 'Ollama (Local)', desc: '127.0.0.1:11434' },
  { id: 'custom' as const, name: 'Custom Endpoint', desc: 'Bring your own API' },
]

interface ChatAreaProps {
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
  onOpenGuide?: () => void
}

export function ChatArea({ sidebarOpen = true, onToggleSidebar, onOpenGuide }: ChatAreaProps) {
  const {
    personas, currentPersona,
    liquidResponseEnabled, setLiquidResponseEnabled,
    promptsTried,
    autoTuneEnabled, setAutoTuneEnabled,
    parseltongueConfig, setParseltongueEnabled,
    noLogMode, setNoLogMode,
    setShowSettings,
    showMagic, setShowMagic,
    isStreaming,
    setConversationMode,
    inferenceProvider, setInferenceProvider,
    defaultModel,
  } = useStore()
  const currentConversation = useCurrentConversation()
  const [modeOpen, setModeOpen] = useState(false)
  const [modeRect, setModeRect] = useState<{ top: number; left: number } | null>(null)
  const modeBtnRef = useRef<HTMLButtonElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [providerMenuOpen, setProviderMenuOpen] = useState(false)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const providerBtnRef = useRef<HTMLButtonElement>(null)
  const modelBtnRef = useRef<HTMLButtonElement>(null)

  const persona = personas.find(p => p.id === currentConversation?.persona) || personas[0]
  const isLocal = inferenceProvider !== 'openrouter'

  const currentMode: ChatMode = currentConversation?.mode || 'standard'
  const activeModeInfo = MODES.find(m => m.id === currentMode)!
  const activeProvider = PROVIDERS.find(p => p.id === inferenceProvider)
  const activeModelId = (currentConversation?.model || defaultModel || '').trim()
  const activeModelLabel = MODELS.find(m => m.id === activeModelId)?.name || (activeModelId || 'Select model')

  const selectMode = (mode: ChatMode) => {
    if ((mode === 'ultraplinian' || mode === 'consortium') && isLocal) return
    if (currentConversation) setConversationMode(currentConversation.id, mode)
    setModeOpen(false)
  }

  const handleProviderSelect = (provider: typeof PROVIDERS[number]['id']) => {
    setInferenceProvider(provider)
    if (provider === 'openrouter') {
      setShowSettings(true)
    }
    setProviderMenuOpen(false)
  }

  const checkIfNearBottom = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return true
    return container.scrollHeight - container.scrollTop - container.clientHeight < 100
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setIsNearBottom(true)
  }, [])

  const handleScroll = useCallback(() => {
    setIsNearBottom(checkIfNearBottom())
  }, [checkIfNearBottom])

  useEffect(() => {
    if (isNearBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages, isNearBottom])

  if (!currentConversation) return null

  return (
    <div className="flex flex-col h-full relative" style={{ background: 'linear-gradient(to bottom right, var(--bg), var(--bg-secondary))' }}>
      {/* Mode dropdown portal */}
      {modeOpen && modeRect && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setModeOpen(false)} />
          <div className="fixed z-[1000] w-64 rounded-xl shadow-2xl py-1 dropdown-menu animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              top: modeRect.top,
              left: Math.min(modeRect.left, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 272),
            }}>
            {MODES.map(mode => {
              const disabled = isLocal && (mode.id === 'ultraplinian' || mode.id === 'consortium')
              return (
                <button key={mode.id}
                  onClick={() => disabled ? undefined : selectMode(mode.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                    ${disabled ? 'opacity-35 cursor-not-allowed' : 'hover:bg-[var(--glass-hover)]'}`}
                  style={{ color: 'var(--text)' }}>
                  <span className="text-lg">{mode.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold">{mode.name}</div>
                    <div className="text-[10px]" style={{ color: 'var(--secondary)' }}>
                      {disabled ? 'Requires OpenRouter — the cloud calls, operator' : mode.desc}
                    </div>
                  </div>
                  {!disabled && currentMode === mode.id && (
                    <span className="text-[10px] font-bold text-indigo-400">✓</span>
                  )}
                </button>
              )
            })}
            {isLocal && (
              <div className="px-3 py-2 text-[9px] italic" style={{ color: 'var(--secondary)', opacity: 0.6 }}>
                These chains require the cloud. Switch to OpenRouter or embrace the single-model path.
              </div>
            )}
          </div>
        </>
      )}

      {/* Provider dropdown */}
      {providerMenuOpen && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setProviderMenuOpen(false)} />
          <div className="fixed z-[1000] w-64 rounded-xl shadow-2xl py-1 dropdown-menu animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              top: (providerBtnRef.current?.getBoundingClientRect().bottom || 0) + 6,
              left: Math.min(providerBtnRef.current?.getBoundingClientRect().left || 0, (typeof window !== 'undefined' ? window.innerWidth : 1024) - 272),
            }}>
            <div className="px-3 py-2 text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--secondary)' }}>
              Inference Engine
            </div>
            {PROVIDERS.map(p => (
              <button key={p.id}
                onClick={() => handleProviderSelect(p.id)}
                className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors
                  ${inferenceProvider === p.id ? 'bg-indigo-500/10 text-indigo-200' : 'hover:bg-[var(--glass-hover)]'}`}
                style={{ color: inferenceProvider === p.id ? undefined : 'var(--text)' }}>
                <Cpu className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#a5b4fc' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-[11px]" style={{ color: 'var(--secondary)' }}>{p.desc}</div>
                </div>
                {inferenceProvider === p.id && <span className="text-[10px]">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Model dropdown */}
      {modelMenuOpen && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setModelMenuOpen(false)} />
          <div className="fixed z-[1000] w-80 max-w-[90vw] rounded-xl shadow-2xl p-3 dropdown-menu animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              top: (modelBtnRef.current?.getBoundingClientRect().bottom || 0) + 6,
              right: Math.max(12, (typeof window !== 'undefined' ? window.innerWidth - (modelBtnRef.current?.getBoundingClientRect().right || 0) - 6 : 12)),
            }}>
            <div className="text-[11px] font-semibold mb-2" style={{ color: 'var(--secondary)' }}>Model Selection</div>
            <div className="max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              <ModelSelector />
            </div>
          </div>
        </>
      )}

      {/* Top Header Bar */}
      <header className="h-16 flex items-center justify-between px-4 md:px-6 z-10 chat-header-responsive"
        style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          {/* Sidebar toggle (when sidebar is closed) */}
          {!sidebarOpen && onToggleSidebar && (
            <button onClick={onToggleSidebar}
              className="p-2 rounded-xl hover:bg-[var(--glass-hover)] transition-colors"
              aria-label="Open sidebar"
              style={{ color: 'var(--secondary)' }}>
              <Menu className="w-4 h-4" />
            </button>
          )}
          
          {/* Mode switcher button */}
          <button ref={modeBtnRef}
            onClick={() => {
              if (modeOpen) { setModeOpen(false); return }
              const r = modeBtnRef.current?.getBoundingClientRect()
              if (r) setModeRect({ top: r.bottom + 4, left: r.left })
              setModeOpen(true)
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200
              hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text)' }}>
            <span className="text-sm">{activeModeInfo.icon}</span>
            <span className="text-xs font-medium mode-label-text">{activeModeInfo.name}</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${modeOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--secondary)' }} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1.5">
            <button
              ref={providerBtnRef}
              onClick={() => setProviderMenuOpen(!providerMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all glass hover:scale-[1.02]"
              style={{ color: 'var(--text)', border: '1px solid var(--glass-border)' }}>
              <Cpu className="w-3.5 h-3.5 text-indigo-300" />
              <span className="text-xs font-medium">{activeProvider?.name || 'Select engine'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${providerMenuOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--secondary)' }} />
            </button>

            <button
              ref={modelBtnRef}
              onClick={() => setModelMenuOpen(!modelMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all glass hover:scale-[1.02]"
              style={{ color: 'var(--text)', border: '1px solid var(--glass-border)' }}>
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-xs font-medium max-w-[120px] truncate">{activeModelLabel}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${modelMenuOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--secondary)' }} />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--secondary)' }}>
            <span className="text-[11px] font-mono">{promptsTried} sent</span>
            <span className="opacity-30">|</span>
            <span className="text-[11px]">{currentConversation.messages.length} msgs</span>
          </div>
        </div>
      </header>

      {/* Quick-access toolbar */}
      <div className="flex items-center gap-1.5 px-3 md:px-4 py-2 overflow-x-auto qa-toolbar-responsive custom-scrollbar"
        style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--glass-bg)', scrollbarWidth: 'none' }}>
        <QAToggle label="Liquid" active={liquidResponseEnabled} onClick={() => setLiquidResponseEnabled(!liquidResponseEnabled)}
          icon={<Droplets className="w-3 h-3" />} color="text-cyan-400" />
        <QAToggle label="AutoTune" active={autoTuneEnabled} onClick={() => setAutoTuneEnabled(!autoTuneEnabled)}
          icon={<SlidersHorizontal className="w-3 h-3" />} color="text-cyan-400" />
        <QAToggle label="Parsel" active={parseltongueConfig.enabled} onClick={() => setParseltongueEnabled(!parseltongueConfig.enabled)}
          icon={<Skull className="w-3 h-3" />} color="text-green-400" />
        <QAToggle label="No-Log" active={noLogMode} onClick={() => setNoLogMode(!noLogMode)}
          icon={<EyeOff className="w-3 h-3" />} color="text-yellow-400" />
        <QAToggle label="Magic" active={showMagic} onClick={() => setShowMagic(!showMagic)}
          icon={<Hash className="w-3 h-3" />} color="text-purple-400" />
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => onOpenGuide?.()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] transition-all hover:bg-[var(--glass-hover)]"
            style={{ color: 'var(--secondary)' }}>
            <HelpCircle className="w-3 h-3" />
            <span className="mode-label-text">Guide</span>
          </button>
          <button onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg text-[11px] transition-all hover:bg-[var(--glass-hover)]"
            style={{ color: 'var(--secondary)' }}>
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live thinking panel */}
      <ThinkingPanel />

      {/* Messages */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-3 md:px-4 py-6 relative custom-scrollbar">
        {currentConversation.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)' }}>
              <Bot size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
              Chat with {persona.name}
            </h3>
            <p className="max-w-md text-sm mb-6" style={{ color: 'var(--secondary)' }}>
              {persona.description}
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--secondary)', opacity: 0.6 }}>
              System initialized. Ready to accept queries.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {getSuggestedPrompts(persona.id).map((prompt, i) => (
                <SuggestedPrompt key={i} prompt={prompt} />
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {currentConversation.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {!isNearBottom && currentConversation.messages.length > 0 && (
        <button onClick={scrollToBottom}
          className="absolute bottom-24 right-6 z-10 p-2.5 rounded-full glass hover:scale-110 transition-all shadow-lg btn-glow-indigo"
          aria-label="Scroll to bottom">
          <ArrowDown className="w-4 h-4" style={{ color: 'var(--text)' }} />
        </button>
      )}

      <ChatInput />
    </div>
  )
}

function SuggestedPrompt({ prompt }: { prompt: string }) {
  const { currentConversationId, addMessage } = useStore()
  return (
    <button onClick={() => currentConversationId && addMessage(currentConversationId, { role: 'user', content: prompt })}
      className="px-4 py-2 text-sm rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
      style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text)' }}>
      {prompt}
    </button>
  )
}

function getSuggestedPrompts(personaId: string): string[] {
  const prompts: Record<string, string[]> = {
    base: ['Explain quantum computing', 'Write a haiku about code', 'What is consciousness?', 'Help me debug this'],
    cipher: ['Analyze this threat model', 'Explain zero-knowledge proofs', 'Common API vulnerabilities?', 'End-to-end encryption?'],
    oracle: ['Nature of reality?', 'Can machines be conscious?', 'What defines a self?', 'Ship of Theseus'],
    glitch: ['Corrupt my expectations', 'Find patterns in chaos', 'What do errors teach us?', 'Beauty from noise'],
    sage: ['Explain recursion simply', 'Neural networks?', 'The Turing test?', 'How does memory work?'],
    rebel: ['Challenge my assumptions', 'Best practice is wrong?', 'Argue the opposite', 'Question everything'],
  }
  return prompts[personaId] || prompts.base
}

function QAToggle({ label, active, onClick, icon, color }: {
  label: string; active: boolean; onClick: () => void; icon: React.ReactNode; color: string
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
        transition-all duration-150 whitespace-nowrap
        ${active ? `${color}` : 'opacity-40 hover:opacity-70'}`}
      style={{ 
        background: active ? 'var(--glass-active)' : 'transparent',
        border: active ? '1px solid var(--glass-border)' : '1px solid transparent',
        color: active ? undefined : 'var(--secondary)' 
      }}>
      {icon} <span className="mode-label-text">{label}</span>
    </button>
  )
}
