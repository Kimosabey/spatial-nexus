# SpatialNexus — implementation plan

**Repo:** [Kimosabey/spatial-nexus](https://github.com/Kimosabey/spatial-nexus) · **API:** port `8103`

## Product goal

**GraphRAG:** building / HVAC **topology in Neo4j** — **Cypher-first** impact sets; optional LLM **narrates** deterministic graph output only.

## Suite UI standards

**Vite + React + TS**, **Tailwind (light-only)**, **Framer Motion** + **Aceternity-style** layouts, **Lucide**, **TanStack Query**, **RHF + Zod**, **React Router**. Optional **@xyflow/react** (or similar) for graph explorer in later milestone.

## Milestones

| Phase | Backend | Web UI |
|-------|---------|--------|
| **M1** | `POST /v1/impact` stub (mock affected zones / assets + time horizon) | Scaffold `web/`; **impact form** (failed asset, minutes horizon); **structured result** cards with motion |
| **M2** | Neo4j schema + ETL stubs; real Cypher for downstream impact | Live impact + “graph summary” list |
| **M3** | Graph explorer API (subgraph) | **Lightweight graph** view + zoom/pan |
| **M4** | Versioned ontology (`graph_version`) | Admin snapshot / diff stub |

## Current status

- FastAPI scaffold + `/health` live.
- **`web/`**, Neo4j, and graph UI **not started**.

## Dependency on other services

**Autonomous-Cortex** may call `POST /v1/impact` as a tool.
