import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useMemo } from 'react'

import type { GraphEdge, GraphNode } from '@/lib/api'

/** Colour by asset kind — matches the unicharm topology kinds in seed.cypher */
const KIND_COLOUR: Record<string, { bg: string; border: string; text: string }> = {
  chiller:       { bg: '#dbeafe', border: '#1e40af', text: '#1e3a8a' },
  condenser_pump:{ bg: '#dcfce7', border: '#16a34a', text: '#14532d' },
  cooling_tower: { bg: '#e0f2fe', border: '#0369a1', text: '#0c4a6e' },
  primary_pump:  { bg: '#f0fdf4', border: '#15803d', text: '#14532d' },
  pump_master:   { bg: '#fef9c3', border: '#a16207', text: '#713f12' },
  makeup_pump:   { bg: '#ecfdf5', border: '#059669', text: '#064e3b' },
  energy_meter:  { bg: '#fef3c7', border: '#d97706', text: '#78350f' },
  btm:           { bg: '#f5f3ff', border: '#7c3aed', text: '#4c1d95' },
  coh:           { bg: '#fce7f3', border: '#be185d', text: '#831843' },
  cohw:          { bg: '#fdf2f8', border: '#db2777', text: '#831843' },
  plant:         { bg: '#1e3a8a', border: '#0f172a', text: '#ffffff' },
  pump:          { bg: '#e0e7ff', border: '#4338ca', text: '#1e1b4b' },
  zone:          { bg: '#f1f5f9', border: '#64748b', text: '#1e293b' },
  building:      { bg: '#f8fafc', border: '#334155', text: '#0f172a' },
  campus:        { bg: '#f8fafc', border: '#475569', text: '#0f172a' },
  organization:  { bg: '#0f172a', border: '#0f172a', text: '#ffffff' },
  bus:           { bg: '#fef9c3', border: '#ca8a04', text: '#713f12' },
  load:          { bg: '#fef2f2', border: '#dc2626', text: '#7f1d1d' },
}

function nodeStyle(kind: string) {
  const c = KIND_COLOUR[kind] ?? { bg: '#f1f5f9', border: '#94a3b8', text: '#1e293b' }
  return {
    background: c.bg,
    border: `2px solid ${c.border}`,
    color: c.text,
    borderRadius: 10,
    padding: '6px 12px',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'IBM Plex Mono', monospace",
    minWidth: 100,
    maxWidth: 180,
    whiteSpace: 'normal' as const,
    textAlign: 'center' as const,
    boxShadow: '0 2px 8px -4px rgba(0,0,0,0.18)',
  }
}

function radialPositions(count: number, cx: number, cy: number, r: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / Math.max(count, 1) - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })
}

function toFlowNodes(nodes: GraphNode[]) {
  const pos = radialPositions(nodes.length, 340, 240, Math.min(180, 60 + nodes.length * 14))
  return nodes.map((n, i) => ({
    id: n.id,
    position: pos[i] ?? { x: 40 + i * 28, y: 40 },
    data: { label: `${n.label}\n${n.id}` },
    style: nodeStyle(n.kind),
  }))
}

const REL_COLOUR: Record<string, string> = {
  SUPPLIES:   '#1e40af',
  FEEDS:      '#0369a1',
  MONITORS:   '#d97706',
  CONTROLS:   '#7c3aed',
  CONTAINS:   '#64748b',
  LOCATED_IN: '#94a3b8',
}

function toFlowEdges(edges: GraphEdge[]) {
  return edges.map((e, i) => ({
    id: `e-${i}-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    label: e.relation,
    labelStyle: { fontSize: 9, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 },
    labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
    style: { stroke: REL_COLOUR[e.relation] ?? '#94a3b8', strokeWidth: 1.5 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: REL_COLOUR[e.relation] ?? '#94a3b8',
      width: 14,
      height: 14,
    },
  }))
}

export function ImpactGraphFlow({
  nodes,
  edges,
}: {
  nodes: GraphNode[]
  edges: GraphEdge[]
}) {
  const initialNodes = useMemo(() => toFlowNodes(nodes), [nodes])
  const initialEdges = useMemo(() => toFlowEdges(edges), [edges])

  const [rfNodes, , onNodesChange] = useNodesState(initialNodes)
  const [rfEdges, , onEdgesChange] = useEdgesState(initialEdges)

  if (nodes.length === 0) {
    return (
      <div
        role="status"
        aria-label="No graph data"
        className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500"
      >
        No graph nodes — run an impact query first.
      </div>
    )
  }

  return (
    <div
      className="h-[540px] w-full rounded-xl border border-[var(--color-blueprint-edge)] bg-white"
      role="region"
      aria-label="HVAC topology graph explorer"
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        nodesDraggable
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color="#e2e8f0" />
        <Controls
          aria-label="Graph controls"
          style={{ borderRadius: 8, boxShadow: '0 2px 8px -4px rgba(0,0,0,0.12)' }}
        />
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          nodeColor={(n) => {
            const kind = (n.data as { kind?: string })?.kind ?? 'asset'
            return KIND_COLOUR[kind]?.border ?? '#94a3b8'
          }}
          className="!rounded-xl !border !border-[var(--color-blueprint-edge)]"
          aria-label="Minimap"
        />
      </ReactFlow>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2 text-[10px]" aria-label="Legend">
        {Object.entries({
          chiller: 'Chiller',
          condenser_pump: 'Cond. Pump',
          cooling_tower: 'Cooling Tower',
          primary_pump: 'Primary Pump',
          energy_meter: 'Energy Meter',
          btm: 'BTM',
          zone: 'Zone',
        }).map(([kind, label]) => {
          const c = KIND_COLOUR[kind]!
          return (
            <span key={kind} className="flex items-center gap-1">
              <span
                className="inline-block size-3 rounded-sm"
                style={{ background: c.bg, border: `1.5px solid ${c.border}` }}
                aria-hidden
              />
              <span style={{ color: c.text, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>
                {label}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
