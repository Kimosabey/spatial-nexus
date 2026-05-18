const base =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''

export type ImpactRequest = {
  asset_id: string
  horizon_hours: number
}

export type GraphNode = {
  id: string
  label: string
  kind: string
}

export type GraphEdge = {
  source: string
  target: string
  relation: string
}

export type ImpactResponse = {
  request_id: string
  asset_id: string
  horizon_hours: number
  nodes: GraphNode[]
  edges: GraphEdge[]
  narrative: string
  source: string
}

export async function postImpact(body: ImpactRequest): Promise<ImpactResponse> {
  const res = await fetch(`${base}/v1/impact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const err = (await res.json()) as { detail?: unknown }
      if (typeof err.detail === 'string') detail = err.detail
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }
  return res.json() as Promise<ImpactResponse>
}
