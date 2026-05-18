import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, ExternalLink, GitBranch, Layers, Loader2, Map, Network } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { GridBackground, MovingBorder, SpotlightHero } from '@/components/aceternity'
import { ImpactGraphFlow } from '@/components/ImpactGraphFlow'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getHealth, getSubgraph, postImpact, type GraphEdge, type GraphNode, type ImpactResponse } from '@/lib/api'

const schema = z.object({
  asset_id: z.string().min(1, 'Enter a failed asset or component id.'),
  horizon_hours: z.number().int().min(1).max(720),
})

type FormValues = z.infer<typeof schema>

const IMPACT_EXAMPLES: { label: string; asset_id: string; horizon_hours: number }[] = [
  { label: 'Chiller 1 trip',           asset_id: 'CH-0001b00000',       horizon_hours: 24 },
  { label: 'Chiller 2 trip',           asset_id: 'CH-0002b00000',       horizon_hours: 24 },
  { label: 'Condenser Pump 1 fail',    asset_id: 'CONDPU-0001b40000',   horizon_hours: 12 },
  { label: 'Cooling Tower 1 offline',  asset_id: 'CT-0001b70000',       horizon_hours: 48 },
  { label: 'Primary Pump 1 low flow',  asset_id: 'PV-0001b20000',       horizon_hours: 24 },
  { label: 'BTM sensor loss',          asset_id: 'BTM-0001110000',      horizon_hours: 72 },
  { label: 'Energy Meter 1 fault',     asset_id: 'EM-0001000000',       horizon_hours: 8  },
  { label: 'Make-up Pump 1 shutdown',  asset_id: 'MWP-0001150000',      horizon_hours: 24 },
  { label: 'Plant-wide — 1 week',      asset_id: 'PLANT-UNICHARM',      horizon_hours: 168},
]

