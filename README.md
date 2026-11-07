# AHOE — AI Housing Opportunity Engine

AHOE is a demonstration-first workspace for exploring housing opportunity screening, zoning research, development feasibility, affordability scenarios, regional context, and reports.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The workspace runs without API credentials or a database. Parcel records, zoning excerpts, housing indicators, environmental flags, and regional comparisons are generated synthetic values.

## What works in this demo

- Search 100 generated parcel records by APN, site label, city, or opportunity category.
- Filter and rank the records, inspect score factors, save sites in browser storage, and open parcel profiles.
- Explore generated parcel polygons in a MapLibre map using OpenStreetMap raster tiles.
- Ask zoning questions against fictional source excerpts with provenance and uncertainty shown.
- Change assumptions and run deterministic parcel capacity, development cost, gross rent, NOI, and yield calculations.
- Model an illustrative affordable share and rent mix.
- Ask the deterministic housing assistant about the current synthetic dataset.
- Download a structured property brief and opportunity ranking as JSON or CSV.
- Use workspace, notification, team invitation, organization, and administration screens in clearly labeled demo mode.

## Data and safety boundary

The interface prominently labels generated content as **DEMONSTRATION DATA — NOT VERIFIED PROPERTY INFORMATION**. The area has no configured authoritative parcel, zoning, housing, financial, or environmental integrations. It does not implement production authentication or server-enforced roles; invitation and workspace actions are local demonstrations. Do not use it for real property decisions, legal or entitlement advice, underwriting, environmental screening, or confidential data.

The local API is a stateless Next.js demonstration provider. It has no authentication and must not be exposed publicly. See [the API contract](docs/openapi.yaml), [architecture notes](docs/architecture.md), [user guide](docs/user-guide.md), and [deployment notes](docs/deployment.md).

An optional standalone FastAPI implementation is documented in [backend/README.md](backend/README.md). It is a local development API and is not wired into the UI.

## Commands

```bash
npm run dev        # local development server
npm run lint       # ESLint
npm run typecheck  # TypeScript check
npm test           # deterministic calculation and demo-data checks
npm run build      # production bundle check
```

## Database foundation

`db/migrations/001_initial_schema.sql` describes the Postgres/PostGIS/pgvector data model, spatial indexes, temporal fields, and organization-scoped row-level security policies. The browser demo does not connect to this schema. Apply it only after provisioning a compatible database and trusted authentication middleware that validates membership before setting the organization and user session variables.

## Environment

Copy `.env.example` to `.env.local` to configure future integrations. The demo does not require these values and intentionally has no hardcoded credentials.
