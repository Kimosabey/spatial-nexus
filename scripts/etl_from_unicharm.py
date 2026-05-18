"""Unicharm (MySQL) → Neo4j topology ETL for SpatialNexus.

One-shot, idempotent. Run again to refresh — every write is a MERGE.

Reads from these unicharm tables:
    organization
    campus
    building
    floor
    area                            (zone_id refers to gl_location)
    gl_location                     (the canonical "zone"; self-parent via zone_parent)
    gl_subsystem                    (self-parent via ss_parent)
    gl_location_subsystem_map       (zone_id ↔ ss_id)
    gateway, gateway_mapping        (zone_id ↔ gateway_id)

Writes these Neo4j labels:
    Organization, Campus, Building, Floor, Area, Location, Subsystem, Gateway

Relationships:
    (Campus)-[:PART_OF]->(Organization)
    (Building)-[:LOCATED_IN]->(Campus)
    (Floor)-[:LOCATED_IN]->(Building)
    (Area)-[:LOCATED_IN]->(Location)
    (Location)-[:PART_OF]->(Location)        # zone_parent
    (Subsystem)-[:PART_OF]->(Subsystem)      # ss_parent
    (Subsystem)-[:LOCATED_IN]->(Location)    # via gl_location_subsystem_map
    (Gateway)-[:SERVES]->(Location)          # via gateway_mapping

Env vars (with defaults that match a typical Neo4j Desktop local DBMS):
    MYSQL_HOST=127.0.0.1  MYSQL_PORT=3306  MYSQL_DB=unicharm
    MYSQL_USER=root       MYSQL_PASSWORD=

    NEO4J_URI=bolt://127.0.0.1:7687
    NEO4J_USER=neo4j
    NEO4J_PASSWORD=neo4j

Usage:
    pip install mysql-connector-python neo4j
    python scripts/etl_from_unicharm.py            # run ETL
    python scripts/etl_from_unicharm.py --dry-run  # print counts only, no Neo4j writes
    python scripts/etl_from_unicharm.py --wipe     # CAUTION: MATCH (n) DETACH DELETE n first

Once it finishes, /v1/impact and /v1/graph/subgraph will return real building
topology instead of 503.
"""
from __future__ import annotations

import argparse
import os
import sys
from contextlib import closing
from typing import Any, Iterable

try:
    import mysql.connector
except ImportError:
    print("ERROR: mysql-connector-python is not installed.")
    print("  pip install mysql-connector-python")
    sys.exit(2)

try:
    from neo4j import GraphDatabase
except ImportError:
    print("ERROR: neo4j Python driver is not installed.")
    print("  pip install neo4j")
    sys.exit(2)


MYSQL_CFG = {
    "host": os.getenv("MYSQL_HOST", "127.0.0.1"),
    "port": int(os.getenv("MYSQL_PORT", "3306")),
    "database": os.getenv("MYSQL_DB", "unicharm"),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", ""),
    "connection_timeout": 10,
}
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://127.0.0.1:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "neo4j")


# --- helpers ------------------------------------------------------------------


def rows(cur, sql: str, *params) -> list[dict]:
    cur.execute(sql, params)
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def table_exists(cur, name: str) -> bool:
    cur.execute(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = %s AND table_name = %s",
        (MYSQL_CFG["database"], name),
    )
    return cur.fetchone() is not None


