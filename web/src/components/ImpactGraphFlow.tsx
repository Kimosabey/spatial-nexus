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

function radialPositions(count: number, cx: number, cy: number, r: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / Math.max(count, 1) - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })
}

function toFlowNodes(nodes: GraphNode[]) {
  const pos = radialPositions(nodes.length, 260, 200, 150)
  return nodes.map((n, i) => ({
    id: n.id,
    position: pos[i] ?? { x: 40 + i * 24, y: 40 },
    data: { label: `${n.label} (${n.kind})` },
  }))
}

function toFlowEdges(edges: GraphEdge[]) {
  return edges.map((e, i) => ({
    id: `e-${i}-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    label: e.relation,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#a1a1aa' },
  }))
}

/** Lightweight graph explorer (React Flow) from API nodes/edges. */
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
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
        No graph nodes in this response.
      </div>
    )
  }

  return (
    <div className="h-[420px] w-full rounded-xl border border-zinc-200 bg-white [&_.react-flow\_\_attribution]:hidden">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={16} />
        <Controls />
        <MiniMap
          pannable
          zoomable
          nodeStrokeWidth={2}
          className="!bg-zinc-100"
        />
      </ReactFlow>
    </div>
  )
}
