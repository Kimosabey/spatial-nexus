// Unicharm HVAC topology seed — property-based MATCHes throughout so
// cypher-shell statement isolation is not an issue.
// Run: cat scripts/seed.cypher | docker compose exec -T neo4j cypher-shell -u neo4j -p spatialdevpassword

// ── WIPE existing demo nodes (idempotent restart) ─────────────────────────
MATCH (n) DETACH DELETE n;

// ── Site hierarchy ────────────────────────────────────────────────────────
MERGE (:organization {id:'ORG-UNICHARM',   name:'Unicharm'});
MERGE (:campus       {id:'CAMPUS-UNICHARM', name:'Unicharm Campus'});
MERGE (:building     {id:'BLDG-UNICHARM-HQ',name:'Unicharm HQ'});
MERGE (:zone         {id:'ZONE-PLANT',     name:'Plant Room',         zone_type:'mechanical'});
MERGE (:zone         {id:'ZONE-COOLING',   name:'Cooling Equipment',  zone_type:'mechanical'});
MERGE (:zone         {id:'ZONE-ELEC',      name:'Electrical Room',    zone_type:'electrical'});
MERGE (:zone         {id:'ZONE-RISER-A',   name:'Riser A',            zone_type:'riser'});
MERGE (:zone         {id:'ZONE-RISER-B',   name:'Riser B',            zone_type:'riser'});

// ── Assets ────────────────────────────────────────────────────────────────
MERGE (:asset {id:'PLANT-UNICHARM',     name:'Unicharm Central Plant',    kind:'plant'});
MERGE (:asset {id:'CH-0001b00000',      name:'Chiller 1',                 kind:'chiller',         ss_id:'0001b00000'});
MERGE (:asset {id:'CH-0002b00000',      name:'Chiller 2',                 kind:'chiller',         ss_id:'0002b00000'});
MERGE (:asset {id:'CONDPU-0001b40000',  name:'Condenser Pump 1',          kind:'condenser_pump',  ss_id:'0001b40000'});
MERGE (:asset {id:'CONDPU-0002b40000',  name:'Condenser Pump 2',          kind:'condenser_pump',  ss_id:'0002b40000'});
MERGE (:asset {id:'CONDPU-0003b40000',  name:'Condenser Pump 3',          kind:'condenser_pump',  ss_id:'0003b40000'});
MERGE (:asset {id:'CT-0001b70000',      name:'Cooling Tower 1',           kind:'cooling_tower',   ss_id:'0001b70000'});
MERGE (:asset {id:'CT-0002b70000',      name:'Cooling Tower 2',           kind:'cooling_tower',   ss_id:'0002b70000'});
MERGE (:asset {id:'PV-0001b20000',      name:'Primary Pump 1',            kind:'primary_pump',    ss_id:'0001b20000'});
MERGE (:asset {id:'PRISEQ-0001cb0000',  name:'Primary Sequencer',         kind:'primary_pump',    ss_id:'0001cb0000'});
MERGE (:asset {id:'CPM-0001bc0000',     name:'Condenser Pump Master',     kind:'pump_master',     ss_id:'0001bc0000'});
MERGE (:asset {id:'MWP-0001150000',     name:'Make-up Water Pump 1',      kind:'makeup_pump',     ss_id:'0001150000'});
MERGE (:asset {id:'MWP-0002150000',     name:'Make-up Water Pump 2',      kind:'makeup_pump',     ss_id:'0002150000'});
MERGE (:asset {id:'BTM-0001110000',     name:'Building Telemetry Module',  kind:'btm',             ss_id:'0001110000'});
MERGE (:asset {id:'COH-0001c00000',     name:'Condenser Heat Exchanger',   kind:'coh',             ss_id:'0001c00000'});
MERGE (:asset {id:'COHW-0001c10000',    name:'CHW Heat Exchanger',         kind:'cohw',            ss_id:'0001c10000'});
MERGE (:asset {id:'EM-0001000000',  name:'Energy Meter 1',  kind:'energy_meter', ss_id:'0001000000'});
MERGE (:asset {id:'EM-0002000000',  name:'Energy Meter 2',  kind:'energy_meter', ss_id:'0002000000'});
MERGE (:asset {id:'EM-0003000000',  name:'Energy Meter 3',  kind:'energy_meter', ss_id:'0003000000'});
MERGE (:asset {id:'EM-0004000000',  name:'Energy Meter 4',  kind:'energy_meter', ss_id:'0004000000'});
MERGE (:asset {id:'EM-0005000000',  name:'Energy Meter 5',  kind:'energy_meter', ss_id:'0005000000'});
MERGE (:asset {id:'EM-0006000000',  name:'Energy Meter 6',  kind:'energy_meter', ss_id:'0006000000'});
MERGE (:asset {id:'EM-0007000000',  name:'Energy Meter 7',  kind:'energy_meter', ss_id:'0007000000'});
MERGE (:asset {id:'EM-0008000000',  name:'Energy Meter 8',  kind:'energy_meter', ss_id:'0008000000'});
MERGE (:asset {id:'EM-0009000000',  name:'Energy Meter 9',  kind:'energy_meter', ss_id:'0009000000'});
MERGE (:asset {id:'EM-000a000000',  name:'Energy Meter 10', kind:'energy_meter', ss_id:'000a000000'});
MERGE (:asset {id:'EM-000b000000',  name:'Energy Meter 11', kind:'energy_meter', ss_id:'000b000000'});
MERGE (:asset {id:'EM-000c000000',  name:'Energy Meter 12', kind:'energy_meter', ss_id:'000c000000'});
MERGE (:asset {id:'PUMP-A1',        name:'Chilled water pump A1', kind:'pump'});

