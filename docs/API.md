# SpatialNexus — API reference

Base URL — `http://127.0.0.1:8103` (or `http://<LAN_IP>:8103`). OpenAPI at `/docs`.

## Endpoint summary

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/health` | service liveness + `neo4j_configured` flag |
| `POST` | `/v1/impact` | one-hop+ downstream impact + narrative |
| `GET`  | `/v1/graph/subgraph` | **NEW** — variable-depth neighbourhood (explorer) |

> **Production mode has no stub fallback.** When `NEO4J_URI` / `NEO4J_PASSWORD`
> are unset, both endpoints return `503`. Seed with `scripts/seed.cypher`.

## POST /v1/impact

```json
{ "asset_id": "PUMP-A1", "horizon_hours": 24 }
```

Response:

```json
{
  "request_id": "uuid",
  "asset_id": "PUMP-A1",
  "horizon_hours": 24,
  "nodes": [{"id":"…","label":"…","kind":"asset"}],
  "edges": [{"source":"…","target":"…","relation":"FEEDS"}],
  "narrative": "Neo4j graph neighbourhood for `PUMP-A1` (8 nodes, 12 edges, horizon 24h context).",
  "source": "neo4j"
}
```

## GET /v1/graph/subgraph  (new)

Variable-depth Cypher neighbourhood for the React Flow explorer.

Query string:
- `seed` — required asset id, name, or `asset_id` property
- `depth` — 1..4 (default 2)
- `limit` — 1..500 (default 100)

```
GET /v1/graph/subgraph?seed=PUMP-A1&depth=2&limit=80
```

Response:

```json
{
  "request_id": "uuid",
  "seed": "PUMP-A1",
  "depth": 2,
  "nodes": [{"id":"…","label":"…","kind":"asset"}],
  "edges": [{"source":"…","target":"…","relation":"FEEDS"}],
  "source": "neo4j"
}
```

## Errors

| Code | Cause |
|------|-------|
| `503 Neo4j is not configured`      | `NEO4J_URI` / `NEO4J_PASSWORD` missing |
| `503 Neo4j query failed`           | driver could not connect / auth failed |
| `502 Neo4j subgraph failed: …`     | Cypher error inside subgraph endpoint  |
| `422`                              | bad query string / body                |
