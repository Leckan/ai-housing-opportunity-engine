# Deployment notes

## Local demonstration

Run `npm install` and `npm run dev`, then open `http://localhost:3000`. The Next.js application serves the synthetic API locally and requires no database, model key, or provider account.

## Preview deployment

The Next.js interface can be built with `npm run build` and served with `npm run start` in an environment that permits listening on the configured port. Keep preview access restricted to the intended audience, and identify the environment as a synthetic demonstration. The standalone FastAPI service is optional and should stay bound to localhost.

## Production readiness gate

This repository is not ready for a public production deployment. Before exposing user or parcel data, implement and independently verify authentication, email and password recovery, server-side role enforcement, membership-aware organization isolation, API rate limits, upload controls, audit retention, secure secret storage, backups, provider license handling, and security monitoring. The SQL migration is a schema starting point, not evidence that the Next.js or FastAPI demo is connected to a secured database.

Before enabling real parcel screening, select a pilot municipality and verify parcel and geometry licensing, authoritative zoning sources, update dates, coverage, housing indicators, environmental sources, and permitted use. Replace synthetic fixtures only through adapters that preserve source metadata and classification.

## Environment variables

`.env.example` lists the future integration settings. Keep private credentials in server-side environment variables; never expose them through `NEXT_PUBLIC_*`. No production credentials are needed for the demo.