// ── Site hierarchy edges ──────────────────────────────────────────────────
MATCH (a {id:'ORG-UNICHARM'}),    (b {id:'CAMPUS-UNICHARM'})  MERGE (a)-[:CONTAINS]->(b);
MATCH (a {id:'CAMPUS-UNICHARM'}), (b {id:'BLDG-UNICHARM-HQ'}) MERGE (a)-[:CONTAINS]->(b);
MATCH (a {id:'BLDG-UNICHARM-HQ'}),(b {id:'ZONE-PLANT'})       MERGE (a)-[:CONTAINS]->(b);
MATCH (a {id:'BLDG-UNICHARM-HQ'}),(b {id:'ZONE-COOLING'})     MERGE (a)-[:CONTAINS]->(b);
MATCH (a {id:'BLDG-UNICHARM-HQ'}),(b {id:'ZONE-ELEC'})        MERGE (a)-[:CONTAINS]->(b);
MATCH (a {id:'BLDG-UNICHARM-HQ'}),(b {id:'ZONE-RISER-A'})     MERGE (a)-[:CONTAINS]->(b);
MATCH (a {id:'BLDG-UNICHARM-HQ'}),(b {id:'ZONE-RISER-B'})     MERGE (a)-[:CONTAINS]->(b);

// ── Assets → zones ────────────────────────────────────────────────────────
MATCH (a {id:'PLANT-UNICHARM'}),    (z {id:'ZONE-PLANT'})   MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'CH-0001b00000'}),     (z {id:'ZONE-PLANT'})   MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'CH-0002b00000'}),     (z {id:'ZONE-PLANT'})   MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'PV-0001b20000'}),     (z {id:'ZONE-PLANT'})   MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'PRISEQ-0001cb0000'}), (z {id:'ZONE-PLANT'})   MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'COHW-0001c10000'}),   (z {id:'ZONE-PLANT'})   MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'CT-0001b70000'}),     (z {id:'ZONE-COOLING'}) MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'CT-0002b70000'}),     (z {id:'ZONE-COOLING'}) MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'CONDPU-0001b40000'}), (z {id:'ZONE-COOLING'}) MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'CONDPU-0002b40000'}), (z {id:'ZONE-COOLING'}) MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'CONDPU-0003b40000'}), (z {id:'ZONE-COOLING'}) MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'CPM-0001bc0000'}),    (z {id:'ZONE-COOLING'}) MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'MWP-0001150000'}),    (z {id:'ZONE-COOLING'}) MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'MWP-0002150000'}),    (z {id:'ZONE-COOLING'}) MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'COH-0001c00000'}),    (z {id:'ZONE-COOLING'}) MERGE (a)-[:LOCATED_IN]->(z);
MATCH (a {id:'BTM-0001110000'}),    (z {id:'ZONE-ELEC'})    MERGE (a)-[:LOCATED_IN]->(z);

// ── Chilled-water circuit ─────────────────────────────────────────────────
MATCH (a {id:'PLANT-UNICHARM'}),  (b {id:'CH-0001b00000'})   MERGE (a)-[:CONTAINS]->(b);
MATCH (a {id:'PLANT-UNICHARM'}),  (b {id:'CH-0002b00000'})   MERGE (a)-[:CONTAINS]->(b);
MATCH (a {id:'CH-0001b00000'}),   (b {id:'PV-0001b20000'})   MERGE (a)-[:SUPPLIES]->(b);
MATCH (a {id:'CH-0002b00000'}),   (b {id:'PV-0001b20000'})   MERGE (a)-[:SUPPLIES]->(b);
MATCH (a {id:'CH-0001b00000'}),   (b {id:'PRISEQ-0001cb0000'}) MERGE (a)-[:SUPPLIES]->(b);
MATCH (a {id:'CH-0002b00000'}),   (b {id:'PRISEQ-0001cb0000'}) MERGE (a)-[:SUPPLIES]->(b);
MATCH (a {id:'PV-0001b20000'}),   (b {id:'ZONE-RISER-A'})   MERGE (a)-[:SUPPLIES]->(b);
MATCH (a {id:'PRISEQ-0001cb0000'}),(b {id:'ZONE-RISER-B'})   MERGE (a)-[:SUPPLIES]->(b);

