# Phase 6: Payment Workflow

## Goal

Make rent collection status and amount visibility explicit for property managers.

## Implemented

- Added `GET /payments` to the NestJS API.
- Added explicit property and contract relationships.
- Added validation for ISO due dates, won amounts, paid dates, and payment status timing.
- Added service tests for paid, pending, overdue, and cancelled states plus invalid records.
- Added an API end-to-end test for the collection response.
- Connected the Korean Payments screen to API-backed data and property names.
- Derived collected, pending, and overdue totals from returned amounts.

## Current boundary

The payment endpoint remains an in-memory read model. Reconciliation mutations, persistence, authentication, and authorization remain follow-up work.

## Verification

Payment unit and API end-to-end tests pass. The browser screen renders collection records and computed totals.

Next step: add maintenance work orders and inspection status tracking.