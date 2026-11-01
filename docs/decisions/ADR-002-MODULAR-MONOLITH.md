> Planning record from 27 October 2026. This is the earlier design exploration, not the current implementation status. See the [current project README](../../README.md) and the shipped release documents.

# ADR 002 Modular monolith

Status: proposed.

Date: 27 October 2026.

## Context

FlowOps is a solo-developer portfolio product with a transaction-heavy approval process. The owner needs clear responsibilities, a reproducible local environment, and manageable deployment.

## Decision

Use one Laravel application organized by business responsibility and one primary PostgreSQL database. Keep the React application, backend, documentation, and future infrastructure in one repository.

Use ordinary Laravel conventions with focused actions and policies. Module responsibilities are described in the [architecture](../ARCHITECTURE.md).

## Alternatives

Separate services would introduce network contracts, distributed consistency, more deployment processes, and more failure modes before the product has demonstrated a need for them. An unstructured backend would make business rules and permissions harder to reason about.

## Consequences

Core state changes can share a database transaction. Local development and delivery stay relatively simple. Boundaries still require disciplined dependencies and review; putting everything in one repository does not create good architecture automatically.

## Revisit condition

Consider extraction only when measured scaling needs, independent ownership, or a justified deployment boundary outweigh the added operational work.
