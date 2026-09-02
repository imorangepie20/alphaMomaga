# Phase 11: Protected Tenant Mutation

## Goal

Apply the server-owned role policy to a real business mutation while preserving clear authentication and authorization responses.

## Implemented

- Added `POST /tenants` for creating a tenant record in the current in-memory model.
- Added explicit tenant input validation at the controller boundary.
- Added reusable permission metadata and `PermissionsGuard`.
- Required `tenant:manage` for tenant creation.
- Allowed Admin and Property Manager roles through the existing policy.
- Denied Finance and Inspector roles with HTTP `403`.
- Kept missing identity failures at HTTP `401` and invalid input at HTTP `400`.
- Added unit and end-to-end coverage for the authorization boundary.

## Current boundary

Tenant creation is still in-memory and is not yet persisted. Authentication uses the signed JWT boundary when configured and the explicitly enabled local demo role fallback for development tests. Production identity, database transactions, audit logging, and mutation workflows remain follow-up work.

## Verification

The full API unit and e2e suites, API build, frontend lint, and protected tenant mutation tests pass.

Next step: add database persistence and audit records before expanding write operations across contracts, payments, and maintenance.