export function ImpactPage() {
  const [result, setResult] = useState<ImpactResponse | null>(null)
  const [traceDepth, setTraceDepth] = useState(2)
  const [traceSeed, setTraceSeed] = useState<string | null>(null)

  const subgraphQuery = useQuery({
    queryKey: ['subgraph', traceSeed, traceDepth],
    queryFn: () => getSubgraph(traceSeed!, traceDepth),
    enabled: !!traceSeed,
    staleTime: 30_000,
  })

  const traceNodes: GraphNode[] = subgraphQuery.data?.nodes ?? result?.nodes ?? []
  const traceEdges: GraphEdge[] = subgraphQuery.data?.edges ?? result?.edges ?? []

  const healthQuery = useQuery({
    queryKey: ['spatial-nexus-health'],
    queryFn: getHealth,
    refetchInterval: 30_000,
    retry: 2,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { asset_id: '', horizon_hours: 48 },
  })

  const mutation = useMutation({
    mutationFn: postImpact,
    onSuccess: (data) => {
      setResult(data)
      setTraceSeed(data.asset_id)
      toast.success('Impact analysis ready', { description: data.request_id })
    },
    onError: (e: Error) => toast.error('Impact failed', { description: e.message }),
  })

  function onSubmit(values: FormValues) {
    mutation.mutate({
      asset_id: values.asset_id.trim(),
      horizon_hours: values.horizon_hours,
    })
  }

  return (
    <div className="relative min-h-screen">
      <GridBackground />
      <header
        className="border-b border-[var(--color-blueprint-edge)] bg-white/85 backdrop-blur-md"
        role="banner"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--color-cobalt)] text-white shadow-sm">
              <Map className="size-5" aria-hidden />
            </div>
            <div>
              <p className="mono text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-sage-deep)]">
                SelfAware® · Atlas III
              </p>
              <h1 className="atlas-display text-xl font-semibold text-[var(--color-cobalt-deep)]">
                SpatialNexus
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {healthQuery.isPending ? (
              <Badge variant="outline" className="gap-1">
                <Loader2 className="size-3 animate-spin" aria-hidden />
                <span aria-live="polite">Checking API…</span>
              </Badge>
            ) : healthQuery.isError ? (
              <Badge variant="danger" title={(healthQuery.error as Error).message}>
                API unreachable
              </Badge>
            ) : (
              <>
                <Badge
                  variant={healthQuery.data.neo4j_configured ? 'success' : 'warning'}
                  className="gap-1"
                >
                  <Layers className="size-3" aria-hidden />
                  {healthQuery.data.neo4j_configured ? 'Neo4j OK' : 'Neo4j not configured'}
                </Badge>
                <Badge variant="outline">API OK · :{healthQuery.data.port}</Badge>
              </>
            )}
            <Button variant="outline" size="sm" asChild>
              <a href="/docs" target="_blank" rel="noreferrer">
                <BookOpen className="size-4" />
                OpenAPI
                <ExternalLink className="size-3 opacity-60" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main id="main" role="main" className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <SpotlightHero className="p-6 md:p-9">
          <div className="space-y-3">
            <Badge variant="success">Graph · Cypher · downstream impact</Badge>
            <h2 className="atlas-display text-3xl font-semibold tracking-tight text-[var(--color-cobalt-deep)] md:text-4xl">
              Topology atlas for HVAC + building systems
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
              Trace what fails next when an asset goes down. With{' '}
              <code className="mono rounded bg-slate-100 px-1">NEO4J_URI</code> set, queries
              run against your live graph — no stub fallback in production mode.
            </p>
          </div>
        </SpotlightHero>

        <MovingBorder>
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="size-5 text-emerald-700" />
                Impact query
              </CardTitle>
              <CardDescription>POST /v1/impact</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="asset_id">Failed asset id</Label>
                  <p className="text-xs text-zinc-500">Try an example</p>
                  <div className="flex flex-wrap gap-2">
                    {IMPACT_EXAMPLES.map((ex) => (
                      <Button
                        key={ex.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto max-w-full whitespace-normal py-1.5 text-left text-xs font-normal"
                        onClick={() => {
                          form.setValue('asset_id', ex.asset_id)
                          form.setValue('horizon_hours', ex.horizon_hours)
                        }}
                      >
                        {ex.label}
                      </Button>
                    ))}
                  </div>
                  <Input
                    id="asset_id"
                    placeholder="e.g. TRF-12-AUX1"
                    {...form.register('asset_id')}
                  />
                  {form.formState.errors.asset_id?.message ? (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.asset_id.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horizon_hours">Horizon (hours)</Label>
                  <Input
                    id="horizon_hours"
                    type="number"
                    min={1}
                    max={720}
                    {...form.register('horizon_hours', { valueAsNumber: true })}
                  />
                  {form.formState.errors.horizon_hours?.message ? (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.horizon_hours.message}
                    </p>
                  ) : null}
                </div>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Resolving graph…
                    </>
                  ) : (
                    'Run impact'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </MovingBorder>

        {result ? (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Graph summary</CardTitle>
                  <Badge variant={result.source === 'neo4j' ? 'success' : 'warning'}>
                    {result.source}
                  </Badge>
                  <span className="text-xs tabular-nums text-zinc-500">{result.request_id}</span>
                </div>
                <CardDescription>{result.narrative}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-zinc-800">Nodes</h3>
                  <ul className="space-y-2">
                    {result.nodes.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-sm"
                      >
                        <span className="font-mono text-xs text-zinc-500">{n.id}</span>
                        <div className="font-medium text-zinc-900">{n.label}</div>
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {n.kind}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-zinc-800">Edges</h3>
                  <ul className="space-y-2 font-mono text-xs text-zinc-700">
                    {result.edges.map((e, i) => (
                      <li key={`${e.source}-${e.target}-${i}`} className="rounded-lg bg-white px-2 py-1">
                        {e.source} —({e.relation})→ {e.target}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Network className="size-4 text-[var(--color-cobalt)]" aria-hidden />
                      Full circuit trace
                    </CardTitle>
                    <CardDescription>
                      Depth-{traceDepth} neighbourhood from{' '}
                      <code className="mono text-xs">{traceSeed}</code> via{' '}
                      <code className="mono text-xs">/v1/graph/subgraph</code>.
                      {subgraphQuery.isFetching && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-[var(--color-sage-deep)]">
                          <Loader2 className="size-3 animate-spin" aria-hidden />
                          Fetching…
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {/* Depth slider */}
                  <div className="flex items-center gap-3 text-sm" role="group" aria-label="Trace depth">
                    <span className="text-xs text-zinc-500">Depth</span>
                    {[1, 2, 3, 4].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setTraceDepth(d)}
                        aria-pressed={traceDepth === d}
                        className={[
                          'mono flex size-7 items-center justify-center rounded-md border text-xs font-bold transition-colors',
                          traceDepth === d
                            ? 'border-[var(--color-cobalt)] bg-[var(--color-cobalt)] text-white'
                            : 'border-[var(--color-blueprint-edge)] bg-white text-[var(--color-cobalt-deep)] hover:border-[var(--color-cobalt)]',
                        ].join(' ')}
                      >
                        {d}
                      </button>
                    ))}
                    <span className="tabular-nums text-xs text-zinc-400">
                      {traceNodes.length} nodes · {traceEdges.length} edges
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ImpactGraphFlow
                  key={`${traceSeed}-d${traceDepth}`}
                  nodes={traceNodes}
                  edges={traceEdges}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Narrative</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-zinc-700">{result.narrative}</p>
              </CardContent>
            </Card>
          </motion.section>
        ) : null}
      </main>
    </div>
  )
}
