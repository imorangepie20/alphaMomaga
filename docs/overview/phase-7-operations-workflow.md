# Phase 7: Operations Workflow

## Goal

Make maintenance work orders and property inspections visible through validated server-owned records.

## Implemented

- Added `GET /maintenance` and `GET /inspections` to the NestJS API.
- Added ISO date and lifecycle validation for work orders and inspection completion dates.
- Added inspection priority to support urgent operational review.
- Added focused service and API end-to-end tests.
- Connected both Korean admin screens to API adapters with fallback data.
- Derived workload, completion, review, and urgent KPI counts from returned records.

## Current boundary

Both endpoints remain in-memory read models. Work-order mutations, assignees, vendors, attachments, persistence, authentication, and authorization remain follow-up work.

## Verification

All API unit tests, operations API e2e tests, API build, frontend lint, and browser route checks pass.

Next step: add persistence and role-based access control around operational mutations.