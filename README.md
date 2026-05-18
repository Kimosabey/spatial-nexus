# SpatialNexus

GraphRAG — HVAC/building topology in Neo4j; Cypher-first impact analysis.

**GitHub:** [Kimosabey/spatial-nexus](https://github.com/Kimosabey/spatial-nexus)

`git clone git@github.com:Kimosabey/spatial-nexus.git` (uses your existing `~/.ssh/config` for GitHub)

**API port:** `8103`

## Run

**Docker:** `docker compose up --build` → [http://localhost:8103/health](http://localhost:8103/health)

**Local:** `pip install -r requirements.txt` → `uvicorn app.main:app --reload --host 0.0.0.0 --port 8103`

OpenAPI: [http://localhost:8103/docs](http://localhost:8103/docs)
