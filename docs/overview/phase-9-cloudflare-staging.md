# Phase 9: Cloudflare Staging Access

## Goal

Expose the local admin UI and API through HTTPS hostnames for external browser testing.

## Configured hostnames

- Admin UI: `https://mnre.approid.team/`
- API: `https://api.approid.team/`

## Operational requirement

Cloudflare Tunnel forwards to the local Next.js admin server on port `3001` and the NestJS API on port `3100`. Both origin processes must be running; stopping either origin can produce a Cloudflare `502 Bad gateway` response.

## Verification

- The API hostname returned HTTP `200` for `/properties` with four records.
- The admin hostname loaded the Korean management application after the API origin was restarted.
- The earlier `502` response was traced to the API origin not listening on port `3100`, not to an application route failure.

## Boundary

This is a staging tunnel for portfolio testing. It is not a production deployment. Authentication, authorization enforcement, database persistence, secret management, logging, and process supervision are still required before production use.