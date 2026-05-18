# Changelog — SpatialNexus

## [Unreleased]

### Added
- `scripts/etl_from_unicharm.py` — idempotent ETL from a unicharm-shaped MySQL
  DB into Neo4j (Organization → Campus → Building → Floor → Area → Location;
  Subsystem + Gateway with self-parent + location maps). Includes `--dry-run`
  and `--wipe` flags. `scripts/README.md` documents env vars + Neo4j Desktop
  setup.
- `GET /v1/graph/subgraph` — variable-depth Cypher neighbourhood (depth 1..4,
  limit 1..500). Powers a multi-hop React Flow explorer beyond the one-hop
  `/v1/impact` view.
- Atlas Blueprint UI theme — cobalt + sage on ivory, DM Serif Display, IBM Plex
  Mono, blueprint grid, compass-rose watermark, isometric node graph hero.
- LAN-IP CORS via `CORS_ORIGIN_REGEX`.
- Suite share-URL script wired into `run-dev.{ps1,bat}`.
- Docs: `API.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `SCREENSHOTS.md`, banner SVG.

### Changed
- README: banner header, URL grid, doc index, new endpoint row.

## [0.1.0]

- Initial scaffold; `/v1/impact` against live Neo4j (no stub fallback in
  production); React Flow explorer wired to the impact payload.
