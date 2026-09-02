# Project Status

## Current state

- Repository root has a working workspace with a Next.js app under `web`.
- A NestJS API app exists under `api`.
- A prebuilt admin template is available in `SDTPL_ADM` and is suitable as the UI foundation.
- The template is a shadcn-style admin dashboard system with ready-made layouts, navigation, and chart widgets.

## What this means

The foundation is in place for a real-estate management application with:

- a modern dashboard UI,
- a backend API shell,
- and a reusable admin design system.

## Current implementation status

The admin template has been converted into a Korean property-management application under `SDTPL_ADM`, backed by a NestJS API under `api`.

Completed workflow slices:

1. Property portfolio reads and occupancy metrics.
2. Tenant records and payment-status metrics.
3. Contract reads with ISO date and lifecycle validation.
4. Payment reads with amount, due-date, and status validation.
5. Maintenance work orders and inspection records with operational status validation.
6. Server-owned role and permission policy definitions.
7. Signed Bearer JWT authentication boundary with an explicitly opt-in local demo fallback.

The management UI is Korean-first. Navigation, dashboard labels, breadcrumbs, shared shell labels, operations pages, and administrator role screens use Korean terminology.

## Runtime endpoints

- Local admin UI: `http://localhost:3001`
- Local API: `http://localhost:3100`
- Cloudflare admin UI: `https://mnre.approid.team/`
- Cloudflare API: `https://api.approid.team/`

The Cloudflare hostnames are staging access points to the local services, not a production deployment. The API origin must remain running for the tunnel routes to respond.

## Core workstreams

1. Real-estate dashboard customization
2. Domain model definition for property, tenant, contract, payment, maintenance
3. Auth and role-based access control
4. CRUD API and data persistence
5. Admin and manager workflows
6. Verification and bug fixing before expanding scope

## Verification status

- API unit tests: `23 passed`.
- API end-to-end tests: `6 passed`.
- API build: passed.
- Admin frontend lint: passed.
- Browser verification: dashboard, properties, tenants, contracts, payments, maintenance, inspections, and roles rendered successfully.
- Browser hydration warnings: none after making calendar date formatting deterministic.
- Public API smoke test: `https://api.approid.team/properties` returned HTTP `200` with four property records.
- Public admin hostname recovered after restarting the API origin; the earlier Cloudflare `502` was caused by the stopped local API service.
- Auth boundary tests: valid role principal, missing role rejection, and signed JWT configuration path are covered by unit/e2e tests.

## Rules

- Document every meaningful change.
- Do not postpone required work.
- Understand the overall flow before editing isolated parts.
- Validate each step before proceeding to the next.

## Next implementation slice

Connect the signed JWT boundary to the chosen identity provider, apply the role policy to protected mutations, and then introduce database persistence before adding write operations.
