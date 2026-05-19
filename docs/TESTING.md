# SpatialNexus — smoke tests

**Prerequisites:** Neo4j with `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`. Load [`scripts/seed.cypher`](../scripts/seed.cypher) (asset id **`PUMP-A1`**). **DBeaver / Browser:** [DATABASE_AND_DBEAVER.md](../../docs/DATABASE_AND_DBEAVER.md) (Bolt **7687**, Browser **7474**).

```text
BASE=http://127.0.0.1:8103
```

| Step | Expected |
|------|----------|
| `GET $BASE/health` | `200`; `neo4j_configured` true when env set |
| `POST $BASE/v1/impact` `{"asset_id":"PUMP-A1","horizon_hours":24}` | `200`; `source` is `neo4j` |
| Neo4j unset | `POST /v1/impact` → `503` |
| Subgraph (new) | `GET $BASE/v1/graph/subgraph?seed=PUMP-A1&depth=2` | `200`; nodes deduped; edges typed |
| Subgraph clamp (new) | `?depth=99&limit=99999` | `200`; effective depth=4, limit=500 |
| Subgraph no env (new) | NEO4J_* unset | `GET /v1/graph/subgraph` → `503` |

```bash
curl -sS "$BASE/v1/graph/subgraph?seed=PUMP-A1&depth=2&limit=80" | jq '.nodes|length, .edges|length'
```

---

## Unicharm E2E scenario (graph is pre-seeded)

> Suite-level guide: [docs/E2E_TESTING.md](../../docs/E2E_TESTING.md)

```bash
BASE=http://127.0.0.1:8103
```

**Seeded topology:** 39 nodes · 60 edges (CH×2, CONDPU×3, CT×2, PV×2, EM×12, BTM, MWP×2, COH, COHW, PLANT, zones, building, campus, org)

### Impact chip tests

| ID | Asset | Depth | Expected nodes | Expected edge types |
|----|-------|-------|----------------|---------------------|
| E2E-SN1 | CH-0001b00000 | 1 | 3 | SUPPLIES(→PV, →PRISEQ), LOCATED_IN(→ZONE-PLANT) |
| E2E-SN2 | CT-0001b70000 | 2 | 17 | FEEDS(→COH), LOCATED_IN, MONITORS(EM-6), CONTROLS(CPM) |
| E2E-SN3 | CONDPU-0001b40000 | 2 | 8+ | FEEDS(→CT-1), CONTROLS(CPM), MONITORS(EM-3) |
| E2E-SN4 | PV-0001b20000 | 1 | 4 | SUPPLIES(→ZONE-RISER-A), MONITORS(EM-8) |
| E2E-SN5 | PLANT-UNICHARM | 4 | 39 | All edges |

### Subgraph depth test

```bash
curl "$BASE/v1/graph/subgraph?seed=CT-0001b70000&depth=2"
# nodes: 17  edges: 23  (after dedup fix)

curl "$BASE/v1/graph/subgraph?seed=PLANT-UNICHARM&depth=4&limit=200"
# All 39 nodes, full 60-edge topology
```

### Neo4j Browser verification

Open http://127.0.0.1:7474 · `neo4j` / `spatialdevpassword`

```cypher
-- Full circuit trace from Chiller 1
MATCH p = (ch {id:'CH-0001b00000'})-[*1..3]->(b)
RETURN p LIMIT 50

-- All energy meters and what they monitor
MATCH (em:asset {kind:'energy_meter'})-[:MONITORS]->(a)
RETURN em.id, a.id, a.name ORDER BY em.id

-- What feeds Chiller 1?
MATCH (src)-[r]->(ch {id:'CH-0001b00000'})
RETURN src.id, src.name, type(r)
```

### React Flow graph explorer

1. Click any chip in the UI
2. Depth buttons 1–4 in the explorer header — click to expand
3. Node colours: chiller=🔵 / condenser_pump=🟢 / cooling_tower=🩵 / energy_meter=🟡 / btm=🟣
4. Edge labels: FEEDS / SUPPLIES / MONITORS / CONTROLS / LOCATED_IN / CONTAINS
5. Minimap bottom-right mirrors the full graph; pan/zoom independently
