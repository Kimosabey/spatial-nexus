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
