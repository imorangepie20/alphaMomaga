# Phase 4: Tenant Workflow

## Goal

Connect tenant payment visibility to the same server-owned read contract used by properties.

## Implemented

- Added `GET /tenants` to the NestJS API.
- Added an explicit tenant contract with property association, unit, rent, and payment status.
- Added a focused service test for tenant response shape.
- Connected the Tenants screen to the API adapter with a predictable fallback.
- Derived total, paid, and overdue tenant metrics from returned records.

## Current boundary

The tenant endpoint remains an in-memory read model. Persistence, tenant mutations, filtering, authentication, and role enforcement remain follow-up work.

## Verification

The focused tenant service test passes, and the browser should show four tenants with two paid, one overdue, and one pending record when the API is available.

Next step: add contract reads and validate tenant-to-contract lifecycle rules.