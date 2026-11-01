> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../../README.md) and the shipped release documents.

# ADR 003 Tenancy and browser sessions

Status: proposed.

Date: 27 October 2026.

## Context

FlowOps needs separate organization workspaces, organization-scoped roles, and a first-party browser interface. The initial deployment should remain manageable for one maintainer.

## Decision

Use a shared PostgreSQL database with `organization_id` on tenant-owned records. Require active membership and resource authorization on every operation. Add composite tenant relationships and negative isolation tests.

Use Laravel Sanctum with cookie-based session authentication for the React application. Prefer one production origin, CSRF-protected mutations, and no browser local-storage authentication tokens.

## Alternatives

A database per organization provides a stronger physical boundary but adds provisioning, migrations, connection management, and backup complexity. Browser bearer tokens introduce token storage and lifecycle work that the first-party interface does not currently need.

## Consequences

Organization queries, cache keys, file access, and background jobs all need explicit tenant context. Shared infrastructure means a database-level compromise can affect multiple organizations. Session configuration and development proxy behavior need browser verification.

## Revisit condition

Evaluate stronger isolation or external authentication when actual organizational requirements demand it. Mobile or third-party API clients need a separately designed authentication contract.

## Reference

[Laravel Sanctum SPA authentication](https://laravel.com/docs/13.x/sanctum#spa-authentication), checked on 27 October 2026.
