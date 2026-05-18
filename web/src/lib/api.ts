const base =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''

export type HealthResponse = {
  status: string
  service: string
  port: number
  neo4j_configured: boolean
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${base}/health`)
  if (!res.ok) throw new Error(`Health ${res.status}`)
  return res.json() as Promise<HealthResponse>
}

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

export type SubgraphResponse = {
  request_id: string
  seed: string
  depth: number
  nodes: GraphNode[]
  edges: GraphEdge[]
  source: string
}

export async function getSubgraph(
  seed: string,
  depth = 2,
  limit = 120,
): Promise<SubgraphResponse> {
  const url = `${base}/v1/graph/subgraph?seed=${encodeURIComponent(seed)}&depth=${depth}&limit=${limit}`
  const res = await fetch(url)
  if (!res.ok) {
    let detail = res.statusText
    try {
      const err = (await res.json()) as { detail?: unknown }
      if (typeof err.detail === 'string') detail = err.detail
    } catch { /* ignore */ }
    throw new Error(detail)
  }
  return res.json() as Promise<SubgraphResponse>
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
