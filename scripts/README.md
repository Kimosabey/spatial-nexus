# SpatialNexus — scripts

## `seed.cypher`
Tiny demo graph (PUMP-A1 + neighbours). Open in Neo4j Browser and run.

## `etl_from_unicharm.py`
One-shot ETL from a unicharm-shaped MySQL DB → your Neo4j DBMS. Idempotent
(MERGE), so re-running refreshes without duplicates.

### Prerequisites

```pwsh
pip install mysql-connector-python neo4j
```

### Configure

Set env vars before running (PowerShell):

```pwsh
# MySQL source
$env:MYSQL_HOST     = "127.0.0.1"
$env:MYSQL_PORT     = "3306"
$env:MYSQL_DB       = "unicharm"
$env:MYSQL_USER     = "root"
$env:MYSQL_PASSWORD = "your-mysql-password"

# Neo4j sink — copy these from Neo4j Desktop
$env:NEO4J_URI      = "bolt://127.0.0.1:7687"
$env:NEO4J_USER     = "neo4j"
$env:NEO4J_PASSWORD = "your-neo4j-password"
```

> In **Neo4j Desktop**: open the DBMS card → "..." menu → **Manage** →
> **Connection details** copies the Bolt URI. The user is `neo4j` and the
> password is whatever you set when you created the DBMS. Click **Start** on
> the DBMS before running the ETL.

### Run

```pwsh
# 1. Preview only — extracts from MySQL, prints counts, no Neo4j writes
python scripts\etl_from_unicharm.py --dry-run

# 2. Real run
python scripts\etl_from_unicharm.py

# 3. Real run, wiping the existing graph first (DANGEROUS)
python scripts\etl_from_unicharm.py --wipe
```

### What it imports

| MySQL table | Neo4j label | Notes |
|---|---|---|
| `organization` | `Organization` | |
| `campus` | `Campus` | `-[:PART_OF]->(Organization)` |
| `building` | `Building` | `-[:LOCATED_IN]->(Campus)` |
| `floor` | `Floor` | `-[:LOCATED_IN]->(Building)` |
| `area` | `Area` | `-[:LOCATED_IN]->(Location)` (via `area.zone_id`) |
| `gl_location` | `Location` | self-`PART_OF` via `zone_parent` |
| `gl_subsystem` | `Subsystem` | self-`PART_OF` via `ss_parent` |
| `gl_location_subsystem_map` | (edge) | `(Subsystem)-[:LOCATED_IN]->(Location)` |
| `gateway` | `Gateway` | |
| `gateway_mapping` | (edge) | `(Gateway)-[:SERVES]->(Location)` |

Missing tables are skipped (you'll see `[skip] table 'x' not present` — that's
fine if your unicharm dump doesn't include that table).

### After the ETL — point SpatialNexus at the same DBMS

In `spatial-nexus/.env` (or your shell):

```
NEO4J_URI=bolt://127.0.0.1:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-neo4j-password
```

Restart the API. `/v1/impact` and `/v1/graph/subgraph` will now return real
topology — try a `Location.id` (UUID) as the `asset_id` / `seed`:

```bash
curl "http://127.0.0.1:8103/v1/graph/subgraph?seed=<some-location-uuid>&depth=2"
```

The seed can be the `id`, `name`, or `asset_id` of any node — the existing
Cypher matches all three. Look up a UUID in Neo4j Browser:

```cypher
MATCH (n:Location) RETURN n.id, n.name LIMIT 10
```
