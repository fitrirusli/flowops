# FlowOps contributor and agent instructions

## Current authorization

The owner has now explicitly authorized implementation. Build the revised first release: a purchase approval engine with a fixed form, organization isolation, policy versioning, and concurrency-safe decisions. The latest scope is recorded in `docs/RELEASE_SCOPE.md`.

Keep implementation within the revised scope and preserve unrelated Laragon projects. The owner authorized GitHub repository publication on 1 November 2026. Hosted deployment remains a separate action.

A later explicit implementation request lifts the planning-only restriction for the requested scope. Do not repeatedly request approval for work the owner has already authorized.

## Owner requirements

- Project name: FlowOps.
- Keep this project inside its own directory.
- Write project documentation, product copy, code identifiers, and comments in English.
- Use React with JavaScript and JSX. Do not introduce TypeScript application source, TypeScript configuration, or a TypeScript starter template.
- Prefer readable functions, components, hooks, and module boundaries that a React JavaScript developer can follow.
- Explain material design choices in documentation and keep examples understandable.

## Implementation guidance after authorization

- Read [the documentation index](docs/README.md), [current scope](docs/RELEASE_SCOPE.md), and [implementation record](docs/IMPLEMENTATION.md) before coding. Earlier proposal and backlog documents are historical design records.
- Follow the selected release scope. Mark proposed and implemented behavior accurately.
- Keep the backend a modular monolith and use PostgreSQL as the source of truth.
- Enforce organization membership and authorization on the server for every tenant resource.
- Use cookie-based session authentication for the first-party React application.
- Validate configurable forms and workflow rules on the server. Never execute user-supplied code.
- Preserve published workflow versions and request snapshots.
- Protect state transitions with transactions, concurrency controls, and appropriate uniqueness constraints.
- Keep credentials, personal documents, real employer code, and production data out of the repository.
- Verify behavior with meaningful tests, especially authorization, versioning, and concurrent decisions.
- Record significant architecture changes in [decision records](docs/decisions/README.md).

## Scope discipline

The documents describe a proposed design, not an implemented specification. Where details conflict, preserve explicit owner requirements, then reconcile the proposal, product requirements, and affected technical documents before implementation.

Do not add microservices, billing, AI features, Kubernetes, or an unrestricted workflow language as incidental work. These are outside the initial scope.
