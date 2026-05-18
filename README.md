# SpatialNexus

**GraphRAG / topology** — **impact analysis** for a failed **asset id** over a **time horizon** (hours). With **`NEO4J_URI`** + credentials, the API runs **Cypher** to return **nodes** and **edges** from your graph; otherwise a **deterministic stub** illustrates the contract. The **web** app includes a **React Flow** graph explorer (`@xyflow/react`) fed by the same payload.

| | |
|--|--|
| **GitHub** | [Kimosabey/spatial-nexus](https://github.com/Kimosabey/spatial-nexus) |
| **Clone** | `git clone git@github.com:Kimosabey/spatial-nexus.git` |
| **Default API port** | `8103` |
| **Stack** | FastAPI · **neo4j** driver 5.x · **web:** Vite · React 19 · TypeScript · Tailwind 4 · TanStack Query · RHF · Zod · **@xyflow/react** · Framer Motion · Sonner · Lucide |
| **Roadmap** | [docs/PLAN.md](docs/PLAN.md) |
| **UI / UX** | [docs/UI.md](docs/UI.md) |

---

## Repository layout

```
spatial-nexus/
├── app/main.py              # POST /v1/impact, Neo4j + stub fallback
├── web/
│   ├── src/
│   │   ├── pages/ImpactPage.tsx
│   │   └── components/ImpactGraphFlow.tsx
│   └── README.md
├── docs/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

---

## Features

### API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness |
| `POST` | `/v1/impact` | Body: `{ "asset_id": string, "horizon_hours": number }` (1–720). Response: `request_id`, `asset_id`, `horizon_hours`, `nodes[]` (`id`, `label`, `kind`), `edges[]` (`source`, `target`, `relation`), `narrative`, `source` (`"neo4j"` \| `"stub"`) |

**Neo4j path:** requires `NEO4J_URI` and `NEO4J_PASSWORD` (and optionally `NEO4J_USER`). Queries match nodes/relationships around the given asset id/name. Any driver/query error falls back to **stub** behaviour.

### Web UI

- **Impact query** form: asset id + horizon.
- **Summary** cards: node list, edge list, neo4j vs stub badge.
- **Graph explorer** — pan, zoom, minimap, draggable nodes.
- OpenAPI link in header.

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `PORT` | Default `8103` |
| `NEO4J_URI` | Bolt / neo4j URI |
| `NEO4J_USER` | Default `neo4j` |
| `NEO4J_PASSWORD` | Required for live graph reads |
| `CORS_ORIGINS` | Comma-separated allowed origins |

**Web:** `VITE_API_BASE` — optional ([web/README.md](web/README.md)).

See [.env.example](.env.example).

---

## Run locally

**API:** run from the **repository root** (folder that contains `app/`). Not from inside `app/`.

**Windows:** `.\run-dev.ps1` or `run-dev.bat`.

```bash
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8103
```

**Web:**

```bash
cd web && npm install && npm run dev
```

Dev proxy targets **8103**.

---

## Docker

```bash
docker compose up --build
```

Combined SPA + API on **8103**.

---

## `web/` scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | `tsc -b` + Vite production build |
| `npm run preview` | Preview |
| `npm run lint` | ESLint |

---

## Schema notes

The bundled Cypher assumes nodes may expose `id`, `name`, or `asset_id` properties compatible with your graph model; adjust `app/main.py` queries to match your labels and property keys.

---

## License

Proprietary — Graylinx / SelfAware® unless otherwise stated.
