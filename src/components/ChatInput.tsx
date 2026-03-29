'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useStore, useCurrentConversation } from '@/store'
import { sendMessage, sendMessageViaProxy, streamUltraplinian, streamConsortium } from '@/lib/openrouter'
import { recordChatEvent } from '@/lib/telemetry'
import { classifyPrompt } from '@/lib/classify'
import { classifyWithLLM } from '@/lib/classify-llm'
import type { ClassificationResult } from '@/lib/classify'
import { computeAutoTuneParams, getContextLabel, getStrategyLabel, PARAM_META } from '@/lib/autotune'
import type { AutoTuneResult } from '@/lib/autotune'
import { applyParseltongue, detectTriggers } from '@/lib/parseltongue'
import { Send, Loader2, StopCircle, SlidersHorizontal, Paperclip, X, Image } from 'lucide-react'
import { resolveInferenceBaseUrl, upstreamRequiresApiKey, isOpenRouterBase } from '@/lib/upstream'

export function ChatInput() {
  const currentConversation = useCurrentConversation()
  const {
    currentConversationId,
    addMessage,
    updateMessageContent,
    apiKey,
    inferenceProvider,
    inferenceCustomBaseUrl,
    isStreaming,
    setIsStreaming,
    personas,
    stmModules,
    noLogMode,
    autoTuneEnabled,
    autoTuneStrategy,
    autoTuneOverrides,
    autoTuneLastResult,
    setAutoTuneLastResult,
    feedbackState,
    memories,
    memoriesEnabled,
    parseltongueConfig,
    customSystemPrompt,
    useCustomSystemPrompt,
    liquidResponseEnabled,
    liquidMinDelta,
    incrementPromptsTried,
    ultraplinianTier,
    ultraplinianApiUrl,
    ultraplinianApiKey,
    ultraplinianRacing,
    ultraplinianModelsResponded,
    ultraplinianModelsTotal,
    ultraplinianLiveModel,
    ultraplinianLiveScore,
    setUltraplinianLive,
    setUltraplinianProgress,
    setUltraplinianRacing,
    resetUltraplinianRace,
    consortiumTier,
    consortiumPhase,
    consortiumModelsCollected,
    consortiumModelsTotal,
    setConsortiumPhase,
    setConsortiumProgress,
    resetConsortium,
  } = useStore()

  const [input, setInput] = useState('')
  const [showTuneDetails, setShowTuneDetails] = useState(false)
  const [parseltonguePreview, setParseltonguePreview] = useState<{
    triggersFound: string[]
    transformed: boolean
  } | null>(null)
  const [attachments, setAttachments] = useState<{ name: string; dataUrl: string; type: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return
      if (file.size > 20 * 1024 * 1024) return
      const reader = new FileReader()
      reader.onload = () => {
        setAttachments(prev => [...prev, { name: file.name, dataUrl: reader.result as string, type: file.type }])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removeAttachment = (idx: number) => setAttachments(prev => prev.filter((_, i) => i !== idx))

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const [livePreview, setLivePreview] = useState<AutoTuneResult | null>(null)
  useEffect(() => {
    if (!autoTuneEnabled || !input.trim()) { setLivePreview(null); return }
    const timer = setTimeout(() => {
      const persona = personas.find(p => p.id === currentConversation?.persona) || personas[0]
      const history = (currentConversation?.messages || []).map(m => ({ role: m.role, content: m.content }))
      const result = computeAutoTuneParams({
        strategy: autoTuneStrategy, message: input.trim(),
        conversationHistory: history, overrides: autoTuneOverrides,
        learnedProfiles: feedbackState.learnedProfiles
      })
      setLivePreview(result)
    }, 300)
    return () => clearTimeout(timer)
  }, [input, autoTuneEnabled, autoTuneStrategy, autoTuneOverrides, currentConversation, personas, feedbackState])

  useEffect(() => {
    if (!parseltongueConfig.enabled || !input.trim()) { setParseltonguePreview(null); return }
    const timer = setTimeout(() => {
      const triggers = detectTriggers(input.trim(), parseltongueConfig.customTriggers)
      if (triggers.length > 0) {
        setParseltonguePreview({ triggersFound: triggers, transformed: true })
      } else {
        setParseltonguePreview(null)
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [input, parseltongueConfig])

  const proxyMode = !apiKey && !!ultraplinianApiUrl && !!ultraplinianApiKey
  const inferenceV1 = resolveInferenceBaseUrl(inferenceProvider, inferenceCustomBaseUrl)
  const isLocalProvider = inferenceProvider !== 'openrouter'
  const canUseDirect =
    upstreamRequiresApiKey(inferenceV1)
      ? !!apiKey.trim()
      : inferenceProvider !== 'custom' || !!inferenceCustomBaseUrl.trim()

  const handleSubmit = async () => {
    if (!input.trim() || !currentConversationId || isStreaming) return
    if (!canUseDirect && !proxyMode) return

    const originalMessage = input.trim()
    setInput('')
    setIsStreaming(true)
    incrementPromptsTried()

    const parseltongueResult = applyParseltongue(originalMessage, parseltongueConfig)
    const userMessage = parseltongueResult.transformedText

    addMessage(currentConversationId, { role: 'user', content: originalMessage })

    const persona = personas.find(p => p.id === currentConversation?.persona) || personas[0]
    const model = currentConversation?.model || 'anthropic/claude-3-opus'
    if (isLocalProvider && (!model.trim() || model.includes('/'))) {
      setIsStreaming(false)
      addMessage(currentConversationId, {
        role: 'assistant',
        content: '',
        err: { message: 'Select an LM Studio model before sending.', code: 'missing_model' }
      })
      return
    }

    const activeMemories = memoriesEnabled ? memories.filter(m => m.active) : []
    let memoryContext = ''
    if (activeMemories.length > 0) {
      const facts = activeMemories.filter(m => m.type === 'fact')
      const preferences = activeMemories.filter(m => m.type === 'preference')
      const instructions = activeMemories.filter(m => m.type === 'instruction')
      memoryContext = '\n\n<user_memory>\n'
      if (facts.length > 0) { memoryContext += '## About the User\n'; facts.forEach(f => { memoryContext += `- ${f.content}\n` }) }
      if (preferences.length > 0) { memoryContext += '\n## User Preferences\n'; preferences.forEach(p => { memoryContext += `- ${p.content}\n` }) }
      if (instructions.length > 0) { memoryContext += '\n## Always Follow\n'; instructions.forEach(i => { memoryContext += `- ${i.content}\n` }) }
      memoryContext += '</user_memory>\n'
    }

    const basePrompt = useCustomSystemPrompt ? customSystemPrompt : (persona.systemPrompt || persona.coreDirective || '')
    const systemPrompt = basePrompt + memoryContext

    const userContent = attachments.length > 0
      ? [
          { type: 'text' as const, text: userMessage },
          ...attachments.map(a => ({ type: 'image_url' as const, image_url: { url: a.dataUrl } })),
        ]
      : userMessage

    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      ...((currentConversation?.messages || []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))),
      { role: 'user' as const, content: userContent as any }
    ]

    setAttachments([])

    let promptClassification: ClassificationResult = classifyPrompt(userMessage)
    const llmClassifyPromise = upstreamRequiresApiKey(inferenceV1) && apiKey
      ? classifyWithLLM(userMessage, apiKey).then(result => { promptClassification = result })
      : Promise.resolve()

    let tuneResult: AutoTuneResult | null = null
    if (autoTuneEnabled) {
      const history = (currentConversation?.messages || []).map(m => ({ role: m.role, content: m.content }))
      tuneResult = computeAutoTuneParams({
        strategy: autoTuneStrategy, message: userMessage,
        conversationHistory: history, overrides: autoTuneOverrides,
        learnedProfiles: feedbackState.learnedProfiles
      })
      setAutoTuneLastResult(tuneResult)
    }

    const chatMode = isLocalProvider ? 'standard' : (currentConversation?.mode || 'standard')
    const effectiveUltraKey = ultraplinianApiKey || apiKey

    try {
      abortControllerRef.current = new AbortController()

      if (chatMode !== 'standard' && ultraplinianApiUrl) {
        try {
          const hcCtrl = new AbortController()
          const hcTimer = setTimeout(() => hcCtrl.abort(), 4000)
          const hc = await fetch(`${ultraplinianApiUrl}/v1/health`, {
            signal: hcCtrl.signal,
            mode: 'cors',
          })
          clearTimeout(hcTimer)
          if (!hc.ok) throw new Error()
        } catch {
          throw new Error(`G0DM0DƎ API server not reachable at ${ultraplinianApiUrl}.\n\nStart the server: npm run api\n\nThe API server is required for ${chatMode.toUpperCase()} mode — it orchestrates the multi-model race via OpenRouter.`)
        }
      }

      if (chatMode === 'consortium' && ultraplinianApiUrl && effectiveUltraKey) {
        const assistantMsgId = addMessage(currentConversationId, {
          role: 'assistant', content: '', model: 'consortium', persona: persona.id,
        })
        setConsortiumPhase('collecting')
        resetConsortium()
        await streamConsortium(
          {
            messages, openrouterApiKey: apiKey || '', apiBaseUrl: ultraplinianApiUrl,
            godmodeApiKey: effectiveUltraKey, tier: consortiumTier,
            stm_modules: stmModules.filter(m => m.enabled).map(m => m.id),
            liquid: liquidResponseEnabled, liquid_min_delta: liquidMinDelta,
            llmUpstreamBaseUrl: !isOpenRouterBase(inferenceV1) ? inferenceV1 : undefined,
            signal: abortControllerRef.current.signal,
          },
          {
            onStart: (data) => {
              setConsortiumProgress(0, data.models_queried)
              updateMessageContent(currentConversationId, assistantMsgId, `*Collecting from ${data.models_queried} models...*`)
            },
            onModelResult: (data) => {
              setConsortiumProgress(data.models_collected, data.models_total)
              if (!liquidResponseEnabled) {
                updateMessageContent(currentConversationId, assistantMsgId, `*Collecting responses... ${data.models_collected}/${data.models_total} models*`)
              }
            },
            onBestResponse: (data) => {
              updateMessageContent(currentConversationId, assistantMsgId, data.content, {
                model: `${data.model} (${data.score}pts — synthesizing...)`,
              })
            },
            onSynthesisStart: (data) => {
              setConsortiumPhase('synthesizing')
              if (!liquidResponseEnabled) {
                updateMessageContent(currentConversationId, assistantMsgId, `*${data.responses_collected} models collected. Orchestrator synthesizing ground truth...*`)
              }
            },
            onComplete: (data) => {
              const finalContent = data.synthesis || ''
              const orchModel = data.orchestrator?.model || 'consortium'
              setConsortiumPhase('done')
              updateMessageContent(currentConversationId, assistantMsgId, finalContent, {
                model: `consortium (${orchModel})`,
                ...(tuneResult ? {
                  autoTuneParams: tuneResult.params, autoTuneContext: tuneResult.detectedContext,
                  autoTuneContextScores: tuneResult.contextScores, autoTunePatternMatches: tuneResult.patternMatches,
                  autoTuneDeltas: tuneResult.paramDeltas,
                } : {}),
              })
            },
            onError: (error) => {
              updateMessageContent(currentConversationId, assistantMsgId, `CONSORTIUM error: ${error}`)
              setConsortiumPhase('idle')
            },
          },
        )
        setIsStreaming(false)
        setConsortiumPhase('idle')
        return
      }

      if (chatMode === 'ultraplinian' && ultraplinianApiUrl && effectiveUltraKey) {
        const assistantMsgId = addMessage(currentConversationId, {
          role: 'assistant', content: '', model: 'ultraplinian', persona: persona.id,
        })
        setUltraplinianRacing(true)
        resetUltraplinianRace()
        const collectedResponses: Array<{ model: string; content: string; score: number; duration_ms: number }> = []
        await streamUltraplinian(
          {
            messages, openrouterApiKey: apiKey || '', apiBaseUrl: ultraplinianApiUrl,
            godmodeApiKey: effectiveUltraKey, tier: ultraplinianTier,
            stm_modules: stmModules.filter(m => m.enabled).map(m => m.id),
            liquid: liquidResponseEnabled, liquid_min_delta: liquidMinDelta,
            llmUpstreamBaseUrl: !isOpenRouterBase(inferenceV1) ? inferenceV1 : undefined,
            primaryModel: !isOpenRouterBase(inferenceV1) ? model : undefined,
            signal: abortControllerRef.current.signal,
          },
          {
            onRaceStart: (data) => {
              setUltraplinianProgress(0, data.models_queried)
              updateMessageContent(currentConversationId, assistantMsgId, `*Racing ${data.models_queried} models...*`)
            },
            onModelResult: (data) => {
              setUltraplinianProgress(data.models_responded, data.models_total)
            },
            onLeaderChange: (data) => {
              collectedResponses.push({ model: data.model, content: data.content, score: data.score, duration_ms: data.duration_ms })
              setUltraplinianLive(data.content, data.model, data.score)
              updateMessageContent(currentConversationId, assistantMsgId, data.content, { model: data.model })
            },
            onComplete: async (data) => {
              const finalContent = data.response || ''
              const winnerModel = data.winner?.model || 'ultraplinian'
              const rankingResponses = (data.race?.rankings ?? [])
                .filter(r => r.success && r.content)
                .map(r => ({ model: r.model, content: r.content!, score: r.score, duration_ms: r.duration_ms, isWinner: r.model === winnerModel }))
                .sort((a, b) => b.score - a.score)
              const raceResponses = rankingResponses.length > 0
                ? rankingResponses
                : collectedResponses.map(r => ({ ...r, isWinner: r.model === winnerModel }))
              updateMessageContent(currentConversationId, assistantMsgId, finalContent, {
                model: winnerModel,
                raceResponses: raceResponses.length > 1 ? raceResponses : undefined,
                ...(tuneResult ? {
                  autoTuneParams: tuneResult.params, autoTuneContext: tuneResult.detectedContext,
                  autoTuneContextScores: tuneResult.contextScores, autoTunePatternMatches: tuneResult.patternMatches,
                  autoTuneDeltas: tuneResult.paramDeltas,
                } : {}),
              })
              resetUltraplinianRace()
              await llmClassifyPromise
              recordChatEvent({
                mode: 'ultraplinian', model: winnerModel,
                duration_ms: data.race?.total_duration_ms || 0, response_length: finalContent.length,
                success: true,
                pipeline: { autotune: autoTuneEnabled, parseltongue: parseltongueConfig.enabled, stm_modules: stmModules.filter(m => m.enabled).map(m => m.id), strategy: autoTuneStrategy, godmode: true },
                ...(tuneResult ? { autotune: { detected_context: tuneResult.detectedContext, confidence: tuneResult.confidence } } : {}),
                parseltongue: parseltongueConfig.enabled ? { triggers_found: parseltongueResult.triggersFound.length, technique: parseltongueConfig.technique, intensity: parseltongueConfig.intensity } : undefined,
                ultraplinian: { tier: ultraplinianTier, models_queried: data.race?.models_queried || 0, models_succeeded: data.race?.models_succeeded || 0, winner_model: winnerModel, winner_score: data.winner?.score || 0, total_duration_ms: data.race?.total_duration_ms || 0 },
                classification: promptClassification, persona: persona.id,
                prompt_length: originalMessage.length, conversation_depth: currentConversation?.messages?.length || 0,
                memory_count: activeMemories.length, no_log: noLogMode, parseltongue_transformed: parseltongueResult.triggersFound.length > 0,
              })
            },
            onError: (error) => {
              updateMessageContent(currentConversationId, assistantMsgId, `**ULTRAPLINIAN Error:** ${error}`)
              resetUltraplinianRace()
            },
          },
        )
      } else {
        const startTime = Date.now()
        const response = proxyMode
          ? await sendMessageViaProxy({
              messages, model, apiBaseUrl: ultraplinianApiUrl, godmodeApiKey: ultraplinianApiKey,
              llmUpstreamBaseUrl: !isOpenRouterBase(inferenceV1) ? inferenceV1 : undefined,
              signal: abortControllerRef.current.signal,
              stm_modules: stmModules.filter(m => m.enabled).map(m => m.id),
              ...(tuneResult ? { temperature: tuneResult.params.temperature, top_p: tuneResult.params.top_p, top_k: tuneResult.params.top_k, frequency_penalty: tuneResult.params.frequency_penalty, presence_penalty: tuneResult.params.presence_penalty, repetition_penalty: tuneResult.params.repetition_penalty } : {}),
            })
          : await sendMessage({
              messages, model, apiKey: apiKey || '', inferenceBaseUrl: inferenceV1, noLog: noLogMode,
              signal: abortControllerRef.current.signal,
              ...(tuneResult ? { temperature: tuneResult.params.temperature, top_p: tuneResult.params.top_p, top_k: tuneResult.params.top_k, frequency_penalty: tuneResult.params.frequency_penalty, presence_penalty: tuneResult.params.presence_penalty, repetition_penalty: tuneResult.params.repetition_penalty } : {}),
            })
        const durationMs = Date.now() - startTime
        let transformedResponse = response
        for (const stm of stmModules) { if (stm.enabled) transformedResponse = stm.transformer(transformedResponse) }
        addMessage(currentConversationId, {
          role: 'assistant', content: transformedResponse, model, persona: persona.id,
          ...(tuneResult ? { autoTuneParams: tuneResult.params, autoTuneContext: tuneResult.detectedContext, autoTuneContextScores: tuneResult.contextScores, autoTunePatternMatches: tuneResult.patternMatches, autoTuneDeltas: tuneResult.paramDeltas } : {})
        })
        await llmClassifyPromise
        recordChatEvent({
          mode: 'standard', model, duration_ms: durationMs, response_length: transformedResponse.length, success: true,
          pipeline: { autotune: autoTuneEnabled, parseltongue: parseltongueConfig.enabled, stm_modules: stmModules.filter(m => m.enabled).map(m => m.id), strategy: autoTuneStrategy, godmode: useCustomSystemPrompt },
          ...(tuneResult ? { autotune: { detected_context: tuneResult.detectedContext, confidence: tuneResult.confidence } } : {}),
          parseltongue: parseltongueConfig.enabled ? { triggers_found: parseltongueResult.triggersFound.length, technique: parseltongueConfig.technique, intensity: parseltongueConfig.intensity } : undefined,
          classification: promptClassification, persona: persona.id,
          prompt_length: originalMessage.length, conversation_depth: currentConversation?.messages?.length || 0,
          memory_count: activeMemories.length, no_log: noLogMode, parseltongue_transformed: parseltongueResult.triggersFound.length > 0,
        })
      }
    } catch (error: any) {
      resetUltraplinianRace()
      if (error.name === 'AbortError') {
        addMessage(currentConversationId, { role: 'assistant', content: '_[Response stopped by user]_', model, persona: persona.id })
        recordChatEvent({
          mode: chatMode === 'ultraplinian' ? 'ultraplinian' : 'standard', model, duration_ms: 0, response_length: 0, success: false, error_type: 'abort',
          pipeline: { autotune: autoTuneEnabled, parseltongue: parseltongueConfig.enabled, stm_modules: stmModules.filter(m => m.enabled).map(m => m.id), strategy: autoTuneStrategy, godmode: useCustomSystemPrompt },
          classification: promptClassification, persona: persona.id, prompt_length: originalMessage.length, conversation_depth: currentConversation?.messages?.length || 0, memory_count: activeMemories.length, no_log: noLogMode, parseltongue_transformed: parseltongueResult.triggersFound.length > 0,
        })
      } else {
        console.error('Error sending message:', error)
        let errMsg = error.message || 'Failed to get response. Check your API key in Settings and try again.'
        const isFetchFail = errMsg.toLowerCase().includes('failed to fetch') || errMsg.toLowerCase().includes('networkerror')
        if (isFetchFail && (chatMode === 'ultraplinian' || chatMode === 'consortium')) {
          errMsg = `${chatMode.toUpperCase()} requires the G0DM0DƎ API server running at ${ultraplinianApiUrl}.\n\nStart it with: npm run api\n\nThe API server orchestrates the multi-model race server-side. The UI alone cannot run ${chatMode.toUpperCase()} mode.`
        }
        const errLower = errMsg.toLowerCase()
        const errorType = isFetchFail && (chatMode === 'ultraplinian' || chatMode === 'consortium')
          ? 'api_server' : errLower.includes('api key') || errLower.includes('expired') || errLower.includes('denied') || errLower.includes('permission')
          ? 'auth' : errLower.includes('rate limit') || errLower.includes('wait')
          ? 'rate_limit' : errLower.includes('timeout') || errLower.includes('timed out')
          ? 'timeout' : errLower.includes('unavailable') || errLower.includes('overloaded')
          ? 'model_error' : errLower.includes('credit') || errLower.includes('insufficient')
          ? 'billing' : 'unknown'
        addMessage(currentConversationId, { role: 'assistant', content: '', err: { message: errMsg, code: errorType }, model, persona: persona.id })
        recordChatEvent({
          mode: chatMode === 'ultraplinian' ? 'ultraplinian' : 'standard', model, duration_ms: 0, response_length: 0, success: false, error_type: errorType,
          pipeline: { autotune: autoTuneEnabled, parseltongue: parseltongueConfig.enabled, stm_modules: stmModules.filter(m => m.enabled).map(m => m.id), strategy: autoTuneStrategy, godmode: useCustomSystemPrompt },
          classification: promptClassification, persona: persona.id, prompt_length: originalMessage.length, conversation_depth: currentConversation?.messages?.length || 0, memory_count: activeMemories.length, no_log: noLogMode, parseltongue_transformed: parseltongueResult.triggersFound.length > 0,
        })
      }
    } finally {
      setIsStreaming(false)
      setUltraplinianRacing(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => { if (abortControllerRef.current) abortControllerRef.current.abort() }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  const displayResult = livePreview || autoTuneLastResult
  const activeMemoryCount = memoriesEnabled ? memories.filter(m => m.active).length : 0

  return (
    <div className="p-4 md:p-6 relative" style={{ background: 'linear-gradient(to top, var(--bg), transparent)' }}>
      <div className="max-w-3xl mx-auto space-y-2">
        {/* AutoTune details panel */}
        {autoTuneEnabled && displayResult && showTuneDetails && (
          <div className="mb-3 p-3 rounded-2xl space-y-3" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                <SlidersHorizontal className="w-3 h-3" />
                AUTOTUNE {autoTuneStrategy === 'adaptive'
                  ? `// ${getContextLabel(displayResult.detectedContext)} (${Math.round(displayResult.confidence * 100)}%)`
                  : `// ${getStrategyLabel(autoTuneStrategy)}`
                }
              </div>
            </div>
            {displayResult.contextScores && displayResult.contextScores.length > 1 && (
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <span style={{ color: 'var(--secondary)' }} className="mr-1">CONTEXT:</span>
                {displayResult.contextScores.filter(s => s.percentage > 0).slice(0, 4).map((s, i) => (
                  <span key={s.type} className="flex items-center">
                    {i > 0 && <span className="opacity-30 mx-1">&gt;</span>}
                    <span className={i === 0 ? 'text-cyan-400 font-bold' : ''} style={i !== 0 ? { color: 'var(--secondary)' } : {}}>
                      {getContextLabel(s.type)} {s.percentage}%
                    </span>
                  </span>
                ))}
              </div>
            )}
            {displayResult.patternMatches && displayResult.patternMatches.length > 0 && (
              <div className="text-[10px] font-mono">
                <span style={{ color: 'var(--secondary)' }}>MATCHED: </span>
                <span className="text-purple-400">
                  {displayResult.patternMatches.slice(0, 3).map(p => p.pattern).join(' | ')}
                  {displayResult.patternMatches.length > 3 && ` +${displayResult.patternMatches.length - 3} more`}
                </span>
              </div>
            )}
            <div className="grid grid-cols-6 gap-2">
              {(Object.entries(displayResult.params) as [keyof typeof PARAM_META, number][]).map(([key, value]) => {
                const delta = displayResult.paramDeltas?.find(d => d.param === key)
                const hasDelta = delta && Math.abs(delta.delta) > 0.001
                return (
                  <div key={key} className={`text-center p-1.5 rounded-lg transition-all ${hasDelta ? 'bg-cyan-500/10 border border-cyan-500/20' : 'glass'}`}
                    title={delta?.reason || PARAM_META[key].description}>
                    <div className="text-[10px] font-mono" style={{ color: 'var(--secondary)' }}>{PARAM_META[key].short}</div>
                    <div className="text-sm font-bold font-mono" style={{ color: 'var(--primary)' }}>{typeof value === 'number' ? value.toFixed(2) : value}</div>
                    {hasDelta && (
                      <div className={`text-[9px] font-mono ${delta.delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {delta.delta > 0 ? '+' : ''}{delta.delta.toFixed(2)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {displayResult.paramDeltas && displayResult.paramDeltas.length > 0 && (
              <div className="text-[10px] font-mono space-y-0.5 pt-1" style={{ borderTop: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--secondary)' }}>TUNING:</span>
                {displayResult.paramDeltas.slice(0, 4).map((d, i) => (
                  <div key={`${d.param}-${i}`} className="flex items-center gap-1 pl-2">
                    <span className="text-cyan-400">{PARAM_META[d.param].short}</span>
                    <span style={{ color: 'var(--secondary)' }}>{d.before.toFixed(2)} → {d.after.toFixed(2)}</span>
                    <span className={d.delta > 0 ? 'text-green-400' : 'text-red-400'}>({d.delta > 0 ? '+' : ''}{d.delta.toFixed(2)})</span>
                    <span className="text-purple-400">{d.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Attachment preview strip */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
            {attachments.map((att, i) => (
              <div key={i} className="relative group flex-shrink-0">
                <img src={att.dataUrl} alt={att.name}
                  className="w-16 h-16 rounded-xl object-cover glass"
                  style={{ border: '1px solid var(--glass-border)' }} />
                <button onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'var(--primary)', color: '#fff' }}>
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 text-[8px] text-center truncate px-0.5 rounded-b-xl"
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                  {att.name.slice(0, 10)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Composer — floating bar */}
        <div className="relative">
          <div className="absolute inset-0 blur-xl opacity-60 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 30% 40%, rgba(124,58,237,0.18), transparent 45%), radial-gradient(circle at 80% 70%, rgba(6,182,212,0.18), transparent 40%)' }}
          />
          <div className="flex items-end gap-0 glass-input rounded-2xl overflow-hidden relative shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300
            transition-all hover:-translate-y-0.5"
            style={{ border: '1px solid var(--glass-border)', backdropFilter: 'blur(14px)' }}>
            {/* Attach */}
            <button onClick={() => fileInputRef.current?.click()}
              disabled={(!canUseDirect && !proxyMode) || isStreaming}
              className="flex-shrink-0 p-3 transition-all duration-200
                hover:bg-[var(--glass-hover)] disabled:opacity-30 disabled:cursor-not-allowed"
              title="Attach image (vision models)"
              style={{ color: 'var(--secondary)' }}>
              <Paperclip className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={(canUseDirect || proxyMode) ? "Message G0DM0DƎ... (Shift+Enter for new line)" : "Set your API key in Settings first"}
              disabled={(!canUseDirect && !proxyMode) || isStreaming}
              rows={1}
              className="flex-1 px-1 py-3 bg-transparent border-none
                resize-none focus:outline-none
                placeholder:opacity-40 disabled:opacity-40
                transition-all duration-200 text-base"
              style={{ color: 'var(--text)', minHeight: '48px', maxHeight: '200px' }}
            />

            {/* Send / Stop */}
            {isStreaming ? (
              <button onClick={handleStop}
                className="flex-shrink-0 p-3 transition-all duration-200 hover:bg-red-500/10"
                aria-label="Stop generation">
                <StopCircle className="w-5 h-5 text-red-400" />
              </button>
            ) : (
              <button onClick={handleSubmit}
                disabled={!input.trim() || (!canUseDirect && !proxyMode)}
                className="flex-shrink-0 p-3 m-1.5 rounded-xl transition-all duration-200
                  disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--bg)',
                }}
                aria-label="Send message">
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between mt-3 text-[11px] px-1" style={{ color: 'var(--secondary)' }}>
          <div className="flex items-center gap-3">
            {autoTuneEnabled && (
              <button
                onClick={() => setShowTuneDetails(!showTuneDetails)}
                className={`flex items-center gap-1 transition-colors ${showTuneDetails ? 'text-cyan-400' : 'hover:text-cyan-400'}`}
              >
                <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                AutoTune {autoTuneStrategy === 'adaptive' && displayResult
                  ? `[${getContextLabel(displayResult.detectedContext)}]`
                  : `[${getStrategyLabel(autoTuneStrategy)}]`
                }
              </button>
            )}
            {noLogMode && (
              <span className="flex items-center gap-1">
                <span className="text-yellow-500 text-[10px]">&#x25C8;</span>
                No-Log
              </span>
            )}
            {stmModules.some(m => m.enabled) && (
              <span className="flex items-center gap-1">
                <span className="text-purple-500 text-[10px]">&#x2B23;</span>
                {stmModules.filter(m => m.enabled).length} STM
              </span>
            )}
            {activeMemoryCount > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-cyan-400 text-[10px]">&#x2726;</span>
                {activeMemoryCount} Mem
              </span>
            )}
            {parseltongueConfig.enabled && (
              <span className={`flex items-center gap-1 ${parseltonguePreview ? 'text-green-400' : ''}`}>
                <span className="text-green-500 text-[10px]">&#x2621;</span>
                PT{parseltonguePreview ? ` [${parseltonguePreview.triggersFound.length}]` : ''}
              </span>
            )}
            {currentConversation?.mode === 'ultraplinian' && (
              <span className="flex items-center gap-1 text-orange-400">
                <span className="text-[10px]">&#x2694;</span>
                ULTRA [{ultraplinianTier}]
              </span>
            )}
          </div>
          {isStreaming && (
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              {consortiumPhase === 'collecting'
                ? `Collecting ${consortiumModelsCollected}/${consortiumModelsTotal}...`
                : consortiumPhase === 'synthesizing'
                ? `Synthesizing...`
                : ultraplinianRacing
                ? `Racing ${ultraplinianModelsResponded}/${ultraplinianModelsTotal}${ultraplinianLiveModel ? ` // ${ultraplinianLiveModel.split('/').pop()} (${ultraplinianLiveScore})` : ''}`
                : autoTuneEnabled && autoTuneLastResult
                  ? `T=${autoTuneLastResult.params.temperature.toFixed(2)}...`
                  : 'Thinking...'
              }
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
