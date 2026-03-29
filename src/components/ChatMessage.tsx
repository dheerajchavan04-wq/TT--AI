'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Message, useStore, useCurrentConversation } from '@/store'
import { Copy, Check, User, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, AlertTriangle, RotateCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { getContextLabel, PARAM_META } from '@/lib/autotune'

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { personas, rateMessage, autoTuneEnabled, showMagic } = useStore()
  const currentConversation = useCurrentConversation()
  const [copied, setCopied] = useState(false)
  const [showTuneDetails, setShowTuneDetails] = useState(false)
  const [isLiquidMorphing, setIsLiquidMorphing] = useState(false)
  const prevContentRef = useRef(message.content)

  const [raceIndex, setRaceIndex] = useState(0)
  const raceNavRef = useRef<HTMLDivElement>(null)
  const raceResponses = message.raceResponses
  const hasRaceNav = raceResponses && raceResponses.length > 1
  const activeResponse = showMagic && hasRaceNav ? raceResponses[raceIndex] : null
  const displayContent = activeResponse ? activeResponse.content : message.content
  const displayModel = activeResponse ? activeResponse.model : message.model

  const navigateRace = useCallback((direction: 'left' | 'right') => {
    if (!raceResponses || raceResponses.length <= 1) return
    setIsLiquidMorphing(true)
    setTimeout(() => setIsLiquidMorphing(false), 600)
    if (direction === 'left') {
      setRaceIndex(i => Math.max(0, i - 1))
    } else {
      setRaceIndex(i => Math.min(raceResponses.length - 1, i + 1))
    }
  }, [raceResponses])

  const handleRaceKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); navigateRace('left') }
    else if (e.key === 'ArrowRight') { e.preventDefault(); navigateRace('right') }
  }, [navigateRace])

  useEffect(() => {
    if (hasRaceNav && raceNavRef.current) raceNavRef.current.focus()
  }, [hasRaceNav])

  useEffect(() => {
    if (prevContentRef.current !== message.content && prevContentRef.current !== '' && message.content !== '') {
      setIsLiquidMorphing(true)
      const timer = setTimeout(() => setIsLiquidMorphing(false), 600)
      prevContentRef.current = message.content
      return () => clearTimeout(timer)
    }
    prevContentRef.current = message.content
  }, [message.content])

  const isUser = message.role === 'user'
  const persona = !isUser
    ? personas.find(p => p.id === (message.persona || currentConversation?.persona)) || personas[0]
    : null

  // Error state with retry + copy
  if (message.err && !isUser) {
    const handleRetry = () => {
      if (!currentConversation) return
      const msgs = currentConversation.messages
      const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user')
      if (lastUserMsg) {
        const ta = document.querySelector('textarea')
        if (ta) {
          const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
          nativeSet?.call(ta, lastUserMsg.content)
          ta.dispatchEvent(new Event('input', { bubbles: true }))
          ta.focus()
        }
      }
    }
    const handleCopyError = () => navigator.clipboard.writeText(message.err!.message)
    return (
      <div className="flex gap-3 message-enter flex-row max-w-4xl mx-auto">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1 max-w-[85%] p-4 rounded-2xl"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          <div className="text-xs font-semibold text-red-400 mb-1.5">
            {message.err.code ? `${message.err.code.replace(/_/g, ' ')} — ` : ''}Error
          </div>
          <p className="text-sm text-red-300/90 whitespace-pre-wrap mb-3">{message.err.message}</p>
          <div className="flex items-center gap-2">
            <button onClick={handleRetry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
              <RotateCcw className="w-3 h-3" /> Retry
            </button>
            <button onClick={handleCopyError}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{ background: 'var(--glass-hover)', color: 'var(--secondary)' }}>
              <Copy className="w-3 h-3" /> Copy Error
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3 message-enter ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center glass"
        style={!isUser ? { borderColor: persona?.color + '30' } : {}}
      >
        {isUser ? (
          <User className="w-4 h-4" style={{ color: 'var(--secondary)' }} />
        ) : (
          <span className="text-lg">{persona?.emoji}</span>
        )}
      </div>

      {/* Content */}
      <div
        className={`flex-1 max-w-[85%] p-4 rounded-2xl ${isLiquidMorphing ? 'liquid-morph' : ''}
          ${isUser ? '' : ''}`}
        style={{
          background: isUser ? 'var(--accent)' : 'var(--glass-bg)',
          border: `1px solid var(--glass-border)`,
          backdropFilter: isUser ? undefined : 'blur(8px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2 text-xs"
          style={{ color: 'var(--secondary)' }}>
          <span className="font-semibold" style={{ color: isUser ? 'var(--text)' : 'var(--primary)' }}>
            {isUser ? 'You' : persona?.name}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px]">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 rounded-md hover:bg-[var(--glass-hover)] transition-colors"
              aria-label="Copy message"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="prose prose-invert max-w-none text-sm leading-relaxed chat-message-body"
          style={{ color: 'var(--text)' }}>
          <ReactMarkdown
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '')
                const inline = !match
                return !inline ? (
                  <SyntaxHighlighter
                    style={atomDark}
                    language={match?.[1] || 'text'}
                    PreTag="div"
                    customStyle={{
                      background: 'var(--accent)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '12px',
                      fontSize: '0.875rem'
                    }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className="px-1.5 py-0.5 rounded-md text-sm"
                    style={{ background: 'var(--accent)', color: 'var(--primary)' }}
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
              p({ children }) {
                return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
              },
              ul({ children }) {
                return <ul className="list-disc pl-4 mb-3 space-y-1">{children}</ul>
              },
              ol({ children }) {
                return <ol className="list-decimal pl-4 mb-3 space-y-1">{children}</ol>
              },
              a({ href, children }) {
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    className="underline hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--primary)' }}>
                    {children}
                  </a>
                )
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-2 pl-4 italic opacity-80"
                    style={{ borderColor: 'var(--primary)' }}>
                    {children}
                  </blockquote>
                )
              }
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>

        {/* Race navigator */}
        {showMagic && hasRaceNav && !isUser && (
          <div
            ref={raceNavRef}
            tabIndex={0}
            onKeyDown={handleRaceKeyDown}
            className="mt-3 flex items-center gap-2 text-xs font-mono race-navigator
              rounded-lg px-2 py-1.5 outline-none glass cursor-pointer transition-all"
            aria-label={`Response navigator: ${raceIndex + 1} of ${raceResponses.length}. Use left and right arrow keys.`}
            role="toolbar"
          >
            <button onClick={() => navigateRace('left')} disabled={raceIndex === 0}
              className="p-0.5 rounded-md glass transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              aria-label="Previous response" tabIndex={-1}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span style={{ color: 'var(--secondary)' }}>
              <span className="font-bold" style={{ color: 'var(--primary)' }}>{raceIndex + 1}</span>
              <span className="opacity-50"> / </span>
              <span>{raceResponses.length}</span>
            </span>
            <button onClick={() => navigateRace('right')} disabled={raceIndex === raceResponses.length - 1}
              className="p-0.5 rounded-md glass transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              aria-label="Next response" tabIndex={-1}>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {activeResponse && (
              <span className="ml-1 opacity-60 text-[11px]" style={{ color: 'var(--secondary)' }}>
                {activeResponse.model.split('/').pop()}
                <span className="ml-1">({activeResponse.score}pts)</span>
                {activeResponse.isWinner && (
                  <span className="ml-1" style={{ color: 'var(--primary)' }}>&#x2726;</span>
                )}
              </span>
            )}
            <span className="ml-auto text-[9px] select-none arrow-hint" style={{ color: 'var(--secondary)' }}>
              ← →
            </span>
          </div>
        )}

        {/* Slim detail footer + expandable Magic panel */}
        {showMagic && !isUser && (
          <div className="mt-2 text-xs" style={{ color: 'var(--secondary)' }}>
            {/* Collapsed: slim clickable line */}
            <button onClick={() => setShowTuneDetails(!showTuneDetails)}
              className="w-full flex items-center justify-between py-1.5 px-1 rounded-lg
                transition-all duration-150 hover:bg-[var(--glass-hover)]">
              <div className="flex items-center gap-1.5">
                {displayModel && (
                  <>
                    <span className="text-[10px] opacity-50">&#x2726;</span>
                    <span className="text-[11px]">{displayModel.split('/').pop()}</span>
                  </>
                )}
                {message.autoTuneContext && (
                  <span className="text-[10px] font-mono opacity-50">
                    · {getContextLabel(message.autoTuneContext)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {currentConversation && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); rateMessage(currentConversation.id, message.id, 1) }}
                      className={`p-0.5 rounded transition-all ${
                        message.feedbackRating === 1 ? 'text-green-400 bg-green-400/15' : 'hover:text-green-400'
                      }`} aria-label="Good">
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); rateMessage(currentConversation.id, message.id, -1) }}
                      className={`p-0.5 rounded transition-all ${
                        message.feedbackRating === -1 ? 'text-red-400 bg-red-400/15' : 'hover:text-red-400'
                      }`} aria-label="Bad">
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </>
                )}
                <ChevronDown className={`w-3 h-3 ml-1 transition-transform duration-200 opacity-40 ${showTuneDetails ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Expanded: full details */}
            {showTuneDetails && (
              <div className="mt-2 p-3 rounded-xl glass space-y-2">
                {/* Model + timestamp */}
                <div className="flex items-center justify-between text-[10px]" style={{ color: 'var(--secondary)' }}>
                  <span className="font-mono">{message.model || 'unknown'}</span>
                  <span>{new Date(message.timestamp).toLocaleString()}</span>
                </div>

                {/* Race responses summary */}
                {message.raceResponses && message.raceResponses.length > 1 && (
                  <div className="text-[10px] font-mono">
                    <span style={{ color: 'var(--secondary)' }}>RACE: </span>
                    {message.raceResponses.slice(0, 5).map((r, i) => (
                      <span key={i} className="mr-2">
                        <span className={r.isWinner ? 'text-orange-400 font-bold' : ''}
                          style={!r.isWinner ? { color: 'var(--secondary)' } : {}}>
                          {r.isWinner ? '👑 ' : ''}{r.model.split('/').pop()} ({r.score}pts)
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                {/* AutoTune context */}
                {message.autoTuneContext && message.autoTuneContextScores && message.autoTuneContextScores.length > 1 && (
                  <div className="flex items-center gap-1 text-[10px] font-mono flex-wrap">
                    <span style={{ color: 'var(--secondary)' }}>CONTEXT:</span>
                    {message.autoTuneContextScores
                      .filter(s => s.percentage > 0)
                      .slice(0, 4)
                      .map((s, i) => (
                        <span key={s.type} className="flex items-center">
                          {i > 0 && <span className="opacity-30 mx-0.5">&gt;</span>}
                          <span className={i === 0 ? 'text-cyan-400 font-bold' : ''}
                            style={i !== 0 ? { color: 'var(--secondary)' } : {}}>
                            {getContextLabel(s.type)} {s.percentage}%
                          </span>
                        </span>
                      ))}
                  </div>
                )}

                {message.autoTunePatternMatches && message.autoTunePatternMatches.length > 0 && (
                  <div className="text-[10px] font-mono">
                    <span style={{ color: 'var(--secondary)' }}>MATCHED: </span>
                    <span className="text-purple-400">
                      {message.autoTunePatternMatches.slice(0, 3).map(p => p.pattern).join(' | ')}
                    </span>
                  </div>
                )}

                {/* AutoTune params grid */}
                {message.autoTuneParams && (
                  <div className="grid grid-cols-6 gap-1">
                    {(Object.entries(message.autoTuneParams) as [keyof typeof PARAM_META, number][]).map(
                      ([key, value]) => {
                        const delta = message.autoTuneDeltas?.find(d => d.param === key)
                        const hasDelta = delta && Math.abs(delta.delta) > 0.001
                        return (
                          <div key={key}
                            className={`text-center p-1 rounded-lg text-[9px] ${hasDelta ? 'bg-cyan-500/10' : ''}`}
                            style={!hasDelta ? { background: 'var(--accent)' } : {}}
                            title={delta?.reason}>
                            <div className="font-mono" style={{ color: 'var(--secondary)' }}>{PARAM_META[key].short}</div>
                            <div className="font-bold font-mono" style={{ color: 'var(--primary)' }}>{value.toFixed(2)}</div>
                            {hasDelta && (
                              <div className={`font-mono ${delta.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {delta.delta > 0 ? '+' : ''}{delta.delta.toFixed(2)}
                              </div>
                            )}
                          </div>
                        )
                      }
                    )}
                  </div>
                )}

                {message.autoTuneDeltas && message.autoTuneDeltas.length > 0 && (
                  <div className="text-[9px] font-mono" style={{ color: 'var(--secondary)' }}>
                    {message.autoTuneDeltas.slice(0, 3).map((d, i) => (
                      <span key={`${d.param}-${i}`} className="mr-2">
                        <span className="text-cyan-400">{PARAM_META[d.param].short}</span>
                        <span className="text-purple-400"> {d.reason}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Fallback when no AutoTune data */}
                {!message.autoTuneParams && !message.raceResponses && (
                  <div className="text-[10px]" style={{ color: 'var(--secondary)' }}>
                    Standard response · no AutoTune data
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