def safe_rows(cur, name: str, sql: str) -> list[dict]:
    if not table_exists(cur, name):
        print(f"  [skip] table '{name}' not present in {MYSQL_CFG['database']}")
        return []
    cur.execute(sql)
    cols = [c[0] for c in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def batch(items: Iterable[dict], n: int = 500) -> Iterable[list[dict]]:
    buf: list[dict] = []
    for it in items:
        buf.append(it)
        if len(buf) >= n:
            yield buf
            buf = []
    if buf:
        yield buf


# --- Cypher writers -----------------------------------------------------------


CONSTRAINTS = [
    "CREATE CONSTRAINT org_id IF NOT EXISTS FOR (n:Organization) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT campus_id IF NOT EXISTS FOR (n:Campus) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT building_id IF NOT EXISTS FOR (n:Building) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT floor_id IF NOT EXISTS FOR (n:Floor) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT area_id IF NOT EXISTS FOR (n:Area) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT location_id IF NOT EXISTS FOR (n:Location) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT subsystem_id IF NOT EXISTS FOR (n:Subsystem) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT gateway_id IF NOT EXISTS FOR (n:Gateway) REQUIRE n.id IS UNIQUE",
]


def write_nodes(session, label: str, items: list[dict]) -> int:
    """MERGE one label, setting all attributes from each dict."""
    if not items:
        return 0
    n_total = 0
    cypher = (
        f"UNWIND $rows AS row "
        f"MERGE (n:{label} {{id: row.id}}) "
        f"SET n += row"
    )
    for chunk in batch(items):
        session.execute_write(lambda tx, c=chunk: tx.run(cypher, rows=c).consume())
        n_total += len(chunk)
    return n_total


def write_rel(
    session,
    src_label: str,
    src_key_in_row: str,
    rel: str,
    dst_label: str,
    dst_key_in_row: str,
    items: list[dict],
) -> int:
    if not items:
        return 0
    n_total = 0
    cypher = (
        f"UNWIND $rows AS row "
        f"MATCH (a:{src_label} {{id: row.{src_key_in_row}}}) "
        f"MATCH (b:{dst_label} {{id: row.{dst_key_in_row}}}) "
        f"MERGE (a)-[:{rel}]->(b)"
    )
    for chunk in batch(items):
        # filter rows missing either id
        chunk = [r for r in chunk if r.get(src_key_in_row) and r.get(dst_key_in_row)]
        if not chunk:
            continue
        session.execute_write(lambda tx, c=chunk: tx.run(cypher, rows=c).consume())
        n_total += len(chunk)
    return n_total


# --- main ---------------------------------------------------------------------


def extract(cur) -> dict[str, list[dict]]:
    print("Extracting from MySQL…")
    data = {
        "organization": safe_rows(cur, "organization", "SELECT id, name FROM organization"),
        "campus": safe_rows(cur, "campus", "SELECT id, name, organization_id FROM campus"),
        "building": safe_rows(cur, "building", "SELECT id, name, campus_id FROM building"),
        "floor": safe_rows(
            cur,
            "floor",
            "SELECT id, name, building_id, type, floor_number FROM floor",
        ),
        "area": safe_rows(cur, "area", "SELECT id, name, zone_id FROM area"),
        "gl_location": safe_rows(
            cur,
            "gl_location",
            "SELECT id, name, zone_tag, zone_type, zone_status, zone_parent FROM gl_location",
        ),
        "gl_subsystem": safe_rows(
            cur,
            "gl_subsystem",
            "SELECT id, name, ss_tag, ss_type, ss_status, ss_parent FROM gl_subsystem",
        ),
        "gl_location_subsystem_map": safe_rows(
            cur,
            "gl_location_subsystem_map",
            "SELECT zone_id, ss_id FROM gl_location_subsystem_map",
        ),
        "gateway": safe_rows(cur, "gateway", "SELECT id, name, ip, status FROM gateway"),
        "gateway_mapping": safe_rows(
            cur, "gateway_mapping", "SELECT zone_id, gateway_id FROM gateway_mapping"
        ),
    }
    for k, v in data.items():
        print(f"  {k:30s} {len(v):>6d} rows")
    return data


def coerce_str_ids(data: dict[str, list[dict]]) -> None:
    """Neo4j is happier with string ids than UUID objects."""
    for tbl, list_ in data.items():
        for r in list_:
            for k in list(r.keys()):
                if k.endswith("_id") or k == "id":
                    v = r[k]
                    r[k] = str(v) if v is not None else None
                else:
                    if r[k] is None:
                        continue


def load(data: dict[str, list[dict]], wipe: bool) -> None:
    print(f"\nConnecting to Neo4j at {NEO4J_URI} as {NEO4J_USER}")
    drv = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    try:
        drv.verify_connectivity()
    except Exception as e:
        print(f"ERROR: cannot connect to Neo4j: {e}")
        print("  Open Neo4j Desktop, start your DBMS, then re-run.")
        sys.exit(3)

    with drv.session() as session:
        if wipe:
            print("WIPE: deleting all nodes/relationships first…")
            session.execute_write(lambda tx: tx.run("MATCH (n) DETACH DELETE n").consume())

        print("Creating uniqueness constraints…")
        for c in CONSTRAINTS:
            session.execute_write(lambda tx, q=c: tx.run(q).consume())

        print("\nWriting nodes…")
        # Organization
        n = write_nodes(session, "Organization", data["organization"])
        print(f"  Organization     {n}")
        # Campus
        n = write_nodes(session, "Campus", [{"id": r["id"], "name": r["name"]} for r in data["campus"]])
        print(f"  Campus           {n}")
        # Building
        n = write_nodes(session, "Building", [{"id": r["id"], "name": r["name"]} for r in data["building"]])
        print(f"  Building         {n}")
        # Floor
        n = write_nodes(
            session,
            "Floor",
            [
                {"id": r["id"], "name": r["name"], "type": r.get("type"), "floor_number": r.get("floor_number")}
                for r in data["floor"]
            ],
        )
        print(f"  Floor            {n}")
        # Area
        n = write_nodes(session, "Area", [{"id": r["id"], "name": r["name"]} for r in data["area"]])
        print(f"  Area             {n}")
        # Location (gl_location)
        n = write_nodes(
            session,
            "Location",
            [
                {
                    "id": r["id"],
                    "name": r.get("name"),
                    "zone_tag": r.get("zone_tag"),
                    "zone_type": r.get("zone_type"),
                    "zone_status": r.get("zone_status"),
                }
                for r in data["gl_location"]
            ],
        )
        print(f"  Location         {n}")
        # Subsystem
        n = write_nodes(
            session,
            "Subsystem",
            [
                {
                    "id": r["id"],
                    "name": r.get("name"),
                    "ss_tag": r.get("ss_tag"),
                    "ss_type": r.get("ss_type"),
                    "ss_status": r.get("ss_status"),
                }
                for r in data["gl_subsystem"]
            ],
        )
        print(f"  Subsystem        {n}")
        # Gateway
        n = write_nodes(
            session,
            "Gateway",
            [{"id": r["id"], "name": r.get("name"), "ip": r.get("ip"), "status": r.get("status")} for r in data["gateway"]],
        )
        print(f"  Gateway          {n}")

        print("\nWriting relationships…")
        n = write_rel(session, "Campus", "id", "PART_OF", "Organization", "organization_id", data["campus"])
        print(f"  Campus -[:PART_OF]-> Organization     {n}")
        n = write_rel(session, "Building", "id", "LOCATED_IN", "Campus", "campus_id", data["building"])
        print(f"  Building -[:LOCATED_IN]-> Campus      {n}")
        n = write_rel(session, "Floor", "id", "LOCATED_IN", "Building", "building_id", data["floor"])
        print(f"  Floor -[:LOCATED_IN]-> Building       {n}")
        # area.zone_id → gl_location (assumption)
        n = write_rel(session, "Area", "id", "LOCATED_IN", "Location", "zone_id", data["area"])
        print(f"  Area -[:LOCATED_IN]-> Location        {n}")
        n = write_rel(
            session,
            "Location",
            "id",
            "PART_OF",
            "Location",
            "zone_parent",
            data["gl_location"],
        )
        print(f"  Location -[:PART_OF]-> Location       {n}")
        n = write_rel(
            session,
            "Subsystem",
            "id",
            "PART_OF",
            "Subsystem",
            "ss_parent",
            data["gl_subsystem"],
        )
        print(f"  Subsystem -[:PART_OF]-> Subsystem     {n}")
        n = write_rel(
            session,
            "Subsystem",
            "ss_id",
            "LOCATED_IN",
            "Location",
            "zone_id",
            data["gl_location_subsystem_map"],
        )
        print(f"  Subsystem -[:LOCATED_IN]-> Location   {n}")
        n = write_rel(
            session,
            "Gateway",
            "gateway_id",
            "SERVES",
            "Location",
            "zone_id",
            data["gateway_mapping"],
        )
        print(f"  Gateway -[:SERVES]-> Location         {n}")

        # Final counts
        print("\nGraph summary:")
        for lbl in ("Organization", "Campus", "Building", "Floor", "Area", "Location", "Subsystem", "Gateway"):
            r = session.run(f"MATCH (n:{lbl}) RETURN count(n) AS c").single()
            print(f"  {lbl:14s} {r['c']:>6d} nodes")

    drv.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="extract only; do not write to Neo4j")
    parser.add_argument("--wipe", action="store_true", help="MATCH (n) DETACH DELETE n before loading")
    args = parser.parse_args()

    print(f"MySQL: {MYSQL_CFG['user']}@{MYSQL_CFG['host']}:{MYSQL_CFG['port']}/{MYSQL_CFG['database']}")
    try:
        conn = mysql.connector.connect(**MYSQL_CFG)
    except mysql.connector.Error as e:
        print(f"ERROR: cannot connect to MySQL: {e}")
        sys.exit(3)

    with closing(conn) as c, closing(c.cursor()) as cur:
        data = extract(cur)

    coerce_str_ids(data)

    if args.dry_run:
        print("\n[dry-run] No Neo4j writes.")
        return
    load(data, wipe=args.wipe)
    print("\nDone. Try:")
    print('  curl "http://127.0.0.1:8103/v1/graph/subgraph?seed=<location_id>&depth=2"')


if __name__ == "__main__":
    main()
