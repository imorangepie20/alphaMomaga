# Phase 10: Authentication Boundary

## Goal

Create a server-side identity boundary that can feed the existing role policy without introducing insecure demo credentials.

## Implemented

- Added an `AuthService` that verifies RS256 Bearer tokens against a configured JWKS endpoint, issuer, and audience.
- Added a development-only `AuthGuard` fallback that accepts a validated `x-demo-role` header only when explicitly enabled.
- Added `GET /auth/me` to expose the resolved authenticated principal.
- Rejects missing or unknown roles with HTTP `401`.
- Rejects all requests through this temporary mechanism when `NODE_ENV=production`.
- Added `api/.env.example` with the required identity-provider configuration.
- Added unit and API end-to-end tests.

## Current boundary

This phase verifies externally issued RS256 tokens but does not issue login tokens. The `x-demo-role` fallback is disabled by default and must remain disabled outside local development. The next security phase must connect a real identity provider and apply the guard to protected mutations.

## Verification

The auth guard unit tests and API end-to-end tests pass. No plaintext credentials were added.