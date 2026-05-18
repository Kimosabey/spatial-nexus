# SpatialNexus web UI

Impact analysis UI with `POST /v1/impact`. Dev proxy targets port **8103**.

Configure `NEO4J_URI`, `NEO4J_USER`, and `NEO4J_PASSWORD` on the API for live graph reads; otherwise the API returns a structured stub.

The **Graph explorer** uses `@xyflow/react` to pan/zoom the nodes and edges from the same API response.
