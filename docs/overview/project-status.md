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

## Immediate next goal

Convert the admin template into a real-estate management product by mapping domain-specific workflows onto the existing UI structure.

## Core workstreams

1. Real-estate dashboard customization
2. Domain model definition for property, tenant, contract, payment, maintenance
3. Auth and role-based access control
4. CRUD API and data persistence
5. Admin and manager workflows
6. Verification and bug fixing before expanding scope

## Rules

- Document every meaningful change.
- Do not postpone required work.
- Understand the overall flow before editing isolated parts.
- Validate each step before proceeding to the next.

## Verified property workflow

- `GET /properties` is served by the NestJS API.
- The Properties screen reads the API contract and falls back predictably when the API is unavailable.
- Property summary metrics are calculated from returned records.
- Browser verification confirms the dashboard loads without the calendar hydration warning.

## Next implementation slice

Add the tenant workflow with an explicit API contract, focused service tests, and a frontend list backed by the API.
