# Architecture

## Current demonstration application

- **Web app:** Next.js App Router, React, TypeScript, Tailwind CSS v4, and Lucide icons.
- **API:** versioned Next.js route handlers under `/api/v1`. These routes provide a stateless synthetic provider with pagination, input checks, and structured errors where relevant.
- **Optional API service:** `backend/app` contains a standalone FastAPI/Pydantic synthetic provider with OpenAPI docs and the same broad local workflows. It is development-only and not connected to the Next.js UI or database schema.
- **Geospatial UI:** MapLibre GL JS renders generated parcel rectangles as GeoJSON over OpenStreetMap raster tiles. The generated polygons are not cadastral boundaries. The current map requests public OSM tiles from the browser.
- **Calculations:** deterministic TypeScript services calculate a weighted screening index, unit capacity, development cost, illustrative rent, NOI, and yield.
- **Persistence:** saved property IDs use browser local storage. Other demo actions are session-only.
- **Database contract:** the SQL migration defines tenant-aware tables, PostGIS geometries and spatial indexes, pgvector document chunks, temporal source records, and RLS policies.

## Production evolution

1. Select a first municipality only after confirming source coverage, update cadence, data rights, and a pilot partner.
2. Implement authenticated server sessions, verified organization membership, role checks, and audit events before accepting user or parcel data. The demo API is unauthenticated and unsuitable for deployment.
3. Add provider adapters for official parcel, zoning, housing, environmental, transit, and infrastructure datasets. Preserve retrieval timestamps, source licenses, versions, and classification on every record.
4. Run PostGIS operations server-side and serve filtered features or vector tiles. Never load countywide parcel files into the client.
5. Ingest official zoning documents with OCR, page-aware chunking, version tracking, and an evaluation corpus. Require citations and return an explicit unavailable answer when evidence is missing.
6. Keep financial calculations deterministic and versioned. Track assumptions and distinguish user inputs, official values, estimates, and synthetic seed data.
7. Move lengthy ingestion and reporting jobs to a background queue; add rate limiting, structured logs, backup/retention controls, and service health metrics.

## Current limitations

No production auth provider, email delivery, database connection, RAG/embedding service, background worker, billing provider, or verified dataset integration is active. The interface stages those workflows to demonstrate product direction; they do not provide the security or persistence guarantees of a deployed multi-tenant system.
