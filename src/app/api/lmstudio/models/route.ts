import { NextResponse } from 'next/server'

const pickModels = (data: any): string[] | null => {
  const pools = [
    data,
    data?.data,
    data?.models,
    data?.data?.models,
  ].filter(Boolean)

  for (const pool of pools) {
    if (Array.isArray(pool)) {
      const models = pool
        .map((m: any) => m?.id || m?.model || m?.name || m?.slug || m?.modelId || m)
        .filter(Boolean)
      if (models.length > 0) return models
    }
  }
  return null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const base = searchParams.get('base') || 'http://127.0.0.1:1234/v1'
  const root = base.replace(/\/v1\/?$/, '')

  const candidates = [
    `${root}/api/v1/models`,
    `${root}/v1/models`,
    `${root}/api/v0/models`,
  ]

  let lastError: unknown = null
  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (!res.ok) throw new Error(`Failed ${res.status}`)
      const data = await res.json()
      const models = pickModels(data)
      if (models) return NextResponse.json({ data: models })
    } catch (err) {
      lastError = err
    }
  }

  return NextResponse.json(
    { error: 'Unable to fetch LM Studio models', details: `${lastError}` },
    { status: 502 },
  )
}
