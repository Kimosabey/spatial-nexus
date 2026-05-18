// Demo topology — run: cat scripts/seed.cypher | docker compose exec -T neo4j cypher-shell -u neo4j -p spatialdevpassword
// Test asset_id: PUMP-A1

MERGE (p:asset {id: 'PUMP-A1'})
SET p.name = 'Chilled water pump A1'
MERGE (b:bus {id: 'BUS-A'})
SET b.name = 'BUS-A upstream'
MERGE (l:load {id: 'LOAD-12'})
SET l.name = 'Feeder LOAD-12'
MERGE (b)-[:FEEDS]->(p)
MERGE (p)-[:SUPPLIES]->(l);
