# Phase 8: RBAC Foundation

## Goal

Define server-owned roles and permissions before introducing authentication or protected mutations.

## Implemented

- Added typed roles: Admin, Property Manager, Finance, and Inspector.
- Added a centralized permission matrix in the API.
- Added `RolesService.can()` for reusable policy checks.
- Added `GET /admin/roles` as a read-only policy endpoint.
- Connected the Korean roles screen to the server policy with fallback data.
- Added policy unit tests and an API end-to-end test.

## Current boundary

No request is authorized by this phase yet because authentication and user identity do not exist. The policy is ready for a NestJS guard in the next security phase; exposing role definitions does not grant permissions.

## Verification

Role policy unit tests, API end-to-end tests, API build, frontend lint, and browser rendering pass.

Next step: add authentication and apply the policy to manager and administrator mutations.