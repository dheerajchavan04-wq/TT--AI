import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const {
    messages,
    model,
    apiBaseUrl = 'http://127.0.0.1:1234/v1',
    temperature,
    max_tokens,
    top_p,
    top_k,
    frequency_penalty,
    presence_penalty,
    repetition_penalty,
    noLog,
  } = body || {}

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages is required' }, { status: 400 })
  }
  if (!model || typeof model !== 'string') {
    return NextResponse.json({ error: 'model is required' }, { status: 400 })
  }

  const payload: Record<string, unknown> = {
    messages,
    model,
    temperature: temperature ?? 0.7,
    max_tokens: max_tokens ?? 4096,
  }
  if (top_p !== undefined) payload.top_p = top_p
  if (top_k !== undefined) payload.top_k = top_k
  if (frequency_penalty !== undefined) payload.frequency_penalty = frequency_penalty
  if (presence_penalty !== undefined) payload.presence_penalty = presence_penalty
  if (repetition_penalty !== undefined) payload.repetition_penalty = repetition_penalty
  if (noLog) payload.provider = { allow_fallbacks: false }

  const url = apiBaseUrl.replace(/\/$/, '') + '/chat/completions'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let errMsg = 'LM Studio request failed'
    try {
      const err = await res.json()
      errMsg = err.error?.message || err.error || JSON.stringify(err)
    } catch {}
    return NextResponse.json({ error: errMsg }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
