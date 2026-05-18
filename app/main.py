import os

from fastapi import FastAPI

SERVICE_SLUG = "spatial-nexus"
PORT = int(os.getenv("PORT", "8103"))

app = FastAPI(
    title="SpatialNexus",
    description="Neo4j GraphRAG / topology (scaffold).",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": SERVICE_SLUG, "port": PORT}


@app.get("/")
def root() -> dict:
    return {
        "service": SERVICE_SLUG,
        "docs": "/docs",
        "health": "/health",
    }
