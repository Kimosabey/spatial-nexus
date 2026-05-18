import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, ExternalLink, GitBranch, Loader2, Map } from 'lucide-react'
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
import { postImpact, type ImpactResponse } from '@/lib/api'

const schema = z.object({
  asset_id: z.string().min(1, 'Enter a failed asset or component id.'),
  horizon_hours: z.number().int().min(1).max(720),
})

type FormValues = z.infer<typeof schema>

export function ImpactPage() {
  const [result, setResult] = useState<ImpactResponse | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { asset_id: '', horizon_hours: 48 },
  })

  const mutation = useMutation({
    mutationFn: postImpact,
    onSuccess: (data) => {
      setResult(data)
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
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
              <Map className="size-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                SelfAware®
              </p>
              <h1 className="text-lg font-semibold text-zinc-900">SpatialNexus</h1>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/docs" target="_blank" rel="noreferrer">
              <BookOpen className="size-4" />
              OpenAPI
              <ExternalLink className="size-3 opacity-60" />
            </a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <SpotlightHero className="border border-zinc-200/80 bg-white/90 p-6 shadow-sm md:p-8">
          <div className="space-y-2">
            <Badge variant="success">Graph + topology</Badge>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
              Impact analysis
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-600">
              Correlates failed assets with upstream/downstream dependencies. With{' '}
              <code className="rounded bg-zinc-100 px-1">NEO4J_URI</code> set, results come
              from your live graph; otherwise a deterministic stub illustrates the shape of
              the response.
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
                <CardTitle className="text-base">Graph explorer</CardTitle>
                <CardDescription>
                  Pan, zoom, and drag nodes. Data from the same /v1/impact payload.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImpactGraphFlow key={result.request_id} nodes={result.nodes} edges={result.edges} />
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
