# Phase 5: Contract Workflow

## Goal

Make lease terms and lifecycle validity explicit for property managers.

## Implemented

- Added `GET /contracts` to the NestJS API.
- Added property and tenant relationships through stable IDs.
- Added ISO calendar-date and lifecycle-state validation.
- Added service tests for upcoming, active, expired, and terminated contracts, including invalid dates.
- Connected the Contracts screen to API-backed data and tenant names.
- Derived active and renewal-review metrics from returned contract records.

## Current boundary

The contract endpoint remains an in-memory read model. Create/update mutations, persistence, authentication, and authorization remain follow-up work.

## Verification

The contract lifecycle unit tests and contracts API e2e test pass. The browser screen displays the returned lease records and derived status labels.

Next step: introduce persistence and mutation boundaries, beginning with the payment workflow.