// ── Condenser-water circuit ───────────────────────────────────────────────
MATCH (a {id:'CONDPU-0001b40000'}),(b {id:'CT-0001b70000'})  MERGE (a)-[:FEEDS]->(b);
MATCH (a {id:'CONDPU-0002b40000'}),(b {id:'CT-0001b70000'})  MERGE (a)-[:FEEDS]->(b);
MATCH (a {id:'CONDPU-0003b40000'}),(b {id:'CT-0002b70000'})  MERGE (a)-[:FEEDS]->(b);
MATCH (a {id:'CT-0001b70000'}),    (b {id:'COH-0001c00000'}) MERGE (a)-[:FEEDS]->(b);
MATCH (a {id:'CT-0002b70000'}),    (b {id:'COH-0001c00000'}) MERGE (a)-[:FEEDS]->(b);
MATCH (a {id:'COH-0001c00000'}),   (b {id:'CH-0001b00000'})  MERGE (a)-[:FEEDS]->(b);
MATCH (a {id:'COH-0001c00000'}),   (b {id:'CH-0002b00000'})  MERGE (a)-[:FEEDS]->(b);
MATCH (a {id:'COHW-0001c10000'}),  (b {id:'CH-0001b00000'})  MERGE (a)-[:FEEDS]->(b);
MATCH (a {id:'COHW-0001c10000'}),  (b {id:'CH-0002b00000'})  MERGE (a)-[:FEEDS]->(b);
MATCH (a {id:'CPM-0001bc0000'}),   (b {id:'CONDPU-0001b40000'}) MERGE (a)-[:CONTROLS]->(b);
MATCH (a {id:'CPM-0001bc0000'}),   (b {id:'CONDPU-0002b40000'}) MERGE (a)-[:CONTROLS]->(b);
MATCH (a {id:'CPM-0001bc0000'}),   (b {id:'CONDPU-0003b40000'}) MERGE (a)-[:CONTROLS]->(b);

// ── Make-up water ─────────────────────────────────────────────────────────
MATCH (a {id:'MWP-0001150000'}),(b {id:'CT-0001b70000'}) MERGE (a)-[:FEEDS]->(b);
MATCH (a {id:'MWP-0002150000'}),(b {id:'CT-0002b70000'}) MERGE (a)-[:FEEDS]->(b);

// ── Energy meters ─────────────────────────────────────────────────────────
MATCH (a {id:'EM-0001000000'}),(b {id:'CH-0001b00000'})     MERGE (a)-[:MONITORS]->(b);
MATCH (a {id:'EM-0002000000'}),(b {id:'CH-0002b00000'})     MERGE (a)-[:MONITORS]->(b);
MATCH (a {id:'EM-0003000000'}),(b {id:'CONDPU-0001b40000'}) MERGE (a)-[:MONITORS]->(b);
MATCH (a {id:'EM-0004000000'}),(b {id:'CONDPU-0002b40000'}) MERGE (a)-[:MONITORS]->(b);
MATCH (a {id:'EM-0005000000'}),(b {id:'CONDPU-0003b40000'}) MERGE (a)-[:MONITORS]->(b);
MATCH (a {id:'EM-0006000000'}),(b {id:'CT-0001b70000'})     MERGE (a)-[:MONITORS]->(b);
MATCH (a {id:'EM-0007000000'}),(b {id:'CT-0002b70000'})     MERGE (a)-[:MONITORS]->(b);
MATCH (a {id:'EM-0008000000'}),(b {id:'PV-0001b20000'})     MERGE (a)-[:MONITORS]->(b);
MATCH (a {id:'EM-0009000000'}),(b {id:'PRISEQ-0001cb0000'}) MERGE (a)-[:MONITORS]->(b);
MATCH (a {id:'EM-000a000000'}),(b {id:'MWP-0001150000'})    MERGE (a)-[:MONITORS]->(b);
MATCH (a {id:'EM-000b000000'}),(b {id:'MWP-0002150000'})    MERGE (a)-[:MONITORS]->(b);
MATCH (a {id:'EM-000c000000'}),(b {id:'PLANT-UNICHARM'})    MERGE (a)-[:MONITORS]->(b);

// ── BTM monitors building ────────────────────────────────────────────────
MATCH (a {id:'BTM-0001110000'}),(b {id:'BLDG-UNICHARM-HQ'}) MERGE (a)-[:MONITORS]->(b);

// ── Original demo (backward-compat) ──────────────────────────────────────
MERGE (:bus  {id:'BUS-A',   name:'BUS-A upstream'});
MERGE (:load {id:'LOAD-12', name:'Feeder LOAD-12'});
MATCH (a {id:'BUS-A'}),   (b {id:'PUMP-A1'})  MERGE (a)-[:FEEDS]->(b);
MATCH (a {id:'PUMP-A1'}), (b {id:'LOAD-12'})  MERGE (a)-[:SUPPLIES]->(b);
