# SpatialNexus

GraphRAG — building / topology in **Neo4j**; impact queries over nodes and edges (stub graph when DB not configured).

**GitHub:** [Kimosabey/spatial-nexus](https://github.com/Kimosabey/spatial-nexus)

```bash
git clone git@github.com:Kimosabey/spatial-nexus.git
```

Uses your existing `~/.ssh/config` for GitHub.

| | |
|--|--|
| **API port** | `8103` (override with `PORT`) |
| **OpenAPI** | `/docs` |
| **Roadmap** | [docs/PLAN.md](docs/PLAN.md) |
| **UI rules** | [docs/UI.md](docs/UI.md) |

## API

- `GET /health`
- `POST /v1/impact` — JSON: `asset_id`, `horizon_hours` (1–720); returns nodes, edges, narrative; uses Neo4j when credentials are set, else deterministic stub

### Environment

| Variable | Purpose |
|----------|---------|
| `PORT` | Default `8103` |
| `NEO4J_URI` | `neo4j+s://…` or `bolt://…` |
| `NEO4J_USER` | Default `neo4j` |
| `NEO4J_PASSWORD` | Required for live reads |
| `CORS_ORIGINS` | Comma-separated allowed origins |

See [.env.example](.env.example).

### Local (API only)

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8103
```

## Web UI (`web/`)

Impact form + list summary + **graph explorer** (`@xyflow/react`) fed by the same API payload. Dev proxy → **8103**.

```bash
cd web
npm install
npm run dev
```

[web/README.md](web/README.md)

## Docker

```bash
docker compose up --build
```

- [http://localhost:8103](http://localhost:8103), [http://localhost:8103/health](http://localhost:8103/health), [http://localhost:8103/docs](http://localhost:8103/docs)
