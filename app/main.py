import os
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

SERVICE_SLUG = "spatial-nexus"
PORT = int(os.getenv("PORT", "8103"))

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

_cors = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOW_ORIGINS = [o.strip() for o in _cors.split(",") if o.strip()]

app = FastAPI(
    title="SpatialNexus",
    description="Neo4j GraphRAG / topology (scaffold).",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ImpactRequest(BaseModel):
    asset_id: str = Field(min_length=1, max_length=512)
    horizon_hours: int = Field(default=24, ge=1, le=720)


class GraphNode(BaseModel):
    id: str
    label: str
    kind: str


class GraphEdge(BaseModel):
    source: str
    target: str
    relation: str


class ImpactResponse(BaseModel):
    request_id: str
    asset_id: str
    horizon_hours: int
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    narrative: str
    source: str  # always "neo4j" on success


def _neo4j_impact(asset_id: str, horizon_hours: int, request_id: str) -> ImpactResponse | None:
    uri = os.getenv("NEO4J_URI", "").strip()
    user = os.getenv("NEO4J_USER", "neo4j").strip()
    password = os.getenv("NEO4J_PASSWORD", "").strip()
    if not uri or not password:
        return None
    try:
        from neo4j import GraphDatabase
    except ImportError:
        return None

    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    drv = None
    try:
        drv = GraphDatabase.driver(uri, auth=(user, password))
        with drv.session() as session:
            result = session.run(
                """
                MATCH (n)
                WHERE n.id = $aid OR n.name = $aid OR toString(n.asset_id) = $aid
                RETURN n LIMIT 25
                """,
                aid=asset_id.strip(),
            )
            for i, record in enumerate(result):
                raw = record["n"]
                props = dict(raw)
                nid = str(props.get("id") or props.get("name") or raw.element_id)
                lbls = ":".join(raw.labels) if hasattr(raw, "labels") else "node"
                nodes.append(
                    GraphNode(id=nid, label=str(props.get("name") or nid), kind=lbls.lower()),
                )
                if i >= 24:
                    break
            er = session.run(
                """
                MATCH (a)-[r]->(b)
                WHERE a.id = $aid OR a.name = $aid OR toString(a.asset_id) = $aid
                RETURN a, type(r) AS rel, b LIMIT 40
                """,
                aid=asset_id.strip(),
            )
            for record in er:
                a, rel, b = record["a"], record["rel"], record["b"]
                ap = dict(a)
                bp = dict(b)
                aid_ = str(ap.get("id") or ap.get("name") or a.element_id)
                bid = str(bp.get("id") or bp.get("name") or b.element_id)
                edges.append(GraphEdge(source=aid_, target=bid, relation=str(rel)))
    except Exception:
        return None
    finally:
        if drv is not None:
            try:
                drv.close()
            except Exception:
                pass

    if not nodes and not edges:
        return ImpactResponse(
            request_id=request_id,
            asset_id=asset_id,
            horizon_hours=horizon_hours,
            nodes=[],
            edges=[],
            narrative=(
                f"No Neo4j neighbourhood found for `{asset_id}`. "
                "Verify the asset id or load scripts/seed.cypher."
            ),
            source="neo4j",
        )

    narrative = (
        f"Neo4j graph neighbourhood for `{asset_id}` "
        f"({len(nodes)} nodes, {len(edges)} edges, horizon {horizon_hours}h context)."
    )
    return ImpactResponse(
        request_id=request_id,
        asset_id=asset_id,
        horizon_hours=horizon_hours,
        nodes=nodes,
        edges=edges,
        narrative=narrative,
        source="neo4j",
    )


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": SERVICE_SLUG,
        "port": PORT,
        "neo4j_configured": bool(
            os.getenv("NEO4J_URI", "").strip() and os.getenv("NEO4J_PASSWORD", "").strip()
        ),
    }


@app.post("/v1/impact", response_model=ImpactResponse)
def impact_v1(body: ImpactRequest) -> ImpactResponse:
    request_id = str(uuid.uuid4())
    uri = os.getenv("NEO4J_URI", "").strip()
    password = os.getenv("NEO4J_PASSWORD", "").strip()
    if not uri or not password:
        raise HTTPException(
            status_code=503,
            detail="Neo4j is not configured — set NEO4J_URI and NEO4J_PASSWORD (no stub graph in production mode).",
        )
    live = _neo4j_impact(body.asset_id, body.horizon_hours, request_id)
    if live is not None:
        return live
    raise HTTPException(
        status_code=503,
        detail="Neo4j query failed or returned no data. Check credentials, seed data, and asset_id.",
    )


if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="spa")
else:

    @app.get("/")
    def root() -> dict:
        return {
            "service": SERVICE_SLUG,
            "docs": "/docs",
            "health": "/health",
            "ui": "(dev: Vite :5173 → proxy :8103)",
        }
